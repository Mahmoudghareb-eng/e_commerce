const request = require("supertest");

jest.doMock("../config/redis", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

jest .doMock("../model/product.model", () => ({
  addProduct: jest.fn(),
  getProducts: jest.fn(),
  getProductById: jest.fn(),
  getProductsByIds: jest.fn(),
  updateProduct: jest.fn(),
  updateQuantity: jest.fn(),
  deleteProduct: jest.fn()
}));

jest.doMock("../utility/redis.util", () => jest.fn());

jest.doMock("../middleware/auth.middleware", () => {
  return (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (token === "Bearer admin-token") {
      req.user = {
        id: 7,
        role: "admin",
      };

      return next();
    }

    if (token === "Bearer valid-user-token") {
      req.user = {
        id: 7,
        role: "user",
      };

      return next();
    }

    if (token === "Bearer regular-user-token") {
      req.user = {
        id: 7,
        role: "user",
      };

      return res.status(403).json({
        message: "Forbidden",
      });
    }

    return res.status(401).json({
      message: "Unauthorized",
    });
  };
});

const app = require("../app");
const redis = require("../config/redis");
const Product = require("../model/product.model");
const clearCacheByPattern = require("../utility/redis.util");

const API = "/api/v1/products";

describe("POST /api/v1/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("creates a product successfully", async () => {
    const product = {
      id: 1,
      name: "Laptop",
      description: "Gaming laptop",
      price: 1500,
      quantity: 10,
    };
    Product.addProduct.mockResolvedValue(product);
    clearCacheByPattern.mockResolvedValue();
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer admin-token")
      .send({
        name: "  Laptop  ",
        description: "  Gaming laptop  ",
        price: 1500,
        quantity: 10,
      });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Product created successfully",
      product,
    });
    expect(Product.addProduct).toHaveBeenCalledWith(
      "Laptop",
      "Gaming laptop",
      1500,
      10
    );
    expect(clearCacheByPattern).toHaveBeenCalledWith("products:*");
  });
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).post(API).send({
      name: "Laptop",
      description: "Gaming laptop",
      price: 1500,
      quantity: 10,
    });
    expect([401, 403]).toContain(response.status);
    expect(Product.addProduct).not.toHaveBeenCalled();
  });
  it("rejects non-admin users", async () => {
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer regular-user-token")
      .send({
        name: "Laptop",
        description: "Gaming laptop",
        price: 1500,
        quantity: 10,
      });
    expect([401, 403]).toContain(response.status);
    expect(Product.addProduct).not.toHaveBeenCalled();
  });
  it("rejects invalid product data", async () => {
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer admin-token")
      .send({
        name: "",
        description: "",
        price: -10,
        quantity: -1,
      });
    expect(response.status).toBe(400);
    expect(Product.addProduct).not.toHaveBeenCalled();
    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
  it("rejects a request with missing required fields", async () => {
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer admin-token")
      .send({
        name: "Laptop",
      });
    expect(response.status).toBe(400);
    expect(Product.addProduct).not.toHaveBeenCalled();
  });
  it("passes database errors to the error handler", async () => {
    Product.addProduct.mockRejectedValue(
      new Error("Database failure")
    );
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer admin-token")
      .send({
        name: "Laptop",
        description: "Gaming laptop",
        price: 1500,
        quantity: 10,
      });
    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
  it("returns an error when cache invalidation fails", async () => {
    const product = {
      id: 1,
      name: "Laptop",
      description: "Gaming laptop",
      price: 1500,
      quantity: 10,
    };
    Product.addProduct.mockResolvedValue(product);
    clearCacheByPattern.mockRejectedValue(
      new Error("Redis failure")
    );
    const response = await request(app)
      .post(API)
      .set("Authorization", "Bearer admin-token")
      .send({
        name: "Laptop",
        description: "Gaming laptop",
        price: 1500,
        quantity: 10,
      });
    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});
describe("GET /api/v1/products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns products on a cache miss", async () => {
    const products = [
      {
        id: 1,
        name: "Laptop",
        price: 1500,
        quantity: 10,
      },
      {
        id: 2,
        name: "Mouse",
        price: 50,
        quantity: 20,
      },
    ];
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    Product.getProducts.mockResolvedValue(products);
    const response = await request(app).get(
      `${API}?page=2&limit=2&search=laptop&minPrice=100&maxPrice=2000`
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(products);
    expect(redis.get).toHaveBeenCalledWith(
      "products:2:2:laptop:100:2000:"
    );
    expect(Product.getProducts).toHaveBeenCalledWith(
      "laptop",
      100,
      2000,
      undefined,
      2,
      2
    );
    expect(redis.setEx).toHaveBeenCalledWith(
      "products:2:2:laptop:100:2000:",
      60,
      JSON.stringify(products)
    );
  });
  it("returns products from cache without querying the database", async () => {
    const cachedProducts = [
      {
        id: 1,
        name: "Laptop",
        price: 1500,
        quantity: 10,
      },
    ];
    redis.get.mockResolvedValue(JSON.stringify(cachedProducts));
    const response = await request(app).get(
      `${API}?page=1&limit=10`
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual(cachedProducts);
    expect(Product.getProducts).not.toHaveBeenCalled();
    expect(redis.setEx).not.toHaveBeenCalled();
  });
  it("uses default pagination values", async () => {
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    Product.getProducts.mockResolvedValue([]);
    const response = await request(app).get(API);
    expect(response.status).toBe(200);
    expect(Product.getProducts).toHaveBeenCalledWith(
      undefined,
      null,
      null,
      undefined,
      10,
      0
    );
  });
  it("passes database errors to the error handler", async () => {
    redis.get.mockResolvedValue(null);
    Product.getProducts.mockRejectedValue(
      new Error("Database failure")
    );
    const response = await request(app).get(API);
    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});
describe("GET /api/v1/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns a product on a cache miss", async () => {
    const product = {
      id: 7,
      name: "Laptop",
      description: "Gaming laptop",
      price: 1500,
      quantity: 10,
    };
    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    Product.getProductById.mockResolvedValue(product);
    const response = await request(app).get(`${API}/7`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(product);
    expect(redis.get).toHaveBeenCalledWith("product:7");
    expect(Product.getProductById).toHaveBeenCalledWith("7");
    expect(redis.setEx).toHaveBeenCalledWith(
      "product:7",
      60,
      JSON.stringify(product)
    );
  });
  it("returns a product from cache", async () => {
    const product = {
      id: 7,
      name: "Laptop",
      price: 1500,
    };
    redis.get.mockResolvedValue(JSON.stringify(product));
    const response = await request(app).get(`${API}/7`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(product);
    expect(Product.getProductById).not.toHaveBeenCalled();
    expect(redis.setEx).not.toHaveBeenCalled();
  });
  it("returns 404 when the product does not exist", async () => {
    redis.get.mockResolvedValue(null);
    Product.getProductById.mockResolvedValue(null);
    const response = await request(app).get(`${API}/7`);
    expect(response.status).toBe(404);
    expect(redis.setEx).not.toHaveBeenCalled();
  });
  it("rejects an invalid product ID", async () => {
    const response = await request(app).get(`${API}/invalid-id`);
    expect([400, 422]).toContain(response.status);
    expect(Product.getProductById).not.toHaveBeenCalled();
  });
});
describe("PUT /api/v1/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("updates a product and clears its caches", async () => {
    const existingProduct = {
      id: 7,
      name: "Laptop",
      price: 1500,
      quantity: 10,
    };
    const updatedProduct = {
      id: 7,
      name: "Laptop",
      price: 1400,
      quantity: 15,
    };
    Product.getProductById.mockResolvedValue(existingProduct);
    Product.updateProduct.mockResolvedValue(updatedProduct);
    redis.del.mockResolvedValue(1);
    clearCacheByPattern.mockResolvedValue();
    const response = await request(app)
      .put(`${API}/7`)
      .set("Authorization", "Bearer admin-token")
      .send({
        price: 1400,
        quantity: 15,
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Product updated successfully",
      product: updatedProduct,
    });
    expect(Product.getProductById).toHaveBeenCalledWith("7");
    expect(Product.updateProduct).toHaveBeenCalledWith(
      "7",
      15,
      1400
    );
    expect(redis.del).toHaveBeenCalledWith("product:7");
    expect(clearCacheByPattern).toHaveBeenCalledWith("products:*");
  });
  it("returns 404 when updating a non-existing product", async () => {
    Product.getProductById.mockResolvedValue(null);
    const response = await request(app)
      .put(`${API}/7`)
      .set("Authorization", "Bearer admin-token")
      .send({
        price: 1400,
        quantity: 15,
      });
    expect(response.status).toBe(404);
    expect(Product.updateProduct).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
  it("rejects non-admin users", async () => {
    const response = await request(app)
      .put(`${API}/7`)
      .set("Authorization", "Bearer regular-user-token")
      .send({
        price: 1400,
        quantity: 15,
      });
    expect([401, 403]).toContain(response.status);
    expect(Product.updateProduct).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .put(`${API}/7`)
      .send({
        price: 1400,
        quantity: 15,
      });
    expect([401, 403]).toContain(response.status);
    expect(Product.updateProduct).not.toHaveBeenCalled();
  });
});
describe("DELETE /api/v1/products/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("deletes a product and clears its caches", async () => {
    const deletedProduct = {
      id: 7,
      name: "Laptop",
    };
    Product.deleteProduct.mockResolvedValue(deletedProduct);
    redis.del.mockResolvedValue(1);
    clearCacheByPattern.mockResolvedValue();
    const response = await request(app)
      .delete(`${API}/7`)
      .set("Authorization", "Bearer admin-token");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Product deleted successfully",
    });
    expect(Product.deleteProduct).toHaveBeenCalledWith("7");
    expect(redis.del).toHaveBeenCalledWith("product:7");
    expect(clearCacheByPattern).toHaveBeenCalledWith("products:*");
  });
  it("returns 404 when the product does not exist", async () => {
    Product.deleteProduct.mockResolvedValue(null);
    const response = await request(app)
      .delete(`${API}/7`)
      .set("Authorization", "Bearer admin-token");
    expect(response.status).toBe(404);
    expect(redis.del).not.toHaveBeenCalled();
    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
  it("rejects non-admin users", async () => {
    const response = await request(app)
      .delete(`${API}/7`)
      .set("Authorization", `Bearer regular-user-token`);
    expect([401, 403]).toContain(response.status);
    expect(Product.deleteProduct).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(`${API}/7`);
    expect([401, 403]).toContain(response.status);
    expect(Product.deleteProduct).not.toHaveBeenCalled();
  });
  it("passes database errors to the error handler", async () => {
    Product.deleteProduct.mockRejectedValue(
      new Error("Database failure")
    );
    const response = await request(app)
      .delete(`${API}/7`)
      .set("Authorization", "Bearer admin-token");
    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(redis.del).not.toHaveBeenCalled();
    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
});