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

jest.mock("../model/cart.model", () => ({
  getCartbyUser: jest.fn(),
  createCart: jest.fn(),
  clearCart: jest.fn(),
  deleteCart: jest.fn(),
}));

jest.mock("../config/logger", () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");
const Cart = require("../model/cart.model");

const API = "/api/v1/cart";
const userToken = "user-token";

describe("POST /api/v1/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a cart successfully", async () => {
    const cart = {
      id: 10,
      user_id: 7,
    };

    Cart.getCartbyUser.mockResolvedValue(null);
    Cart.createCart.mockResolvedValue(cart);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      message: "cart created successfully",
      cart,
    });

    expect(Cart.getCartbyUser).toHaveBeenCalledWith(7);
    expect(Cart.createCart).toHaveBeenCalledWith(7);
  });

  it("returns 400 when the user already has a cart", async () => {
    const existingCart = {
      id: 10,
      user_id: 7,
    };

    Cart.getCartbyUser.mockResolvedValue(existingCart);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(Cart.createCart).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    Cart.getCartbyUser.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(Cart.createCart).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).post(API);

    expect([401, 403]).toContain(response.status);
    expect(Cart.getCartbyUser).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the user's cart", async () => {
    const cart = {
      id: 10,
      user_id: 7,
    };

    const response = await request(app)
      .get(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      cart,
    });
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get(API);

    expect([401, 403]).toContain(response.status);
  });
});

describe("DELETE /api/v1/cart/clear", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears the user's cart", async () => {
    Cart.clearCart.mockResolvedValue({
      rowCount: 1,
    });

    const response = await request(app)
      .delete(`${API}/clear`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "cart cleared successfully",
    });

    expect(Cart.clearCart).toHaveBeenCalledWith(10);
  });

  it("passes database errors to the error handler", async () => {
    Cart.clearCart.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(`${API}/clear`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(`${API}/clear`);

    expect([401, 403]).toContain(response.status);
    expect(Cart.clearCart).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes the user's cart", async () => {
    const deleted = {
      id: 10,
      user_id: 7,
    };

    Cart.deleteCart.mockResolvedValue(deleted);

    const response = await request(app)
      .delete(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "cart deleted successfully",
      deleted,
    });

    expect(Cart.deleteCart).toHaveBeenCalledWith(7);
  });

  it("passes database errors to the error handler", async () => {
    Cart.deleteCart.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(API)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(API);

    expect([401, 403]).toContain(response.status);
    expect(Cart.deleteCart).not.toHaveBeenCalled();
  });
});