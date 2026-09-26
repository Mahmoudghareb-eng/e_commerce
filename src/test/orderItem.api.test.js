process.env.NODE_ENV = "test";

const TEST_SECRET = "test-secret";

process.env.JWT_SECRET = TEST_SECRET;
process.env.JWT_ACCESS_SECRET = TEST_SECRET;
process.env.ACCESS_TOKEN_SECRET = TEST_SECRET;

const jwt = require("jsonwebtoken");

jest.mock("../model/orderItem.model", () => ({
  getItemsByOrderId: jest.fn(),
  getOrderItemById: jest.fn(),
  updateOrderItem: jest.fn(),
  deleteOrderItem: jest.fn(),
}));

jest.mock("../model/order.model", () => ({
  getOrderById: jest.fn(),
}));

// CHANGED: Mock User model because auth middleware calls User.getUserById()
jest.mock("../model/user.model", () => ({
  getUserById: jest.fn(),
}));

jest.mock("../config/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");

const OrderItems = require("../model/orderItem.model");
const Order = require("../model/order.model");

// CHANGED: Import mocked User model
const User = require("../model/user.model");

const API = "/api/v1/orders/items";

const userToken = jwt.sign(
  {
    id: 7,
    userId: 7,
    role: "user",
  },
  TEST_SECRET
);

const anotherUserToken = jwt.sign(
  {
    id: 8,
    userId: 8,
    role: "user",
  },
  TEST_SECRET
);

// CHANGED: Return the user represented by the token
beforeEach(() => {
  jest.clearAllMocks();

  User.getUserById.mockImplementation(async (id) => {
    return {
      id,
      role: "user",
    };
  });
});

describe("GET /api/v1/order-items/order/:order_id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns order items successfully", async () => {
    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    const orderItems = [
      {
        id: 1,
        order_id: 12,
        product_id: 5,
        quantity: 2,
        price: 100,
      },
    ];

    Order.getOrderById.mockResolvedValue(order);
    OrderItems.getItemsByOrderId.mockResolvedValue(orderItems);

    const response = await request(app)
      .get(`${API}/order/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Order items fetched successfully",
      order_items: orderItems,
    });

    expect(Order.getOrderById).toHaveBeenCalledWith(12);
    expect(OrderItems.getItemsByOrderId).toHaveBeenCalledWith(12);
  });

  it("returns 404 when the order does not exist", async () => {
    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .get(`${API}/order/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(OrderItems.getItemsByOrderId).not.toHaveBeenCalled();
  });

  it("rejects access to another user's order", async () => {
    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 99,
      status: "pending",
    });

    const response = await request(app)
      .get(`${API}/order/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(OrderItems.getItemsByOrderId).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 7,
      status: "pending",
    });

    OrderItems.getItemsByOrderId.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get(`${API}/order/12`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

describe("GET /api/v1/order-items/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns one order item successfully", async () => {
    const orderItem = {
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
      price: 100,
    };

    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    OrderItems.getOrderItemById.mockResolvedValue(orderItem);
    Order.getOrderById.mockResolvedValue(order);

    const response = await request(app)
      .get(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Order item fetched successfully",
      order_item: orderItem,
    });

    expect(OrderItems.getOrderItemById).toHaveBeenCalledWith(1);
    expect(Order.getOrderById).toHaveBeenCalledWith(12);
  });

  it("returns 404 when the order item does not exist", async () => {
    OrderItems.getOrderItemById.mockResolvedValue(null);

    const response = await request(app)
      .get(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(Order.getOrderById).not.toHaveBeenCalled();
  });

  it("returns 404 when the related order does not exist", async () => {
    OrderItems.getOrderItemById.mockResolvedValue({
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
    });

    Order.getOrderById.mockResolvedValue(null);

    const response = await request(app)
      .get(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("rejects access to another user's order item", async () => {
    OrderItems.getOrderItemById.mockResolvedValue({
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
    });

    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 99,
      status: "pending",
    });

    const response = await request(app)
      .get(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it("rejects an invalid item ID", async () => {
    const response = await request(app)
      .get(`${API}/invalid-id`)
      .set("Authorization", `Bearer ${userToken}`);

    expect([400, 422]).toContain(response.status);
    expect(OrderItems.getOrderItemById).not.toHaveBeenCalled();
  });
});

describe("PUT /api/v1/order-items/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates an order item successfully", async () => {
    const orderItem = {
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
      price: 100,
    };

    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    const updatedItem = {
      ...orderItem,
      quantity: 5,
    };

    OrderItems.getOrderItemById.mockResolvedValue(orderItem);
    Order.getOrderById.mockResolvedValue(order);
    OrderItems.updateOrderItem.mockResolvedValue(updatedItem);

    const response = await request(app)
      .put(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Order item updated successfully",
      order_item: updatedItem,
    });

    expect(OrderItems.getOrderItemById).toHaveBeenCalledWith("1");
    expect(Order.getOrderById).toHaveBeenCalledWith(12);
    expect(OrderItems.updateOrderItem).toHaveBeenCalledWith("1", 5);
  });

  it("rejects an invalid quantity", async () => {
    const response = await request(app)
      .put(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 0,
      });

    expect(response.status).toBe(400);
    expect(OrderItems.getOrderItemById).not.toHaveBeenCalled();
    expect(OrderItems.updateOrderItem).not.toHaveBeenCalled();
  });

  it("returns 404 when the order item does not exist", async () => {
    OrderItems.getOrderItemById.mockResolvedValue(null);

    const response = await request(app)
      .put(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(404);
    expect(OrderItems.updateOrderItem).not.toHaveBeenCalled();
  });

  it("rejects updating another user's order item", async () => {
    OrderItems.getOrderItemById.mockResolvedValue({
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
    });

    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 99,
      status: "pending",
    });

    const response = await request(app)
      .put(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(403);
    expect(OrderItems.updateOrderItem).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    OrderItems.getOrderItemById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .put(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBeGreaterThanOrEqual(500);
  });
});

describe("DELETE /api/v1/order-items/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes an order item successfully", async () => {
    const orderItem = {
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
    };

    const order = {
      id: 12,
      user_id: 7,
      status: "pending",
    };

    OrderItems.getOrderItemById.mockResolvedValue(orderItem);
    Order.getOrderById.mockResolvedValue(order);
    OrderItems.deleteOrderItem.mockResolvedValue(orderItem);

    const response = await request(app)
      .delete(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Order item deleted successfully",
      order_item: orderItem,
    });

    expect(OrderItems.getOrderItemById).toHaveBeenCalledWith("1");
    expect(Order.getOrderById).toHaveBeenCalledWith(12);
    expect(OrderItems.deleteOrderItem).toHaveBeenCalledWith("1");
  });

  it("returns 404 when deleting a non-existing order item", async () => {
    OrderItems.getOrderItemById.mockResolvedValue(null);

    const response = await request(app)
      .delete(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(OrderItems.deleteOrderItem).not.toHaveBeenCalled();
  });

  it("rejects deleting another user's order item", async () => {
    OrderItems.getOrderItemById.mockResolvedValue({
      id: 1,
      order_id: 12,
      product_id: 5,
      quantity: 2,
    });

    Order.getOrderById.mockResolvedValue({
      id: 12,
      user_id: 99,
      status: "pending",
    });

    const response = await request(app)
      .delete(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(OrderItems.deleteOrderItem).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    OrderItems.getOrderItemById.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(`${API}/1`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(`${API}/1`);

    expect([401, 403]).toContain(response.status);
    expect(OrderItems.deleteOrderItem).not.toHaveBeenCalled();
  });
});