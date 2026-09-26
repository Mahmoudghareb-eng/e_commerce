process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const jwt = require("jsonwebtoken");

jest.mock("../model/coupons.model", () => ({
  getCouponsByCode: jest.fn(),
  addCoupons: jest.fn(),
  deleteCoupons: jest.fn(),
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

const Coupons = require("../model/coupons.model");

// CHANGED: Get mocked User model
const User = require("../model/user.model");

const API = "/api/v1/coupons";

const userToken = jwt.sign(
  {
    id: 7,
    userId: 7,
    role: "user",
    isAdmin: false,
  },
  process.env.JWT_SECRET
);

const adminToken = jwt.sign(
  {
    id: 7,
    userId: 7,
    role: "admin",
    isAdmin: true,
  },
  process.env.JWT_SECRET
);

// CHANGED: Helper for admin user
const mockAdmin = () => {
  User.getUserById.mockResolvedValue({
    id: 7,
    email: "admin@test.com",
    role: "admin",
    isAdmin: true,
  });
};

// CHANGED: Helper for normal user
const mockUser = () => {
  User.getUserById.mockResolvedValue({
    id: 7,
    email: "user@test.com",
    role: "user",
    isAdmin: false,
  });
};

describe("POST /api/v1/coupons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a coupon successfully", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const coupon = {
      code: "SAVE10",
      discount_percent: 10,
      expires_at: "2030-12-31",
    };

    Coupons.getCouponsByCode.mockResolvedValue(null);
    Coupons.addCoupons.mockResolvedValue(coupon);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "SAVE10",
        discount_percent: 10,
        expires_at: "2030-12-31",
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      msg: "create successfully",
      coupon,
    });

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("SAVE10");

    expect(Coupons.addCoupons).toHaveBeenCalledWith(
      "SAVE10",
      10,
      "2030-12-31"
    );
  });

  it("returns 400 when the coupon already exists", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const existingCoupon = {
      code: "SAVE10",
      discount_percent: 10,
      expires_at: "2030-12-31",
    };

    Coupons.getCouponsByCode.mockResolvedValue(existingCoupon);

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "SAVE10",
        discount_percent: 10,
        expires_at: "2030-12-31",
      });

    expect(response.status).toBe(400);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("SAVE10");

    expect(Coupons.addCoupons).not.toHaveBeenCalled();
  });

  it("rejects invalid coupon data", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "",
        discount_percent: -10,
        expires_at: "invalid-date",
      });

    expect([400, 422]).toContain(response.status);

    expect(Coupons.getCouponsByCode).not.toHaveBeenCalled();

    expect(Coupons.addCoupons).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    Coupons.getCouponsByCode.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "SAVE10",
        discount_percent: 10,
        expires_at: "2030-12-31",
      });

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("SAVE10");

    expect(Coupons.addCoupons).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    // CHANGED: Mock authenticated normal user
    mockUser();

    const response = await request(app)
      .post(API)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        code: "SAVE10",
        discount_percent: 10,
        expires_at: "2030-12-31",
      });

    expect([401, 403]).toContain(response.status);

    expect(Coupons.addCoupons).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app)
      .post(API)
      .send({
        code: "SAVE10",
        discount_percent: 10,
        expires_at: "2030-12-31",
      });

    expect([401, 403]).toContain(response.status);

    expect(Coupons.addCoupons).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/coupons/:code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a coupon successfully", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const coupon = {
      code: "SAVE10",
      discount_percent: 10,
      expires_at: "2030-12-31",
    };

    Coupons.getCouponsByCode.mockResolvedValue(coupon);

    const response = await request(app)
      .get(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      coupon,
    });

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("SAVE10");
  });

  it("returns 404 when the coupon does not exist", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    Coupons.getCouponsByCode.mockResolvedValue(null);

    const response = await request(app)
      .get(`${API}/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("NOTFOUND");
  });

  it("rejects an invalid coupon code", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const response = await request(app)
      .get(`${API}/`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([400, 404, 422]).toContain(response.status);

    expect(Coupons.getCouponsByCode).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    Coupons.getCouponsByCode.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .get(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(Coupons.getCouponsByCode).toHaveBeenCalledWith("SAVE10");
  });

  it("rejects non-admin users", async () => {
    // CHANGED: Mock authenticated normal user
    mockUser();

    const response = await request(app)
      .get(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${userToken}`);

    expect([401, 403]).toContain(response.status);

    expect(Coupons.getCouponsByCode).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get(`${API}/SAVE10`);

    expect([401, 403]).toContain(response.status);

    expect(Coupons.getCouponsByCode).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/v1/coupons/:code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes a coupon successfully", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const deletedCoupon = {
      code: "SAVE10",
      discount_percent: 10,
      expires_at: "2030-12-31",
    };

    Coupons.deleteCoupons.mockResolvedValue(deletedCoupon);

    const response = await request(app)
      .delete(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      coupon: deletedCoupon,
    });

    expect(User.getUserById).toHaveBeenCalledWith(7);

    expect(Coupons.deleteCoupons).toHaveBeenCalledWith("SAVE10");
  });

  it("returns 404 when the coupon does not exist", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    Coupons.deleteCoupons.mockResolvedValue(null);

    const response = await request(app)
      .delete(`${API}/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);

    expect(Coupons.deleteCoupons).toHaveBeenCalledWith("NOTFOUND");
  });

  it("passes database errors to the error handler", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    Coupons.deleteCoupons.mockRejectedValue(
      new Error("Database failure")
    );

    const response = await request(app)
      .delete(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBeGreaterThanOrEqual(500);

    expect(Coupons.deleteCoupons).toHaveBeenCalledWith("SAVE10");
  });

  it("rejects an invalid coupon code", async () => {
    // CHANGED: Mock authenticated admin user
    mockAdmin();

    const response = await request(app)
      .delete(`${API}/`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([400, 404, 422]).toContain(response.status);

    expect(Coupons.deleteCoupons).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    // CHANGED: Mock authenticated normal user
    mockUser();

    const response = await request(app)
      .delete(`${API}/SAVE10`)
      .set("Authorization", `Bearer ${userToken}`);

    expect([401, 403]).toContain(response.status);

    expect(Coupons.deleteCoupons).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).delete(`${API}/SAVE10`);

    expect([401, 403]).toContain(response.status);

    expect(Coupons.deleteCoupons).not.toHaveBeenCalled();
  });
});