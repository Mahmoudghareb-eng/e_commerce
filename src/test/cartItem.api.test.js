process.env.NODE_ENV = "test";

jest.mock("../middleware/auth.middleware", () => {
  return (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authorization.replace("Bearer ", "");

    if (token === "user-token") {
      req.user = {
        id: 7,
        role: "user",
      };

      return next();
    }

    return res.status(401).json({
      message: "Unauthorized",
    });
  };
});

jest.mock("../middleware/cart.middleware", () => {
  return (req, res, next) => {
    req.cart = {
      id: 10,
      user_id: 7,
    };

    next();
  };
});

jest.mock("../model/cartItem.model", () => ({
  getCartItemByProduct: jest.fn(),
  updateCartItemQuantity: jest.fn(),
  addItemToCart: jest.fn(),
  getCartItems: jest.fn(),
  getCartItemById: jest.fn(),
  removeCartItem: jest.fn(),
}));

jest.mock("../model/product.model", () => ({
  getProductById: jest.fn(),
}));

jest.mock("../config/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");
const CartItem = require("../model/cartItem.model");
const Product = require("../model/product.model");

const API = "/api/v1/cart/items";
const userToken = "user-token";

describe("POST /api/v1/cart-items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds a new item to the cart", async () => {
    const product = {
      id: 5,
      price: 100,
      quantity: 10,
    };

    const cartItem = {
      id: 1,
      cart_id: 10,
      product_id: 5,
      quantity: 2,
      price: 100,
    };

    Product.getProductById.mockResolvedValue(product);
    CartItem.getCartItemByProduct.mockResolvedValue(null);
    CartItem.addItemToCart.mockResolvedValue(cartItem);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        product_id: 5,
        quantity: 2,
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "Item added successfully",
      cartItem,
    });

    expect(Product.getProductById).toHaveBeenCalledWith(5);
    expect(CartItem.getCartItemByProduct).toHaveBeenCalledWith(10, 5);
    expect(CartItem.addItemToCart).toHaveBeenCalledWith(10, 5, 2);
  });

  it("updates the quantity when the product already exists in the cart", async () => {
    const product = {
      id: 5,
      price: 100,
      quantity: 10,
    };

    const existingItem = {
      id: 20,
      cart_id: 10,
      product_id: 5,
      quantity: 2,
    };

    const updatedItem = {
      ...existingItem,
      quantity: 5,
    };

    Product.getProductById.mockResolvedValue(product);
    CartItem.getCartItemByProduct.mockResolvedValue(existingItem);
    CartItem.updateCartItemQuantity.mockResolvedValue(updatedItem);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        product_id: 5,
        quantity: 3,
      });

    expect(response.status).toBe(201);
    expect(response.body.cartItem).toEqual(updatedItem);

    expect(CartItem.updateCartItemQuantity).toHaveBeenCalledWith(
      20,
      5
    );

    expect(CartItem.addItemToCart).not.toHaveBeenCalled();
  });

  it("returns 404 when the product does not exist", async () => {
    Product.getProductById.mockResolvedValue(null);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        product_id: 999,
        quantity: 2,
      });

    expect(response.status).toBe(404);
    expect(CartItem.addItemToCart).not.toHaveBeenCalled();
  });

  it("returns 400 when the product is out of stock", async () => {
    Product.getProductById.mockResolvedValue({
      id: 5,
      price: 100,
      quantity: 0,
    });

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        product_id: 5,
        quantity: 2,
      });

    expect(response.status).toBe(400);
    expect(CartItem.addItemToCart).not.toHaveBeenCalled();
  });

  it("returns 400 when the requested quantity exceeds stock", async () => {
    Product.getProductById.mockResolvedValue({
      id: 5,
      price: 100,
      quantity: 3,
    });

    CartItem.getCartItemByProduct.mockResolvedValue(null);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        product_id: 5,
        quantity: 5,
      });

    expect(response.status).toBe(400);
    expect(CartItem.addItemToCart).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).post(API).send({
      product_id: 5,
      quantity: 2,
    });

    expect([401, 403]).toContain(response.status);
    expect(Product.getProductById).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/cart-items", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all cart items", async () => {
    const cartItems = [
      {
        id: 1,
        cart_id: 10,
        product_id: 5,
        quantity: 2,
        price: 100,
      },
    ];

    CartItem.getCartItems.mockResolvedValue(cartItems);

    const response = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      cartItems,
    });

    expect(CartItem.getCartItems).toHaveBeenCalledWith(10);
  });

  it("passes database errors to the error handler", async () => {
    CartItem.getCartItems.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

describe("PUT /api/v1/cart-items/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates cart item quantity", async () => {
    const item = {
      id: 20,
      cart_id: 10,
      product_id: 5,
      quantity: 2,
    };

    const product = {
      id: 5,
      quantity: 10,
    };

    const updated = {
      ...item,
      quantity: 6,
    };

    CartItem.getCartItemById.mockResolvedValue(item);
    Product.getProductById.mockResolvedValue(product);
    CartItem.updateCartItemQuantity.mockResolvedValue(updated);

    const response = await request(app)
      .put(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 6,
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Updated successfully",
      updated,
    });

    expect(CartItem.getCartItemById).toHaveBeenCalledWith("20");
    expect(Product.getProductById).toHaveBeenCalledWith(5);
    expect(CartItem.updateCartItemQuantity).toHaveBeenCalledWith(
      "20",
      6
    );
  });

  it("returns 400 for an invalid quantity", async () => {
    const response = await request(app)
      .put(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 0,
      });

    expect(response.status).toBe(400);
    expect(CartItem.getCartItemById).not.toHaveBeenCalled();
  });

  it("returns 404 when the cart item does not exist", async () => {
    CartItem.getCartItemById.mockResolvedValue(null);

    const response = await request(app)
      .put(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 3,
      });

    expect(response.status).toBe(404);
    expect(CartItem.updateCartItemQuantity).not.toHaveBeenCalled();
  });

  it("rejects updating an item belonging to another cart", async () => {
    CartItem.getCartItemById.mockResolvedValue({
      id: 20,
      cart_id: 99,
      product_id: 5,
      quantity: 2,
    });

    const response = await request(app)
      .put(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 3,
      });

    expect(response.status).toBe(403);
    expect(CartItem.updateCartItemQuantity).not.toHaveBeenCalled();
  });

  it("returns 400 when quantity exceeds product stock", async () => {
    CartItem.getCartItemById.mockResolvedValue({
      id: 20,
      cart_id: 10,
      product_id: 5,
      quantity: 2,
    });

    Product.getProductById.mockResolvedValue({
      id: 5,
      quantity: 3,
    });

    const response = await request(app)
      .put(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(400);
    expect(CartItem.updateCartItemQuantity).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/cart-items/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes an item from the cart", async () => {
    const item = {
      id: 20,
      cart_id: 10,
      product_id: 5,
      quantity: 2,
    };

    CartItem.getCartItemById.mockResolvedValue(item);
    CartItem.removeCartItem.mockResolvedValue(item);

    const response = await request(app)
      .delete(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      msg: "Deleted successfully",
      cartItem: item,
    });

    expect(CartItem.getCartItemById).toHaveBeenCalledWith("20");
    expect(CartItem.removeCartItem).toHaveBeenCalledWith("20");
  });

  it("returns 404 when the cart item does not exist", async () => {
    CartItem.getCartItemById.mockResolvedValue(null);

    const response = await request(app)
      .delete(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(CartItem.removeCartItem).not.toHaveBeenCalled();
  });

  it("rejects deleting an item belonging to another cart", async () => {
    CartItem.getCartItemById.mockResolvedValue({
      id: 20,
      cart_id: 99,
      product_id: 5,
      quantity: 2,
    });

    const response = await request(app)
      .delete(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(CartItem.removeCartItem).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    CartItem.getCartItemById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(`${API}/20`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(`${API}/20`);

    expect([401, 403]).toContain(response.status);
    expect(CartItem.removeCartItem).not.toHaveBeenCalled();
  });
});