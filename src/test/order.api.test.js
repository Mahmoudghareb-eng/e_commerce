process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const jwt = require("jsonwebtoken");

jest.mock("../config/db", () => ({
  connect: jest.fn(),
}));

jest.mock("../config/redis", () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
}));

jest.mock("../model/order.model", () => ({
  getOrdersByUser: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  deleteOrder: jest.fn(),
}));

jest.mock("../model/product.model", () => ({
  getProductsByIds: jest.fn(),
  updateQuantity: jest.fn(),
}));

jest.mock("../model/orderItem.model", () => ({
  getItemsByOrderId: jest.fn(),
}));

jest.mock("../utility/redis.util", () => jest.fn());

jest.mock("../config/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../middleware/auth.middleware", () => {
  return (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    if (header === "Bearer user-token") {
      req.user = {
        id: 7,
        role: "user",
        isAdmin: false,
      };

      return next();
    }

    if (header === "Bearer another-user-token") {
      req.user = {
        id: 8,
        role: "user",
        isAdmin: false,
      };

      return next();
    }

    if (header === "Bearer admin-token") {
      req.user = {
        id: 7,
        role: "admin",
        isAdmin: true,
      };

      return next();
    }

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  };
});

const request = require("supertest");
const app = require("../app");

const db = require("../config/db");
const redis = require("../config/redis");

const Order = require("../model/order.model");
const Product = require("../model/product.model");
const OrderItems = require("../model/orderItem.model");

const clearCacheByPattern = require("../utility/redis.util");

const API = "/api/v1/orders";

const userToken = "user-token";

const anotherUserToken = "another-user-token";

const adminToken = "admin-token";

describe("GET /api/v1/orders/myorders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the authenticated user's orders on cache miss", async () => {
    const orders = [
      {
        id: 1,
        user_id: 7,
        status: "pending",
        total_price: 100,
      },
    ];

    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");
    Order.getOrdersByUser.mockResolvedValue(orders);

    const response = await request(app)
      .get(`${API}/myorders`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Orders fetched successfully",
      orders,
    });

    expect(redis.get).toHaveBeenCalledWith("orders:7");

    expect(Order.getOrdersByUser).toHaveBeenCalledWith(7);

    expect(redis.setEx).toHaveBeenCalledWith(
      "orders:7",
      60,
      JSON.stringify(orders)
    );
  });

  it("returns the authenticated user's orders from cache", async () => {
    const orders = [
      {
        id: 1,
        user_id: 7,
        status: "pending",
      },
    ];

    redis.get.mockResolvedValue(JSON.stringify(orders));

    const response = await request(app)
      .get(`${API}/myorders`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Orders fetched successfully",
      orders,
    });

    expect(Order.getOrdersByUser).not.toHaveBeenCalled();

    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get(`${API}/myorders`);

    expect([401, 403]).toContain(response.status);

    expect(Order.getOrdersByUser).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    redis.get.mockResolvedValue(null);

    Order.getOrdersByUser.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get(`${API}/myorders`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

// ======================================================
// GET /api/v1/orders/:id
// ======================================================

describe("GET /api/v1/orders/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an order owned by the authenticated user", async () => {
    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    redis.get.mockResolvedValue(null);
    redis.setEx.mockResolvedValue("OK");

    Order.getOrderById.mockResolvedValue(order);

    const response = await request(app)
      .get(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Order fetched successfully",
      order,
    });

    expect(Order.getOrderById).toHaveBeenCalledWith("12");

    expect(redis.get).toHaveBeenCalledWith("order:12");

    expect(redis.setEx).toHaveBeenCalledWith(
      "order:12",
      60,
      JSON.stringify(order)
    );
  });

  it("allows an admin to view any order", async () => {
    const order = {
      id: 12,
      user_id: 99,
      status: "pending",
    };

    redis.get.mockResolvedValue(JSON.stringify(order));

    const response = await request(app)
      .get(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(response.body.order).toEqual(order);

    expect(Order.getOrderById).not.toHaveBeenCalled();
  });

  it("rejects access to another user's order", async () => {
    const order = {
      id: 12,
      user_id: 99,
      status: "pending",
    };

    redis.get.mockResolvedValue(null);

    Order.getOrderById.mockResolvedValue(order);

    const response = await request(app)
      .get(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it("returns 404 when the order does not exist", async () => {
    redis.get.mockResolvedValue(null);

    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .get(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);

    expect(redis.setEx).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    redis.get.mockResolvedValue(null);

    Order.getOrderById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

// ======================================================
// PUT /api/v1/orders/:id
// ======================================================

describe("PUT /api/v1/orders/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates an order status as an admin", async () => {
    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    const updatedOrder = {
      ...order,
      status: "shipped",
    };

    Order.getOrderById.mockResolvedValue(order);

    Order.updateOrderStatus.mockResolvedValue(updatedOrder);

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .put(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "shipped",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Order updated successfully",
      order: updatedOrder,
    });

    expect(Order.getOrderById).toHaveBeenCalledWith("12");

    expect(Order.updateOrderStatus).toHaveBeenCalledWith(
      "12",
      "shipped"
    );

    expect(redis.del).toHaveBeenCalledWith("order:12");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "orders:*"
    );
  });

  it("returns 404 when updating a non-existing order", async () => {
    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .put(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "shipped",
      });

    expect(response.status).toBe(404);

    expect(Order.updateOrderStatus).not.toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    const response = await request(app)
      .put(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        status: "shipped",
      });

    expect([401, 403]).toContain(response.status);

    expect(Order.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    Order.getOrderById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .put(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "shipped",
      });

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(Order.updateOrderStatus).not.toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();
  });
});

// ======================================================
// PATCH /api/v1/orders/:id/cancel
// ======================================================

describe("PATCH /api/v1/orders/:id/cancel", () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };

    db.connect.mockResolvedValue(client);
  });

  it("cancels a pending order and restores product stock", async () => {
    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    const items = [
      {
        product_id: 10,
        quantity: 2,
      },
    ];

    const products = [
      {
        id: 10,
        quantity: 5,
      },
    ];

    Order.getOrderById.mockResolvedValue(order);

    OrderItems.getItemsByOrderId.mockResolvedValue(items);

    Product.getProductsByIds.mockResolvedValue(products);

    Product.updateQuantity.mockResolvedValue();

    Order.updateOrderStatus.mockResolvedValue();

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .patch(`${API}/12/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Order cancelled successfully",
    });

    expect(db.connect).toHaveBeenCalled();

    expect(client.query).toHaveBeenCalledWith("BEGIN");

    expect(client.query).toHaveBeenCalledWith("COMMIT");

    expect(Order.getOrderById).toHaveBeenCalledWith(
      "12",
      client
    );

    expect(OrderItems.getItemsByOrderId).toHaveBeenCalledWith(
      "12",
      client
    );

    expect(Product.getProductsByIds).toHaveBeenCalledWith(
      [10],
      client
    );

    expect(Product.updateQuantity).toHaveBeenCalledWith(
      10,
      7,
      client
    );

    expect(Order.updateOrderStatus).toHaveBeenCalledWith(
      "12",
      "cancelled",
      client
    );

    expect(redis.del).toHaveBeenCalledWith("order:12");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "orders:*"
    );

    expect(client.release).toHaveBeenCalled();
  });

  it("rejects cancelling another user's order", async () => {
    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 99,
      status: "pending",
    });

    const response = await request(app)
      .patch(`${API}/12/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);

    expect(client.query).toHaveBeenCalledWith("ROLLBACK");

    expect(Product.getProductsByIds).not.toHaveBeenCalled();

    expect(client.release).toHaveBeenCalled();
  });

  it("rejects cancelling a non-pending order", async () => {
    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 7,
      status: "shipped",
    });

    const response = await request(app)
      .patch(`${API}/12/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);

    expect(client.query).toHaveBeenCalledWith("ROLLBACK");

    expect(OrderItems.getItemsByOrderId).not.toHaveBeenCalled();

    expect(client.release).toHaveBeenCalled();
  });

  it("returns 404 when cancelling a non-existing order", async () => {
    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .patch(`${API}/12/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);

    expect(client.query).toHaveBeenCalledWith("ROLLBACK");

    expect(client.release).toHaveBeenCalled();
  });

  it("rolls back the transaction when a database error occurs", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };

    db.connect.mockResolvedValue(client);

    Order.getOrderById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .patch(`${API}/12/cancel`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(client.query).toHaveBeenCalledWith("BEGIN");

    expect(client.query).toHaveBeenCalledWith("ROLLBACK");

    expect(client.release).toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
});

// ======================================================
// DELETE /api/v1/orders/:id
// ======================================================

describe("DELETE /api/v1/orders/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes an order as an admin", async () => {
    const order = {
      id: 12,
      user_id: 7,
      status: "cancelled",
    };

    Order.getOrderById.mockResolvedValue(order);

    Order.deleteOrder.mockResolvedValue(order);

    redis.del.mockResolvedValue(1);

    clearCacheByPattern.mockResolvedValue();

    const response = await request(app)
      .delete(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Order deleted successfully",
    });

    expect(Order.getOrderById).toHaveBeenCalledWith("12");

    expect(Order.deleteOrder).toHaveBeenCalledWith("12");

    expect(redis.del).toHaveBeenCalledWith("order:12");

    expect(clearCacheByPattern).toHaveBeenCalledWith(
      "orders:*"
    );
  });

  it("returns 404 when deleting a non-existing order", async () => {
    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .delete(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);

    expect(Order.deleteOrder).not.toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    const response = await request(app)
      .delete(`${API}/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect([401, 403]).toContain(response.status);

    expect(Order.deleteOrder).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .delete(`${API}/12`);

    expect([401, 403]).toContain(response.status);

    expect(Order.deleteOrder).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    Order.getOrderById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(`${API}/12`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(Order.deleteOrder).not.toHaveBeenCalled();

    expect(redis.del).not.toHaveBeenCalled();

    expect(clearCacheByPattern).not.toHaveBeenCalled();
  });
});