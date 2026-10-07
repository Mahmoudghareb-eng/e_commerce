const request = require("supertest");
const express = require("express");

jest.mock("../middleware/auth.middleware", () => {
    return (req, res, next) => {
        req.user = {
            id: 7
        };

        next();
    };
});

jest.mock("../middleware/cart.middleware", () => {
    return (req, res, next) => {
        req.cart = {
            id: 10
        };

        next();
    };
});

const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

jest.mock("../config/db", () => ({
    connect: jest.fn()
}));

const db = require("../config/db");

jest.mock("../model/cartItem.model", () => ({
    getCartItems: jest.fn()
}));

jest.mock("../model/product.model", () => ({
    getProductsByIds: jest.fn(),
    updateQuantity: jest.fn()
}));

jest.mock("../model/order.model", () => ({
    createOrder: jest.fn()
}));

jest.mock("../model/orderItem.model", () => ({
    createOrderItem: jest.fn()
}));

jest.mock("../model/cart.model", () => ({
    clearCart: jest.fn()
}));

jest.mock("../model/coupons.model", () => ({
    getCouponsByCode: jest.fn()
}));

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

const Cart_item = require("../model/cartItem.model");
const Product = require("../model/product.model");
const Order = require("../model/order.model");
const Order_items = require("../model/orderItem.model");
const Cart = require("../model/cart.model");
const Coupon = require("../model/coupons.model");

const checkout = require("../controllers/checkout.controller");

const app = express();

app.use(express.json());

app.post(
    "/api/v1/checkout",
    require("../middleware/auth.middleware"),
    require("../middleware/cart.middleware"),
    checkout
);

app.use((err, req, res, next) => {
    void next;
    res.status(err.statusCode || 500).json({
        message: err.message
    });
});

describe("Checkout API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        db.connect.mockResolvedValue(mockClient);

        mockClient.query.mockResolvedValue({});

        Cart_item.getCartItems.mockResolvedValue([
            {
                product_id: 1,
                quantity: 2,
                price: 100
            }
        ]);

        Product.getProductsByIds.mockResolvedValue([
            {
                id: 1,
                name: "Laptop",
                quantity: 10
            }
        ]);

        Order.createOrder.mockResolvedValue({
            id: 100,
            user_id: 7,
            total_price: 200,
            status: "pending"
        });

        Order_items.createOrderItem.mockResolvedValue({
            id: 500,
            order_id: 100,
            product_id: 1,
            quantity: 2,
            price: 100
        });

        Product.updateQuantity.mockResolvedValue({
            id: 1,
            quantity: 8
        });

        Cart.clearCart.mockResolvedValue(true);

        Coupon.getCouponsByCode.mockResolvedValue(null);
    });

    test("should checkout successfully", async () => {

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode).toBe(201);

        expect(response.body.message)
            .toBe("Checkout successful");

        expect(response.body.order.id)
            .toBe(100);

        expect(response.body.order_items)
            .toHaveLength(1);

        expect(mockClient.query)
            .toHaveBeenCalledWith("BEGIN");

        expect(mockClient.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(Order.createOrder)
            .toHaveBeenCalledWith(
                7,
                200,
                "pending",
                undefined,
                0,
                mockClient
            );

        expect(Order_items.createOrderItem)
            .toHaveBeenCalledWith(
                100,
                1,
                2,
                100,
                mockClient
            );

        expect(Product.updateQuantity)
            .toHaveBeenCalledWith(
                1,
                8,
                mockClient
            );

        expect(Cart.clearCart)
            .toHaveBeenCalledWith(
                10,
                mockClient
            );

        expect(mockClient.release)
            .toHaveBeenCalled();
    });

    test("should return 400 when cart is empty", async () => {

        Cart_item.getCartItems.mockResolvedValue([]);

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("cart is empty");

        expect(mockClient.query)
            .toHaveBeenCalledWith("BEGIN");

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(Order.createOrder)
            .not.toHaveBeenCalled();

        expect(Cart.clearCart)
            .not.toHaveBeenCalled();

        expect(mockClient.release)
            .toHaveBeenCalled();
    });

    test("should return 404 when product does not exist", async () => {

        Product.getProductsByIds.mockResolvedValue([]);

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode).toBe(404);

        expect(response.body.message)
            .toBe("Product 1 not found");

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(Order.createOrder)
            .not.toHaveBeenCalled();

        expect(Cart.clearCart)
            .not.toHaveBeenCalled();
    });

    test("should return 400 when product stock is insufficient", async () => {

        Product.getProductsByIds.mockResolvedValue([
            {
                id: 1,
                name: "Laptop",
                quantity: 1
            }
        ]);

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Laptop does not have enough stock");

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(Order.createOrder)
            .not.toHaveBeenCalled();

        expect(Product.updateQuantity)
            .not.toHaveBeenCalled();
    });

    test("should return 400 when coupon is invalid", async () => {

        Coupon.getCouponsByCode.mockResolvedValue(null);

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({
                code: "INVALID10"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Invalid Coupon");

        expect(Coupon.getCouponsByCode)
            .toHaveBeenCalledWith(
                "INVALID10",
                mockClient
            );

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(Order.createOrder)
            .not.toHaveBeenCalled();
    });

    test("should return 400 when coupon is expired", async () => {

        Coupon.getCouponsByCode.mockResolvedValue({
            id: 5,
            code: "SALE10",
            discount_percent: 10,
            expires_at: new Date("2020-01-01")
        });

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({
                code: "SALE10"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message)
            .toBe("Coupon expired");

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(Order.createOrder)
            .not.toHaveBeenCalled();
    });

    test("should apply coupon successfully", async () => {

        Coupon.getCouponsByCode.mockResolvedValue({
            id: 5,
            code: "SALE10",
            discount_percent: 10,
            expires_at: new Date("2099-01-01")
        });

        Order.createOrder.mockResolvedValue({
            id: 101,
            user_id: 7,
            total_price: 180,
            status: "pending"
        });

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({
                code: "SALE10"
            });

        expect(response.statusCode)
            .toBe(201);

        expect(Order.createOrder)
            .toHaveBeenCalledWith(
                7,
                180,
                "pending",
                "SALE10",
                20,
                mockClient
            );

        expect(mockClient.query)
            .toHaveBeenCalledWith("COMMIT");
    });

    test("should rollback transaction when database error occurs", async () => {

        Order.createOrder.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode)
            .toBe(500);

        expect(response.body.message)
            .toBe("Database error");

        expect(mockClient.query)
            .toHaveBeenCalledWith("BEGIN");

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(mockClient.query)
            .not.toHaveBeenCalledWith("COMMIT");

        expect(mockClient.release)
            .toHaveBeenCalled();
    });

    test("should release database connection after successful checkout", async () => {

        await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(mockClient.release)
            .toHaveBeenCalledTimes(1);
    });

    test("should release database connection after failed checkout", async () => {

        Cart_item.getCartItems.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/api/v1/checkout")
            .send({});

        expect(response.statusCode)
            .toBe(500);

        expect(mockClient.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(mockClient.release)
            .toHaveBeenCalledTimes(1);
    });

});
