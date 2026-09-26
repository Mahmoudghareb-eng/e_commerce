const { 
    getMyOrders, 
    getOrderById,
    updateOrderStatus,
    cancelOrder, } = require("../controllers/order.controller");

const db = require("../config/db");
const Order = require("../model/order.model");
const Order_items = require("../model/orderItem.model");
const Product = require("../model/product.model");

const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");
const logger = require("../config/logger");

jest.mock("../config/db");

jest.mock("../model/order.model");
jest.mock("../model/orderItem.model");
jest.mock("../model/product.model");

jest.mock("../model/order.model");

jest.mock("../config/redis", () => ({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn()
}));

describe("Get My Orders Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            user: {
                id: 1
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    // =====================================
    // Success - From Cache
    // =====================================

    test("should return orders from cache", async () => {

        const orders = [
            {
                id: 1,
                user_id: 1,
                total_price: 500,
                status: "pending"
            },
            {
                id: 2,
                user_id: 1,
                total_price: 1000,
                status: "paid"
            }
        ];

        redis.get.mockResolvedValue(
            JSON.stringify(orders)
        );

        await getMyOrders(req, res, next);

        // Redis
        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "orders:1"
            );

        // Database should not be called
        expect(Order.getOrdersByUser)
            .not.toHaveBeenCalled();

        // setEx should not be called
        expect(redis.setEx)
            .not.toHaveBeenCalled();

        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Orders fetched successfully",
                orders
            });

        // No error
        expect(next)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Success - From Database
    // =====================================

    test("should get orders from database when cache does not exist", async () => {

        const orders = [
            {
                id: 1,
                user_id: 1,
                total_price: 500,
                status: "pending"
            },
            {
                id: 2,
                user_id: 1,
                total_price: 1000,
                status: "paid"
            }
        ];

        redis.get.mockResolvedValue(null);

        Order.getOrdersByUser
            .mockResolvedValue(orders);

        redis.setEx
            .mockResolvedValue();

        await getMyOrders(req, res, next);

        // Redis GET
        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "orders:1"
            );


        // Database
        expect(Order.getOrdersByUser)
            .toHaveBeenCalledTimes(1);

        expect(Order.getOrdersByUser)
            .toHaveBeenCalledWith(1);


        // Save in Redis
        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "orders:1",
                60,
                JSON.stringify(orders)
            );


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Orders fetched successfully",
                orders
            });


        // No error
        expect(next)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Redis GET Error
    // =====================================

    test("should call next if redis get fails", async () => {

        const error = new Error(
            "Redis GET Error"
        );

        redis.get
            .mockRejectedValue(error);

        await getMyOrders(req, res, next);


        // Redis called
        expect(redis.get)
            .toHaveBeenCalledWith(
                "orders:1"
            );


        // Database should not be called
        expect(Order.getOrdersByUser)
            .not.toHaveBeenCalled();


        // setEx should not be called
        expect(redis.setEx)
            .not.toHaveBeenCalled();

        // Response should not happen
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        // Error middleware
        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    // =====================================
    // Database Error
    // =====================================

    test("should call next if getting orders from database fails", async () => {

        redis.get
            .mockResolvedValue(null);

        const error = new Error(
            "Database Error"
        );

        Order.getOrdersByUser
            .mockRejectedValue(error);

        await getMyOrders(req, res, next);

        // Redis
        expect(redis.get)
            .toHaveBeenCalledWith(
                "orders:1"
            );

        // Database
        expect(Order.getOrdersByUser)
            .toHaveBeenCalledWith(1);

        // Cache should not be saved
        expect(redis.setEx)
            .not.toHaveBeenCalled();

        // Response should not happen
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        // Error
        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    // =====================================
    // Redis SET Error
    // =====================================

    test("should call next if redis setEx fails", async () => {

        const orders = [
            {
                id: 1,
                user_id: 1,
                total_price: 500,
                status: "pending"
            }
        ];

        redis.get
            .mockResolvedValue(null);

        Order.getOrdersByUser
            .mockResolvedValue(orders);

        const error = new Error(
            "Redis SET Error"
        );

        redis.setEx
            .mockRejectedValue(error);


        await getMyOrders(req, res, next);

        // Database
        expect(Order.getOrdersByUser)
            .toHaveBeenCalledWith(1);

        // Redis SET
        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "orders:1",
                60,
                JSON.stringify(orders)
            );

        // Response should not happen
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        // Error middleware
        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

});

describe("Get Order By ID Controller", () => {

    let req;
    let res;
    let next;

    const order = {
        id: 1,
        user_id: 10,
        total_price: 5000,
        status: "pending"
    };

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
            },
            user: {
                id: 10,
                role: "user"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    // =====================================
    // Cache Success
    // =====================================

    test("should return order from cache", async () => {

        redis.get.mockResolvedValue(
            JSON.stringify(order)
        );

        await getOrderById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(Order.getOrderById)
            .not.toHaveBeenCalled();

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order fetched successfully",
                order
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Database Success
    // =====================================

    test("should get order from database when cache does not exist", async () => {

        redis.get.mockResolvedValue(null);

        Order.getOrderById.mockResolvedValue(order);

        redis.setEx.mockResolvedValue();

        await getOrderById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(Order.getOrderById)
            .toHaveBeenCalledTimes(1);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith(
                "1"
            );

        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "order:1",
                60,
                JSON.stringify(order)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order fetched successfully",
                order
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Order Not Found
    // =====================================

    test("should call next if order does not exist", async () => {

        redis.get.mockResolvedValue(null);

        Order.getOrderById.mockResolvedValue(null);

        await getOrderById(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Order not found",
                    statusCode: 404
                })
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // User Owns Order
    // =====================================

    test("should allow user to access their own order", async () => {

        redis.get.mockResolvedValue(
            JSON.stringify(order)
        );

        req.user = {
            id: 10,
            role: "user"
        };

        await getOrderById(req, res, next);

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order fetched successfully",
                order
            });

        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Admin Access
    // =====================================

    test("should allow admin to access any order", async () => {

        redis.get.mockResolvedValue(
            JSON.stringify(order)
        );

        req.user = {
            id: 999,
            role: "admin"
        };

        await getOrderById(req, res, next);

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order fetched successfully",
                order
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Unauthorized User
    // =====================================

    test("should return 403 if user is not the owner", async () => {

        redis.get.mockResolvedValue(
            JSON.stringify(order)
        );

        req.user = {
            id: 20,
            role: "user"
        };

        await getOrderById(req, res, next);

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Not allowed",
                    statusCode: 403
                })
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });

    // =====================================
    // Redis GET Error
    // =====================================

    test("should call next if redis get fails", async () => {

        const error = new Error("Redis GET failed");

        redis.get.mockRejectedValue(error);

        await getOrderById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(Order.getOrderById)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    // =====================================
    // Database Error
    // =====================================

    test("should call next if database fails", async () => {

        redis.get.mockResolvedValue(null);

        const error = new Error("Database Error");

        Order.getOrderById.mockRejectedValue(error);

        await getOrderById(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    // =====================================
    // Redis SET Error
    // =====================================

    test("should call next if redis setEx fails", async () => {

        redis.get.mockResolvedValue(null);

        Order.getOrderById.mockResolvedValue(order);

        const error = new Error("Redis SET failed");

        redis.setEx.mockRejectedValue(error);

        await getOrderById(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "order:1",
                60,
                JSON.stringify(order)
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });

    // =====================================
    // Invalid Cached JSON
    // =====================================

    test("should call next if cached data is invalid JSON", async () => {

        redis.get.mockResolvedValue(
            "invalid-json"
        );

        await getOrderById(req, res, next);

        expect(Order.getOrderById)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });
});

describe("Update Order Status Controller", () => {

    let req;
    let res;
    let next;

    const order = {
        id: 1,
        user_id: 10,
        total_price: 5000,
        status: "pending"
    };

    const updatedOrder = {
        ...order,
        status: "shipped"
    };

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
            },
            body: {
                status: "shipped"
            },
            user: {
                id: 10,
                role: "admin"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should update order status successfully", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order.updateOrderStatus
            .mockResolvedValue(updatedOrder);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await updateOrderStatus(req, res, next);

        // Get order
        expect(Order.getOrderById)
            .toHaveBeenCalledTimes(1);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");


        // Update status
        expect(Order.updateOrderStatus)
            .toHaveBeenCalledTimes(1);

        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "shipped"
            );


        // Logger
        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        // Delete order cache
        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );


        // Clear orders cache
        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order updated successfully",
                order: updatedOrder
            });


        // Error handler
        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Order Not Found
    // =====================================

    test("should call next if order does not exist", async () => {

        Order.getOrderById
            .mockResolvedValue(null);

        await updateOrderStatus(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Order not found",
                    statusCode: 404
                })
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Update Order Error
    // =====================================

    test("should call next if updating order status fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        const error = new Error("Database Error");

        Order.updateOrderStatus
            .mockRejectedValue(error);

        await updateOrderStatus(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");

        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "shipped"
            );

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // Redis DEL Error
    // =====================================

    test("should call next if deleting order cache fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order.updateOrderStatus
            .mockResolvedValue(updatedOrder);

        const error = new Error("Redis Delete Error");

        redis.del
            .mockRejectedValue(error);

        await updateOrderStatus(req, res, next);

        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "shipped"
            );

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // Clear Cache Error
    // =====================================

    test("should call next if clearing orders cache fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order.updateOrderStatus
            .mockResolvedValue(updatedOrder);

        redis.del
            .mockResolvedValue();

        const error = new Error("Clear Cache Error");

        clearCacheByPattern
            .mockRejectedValue(error);

        await updateOrderStatus(req, res, next);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // Check Status Value
    // =====================================

    test("should update using the status sent in request body", async () => {

        req.body.status = "delivered";

        Order.getOrderById
            .mockResolvedValue(order);

        Order.updateOrderStatus
            .mockResolvedValue({
                ...order,
                status: "delivered"
            });

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await updateOrderStatus(req, res, next);

        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "delivered"
            );

        expect(next)
            .not.toHaveBeenCalled();
    });
});

describe("Cancel Order Controller", () => {

    let req;
    let res;
    let next;
    let client;

    const order = {
        id: 1,
        user_id: 10,
        status: "pending"
    };

    const items = [
        {
            product_id: 100,
            quantity: 2
        },
        {
            product_id: 200,
            quantity: 3
        }
    ];

    const products = [
        {
            id: 100,
            quantity: 5
        },
        {
            id: 200,
            quantity: 10
        }
    ];

    beforeEach(() => {

        jest.clearAllMocks();

        client = {
            query: jest.fn(),
            release: jest.fn()
        };

        db.connect.mockResolvedValue(client);

        req = {
            params: {
                id: "1"
            },
            user: {
                id: 10,
                role: "user"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =====================================
    // SUCCESS
    // =====================================

    test("should cancel order successfully", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        Product.updateQuantity
            .mockResolvedValue();

        Order.updateOrderStatus
            .mockResolvedValue();

        client.query
            .mockResolvedValue();

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await cancelOrder(req, res, next);

        // DB connection
        expect(db.connect)
            .toHaveBeenCalledTimes(1);

        // BEGIN
        expect(client.query)
            .toHaveBeenCalledWith("BEGIN");

        // Get order
        expect(Order.getOrderById)
            .toHaveBeenCalledWith(
                "1",
                client
            );

        // Get items
        expect(Order_items.getItemsByOrderId)
            .toHaveBeenCalledWith(
                "1",
                client
            );

        // Get products
        expect(Product.getProductsByIds)
            .toHaveBeenCalledWith(
                [100, 200],
                client
            );

        // Restore first product
        expect(Product.updateQuantity)
            .toHaveBeenNthCalledWith(
                1,
                100,
                7,
                client
            );

        // Restore second product
        expect(Product.updateQuantity)
            .toHaveBeenNthCalledWith(
                2,
                200,
                13,
                client
            );

        // Update order
        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "cancelled",
                client
            );

        // COMMIT
        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        // Cache
        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );

        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order cancelled successfully"
            });

        expect(next)
            .not.toHaveBeenCalled();

        // Connection released
        expect(client.release)
            .toHaveBeenCalledTimes(1);
    });


    // =====================================
    // ORDER NOT FOUND
    // =====================================

    test("should return error if order does not exist", async () => {

        Order.getOrderById
            .mockResolvedValue(null);

        await cancelOrder(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith(
                "1",
                client
            );

        expect(Order_items.getItemsByOrderId)
            .not.toHaveBeenCalled();

        expect(Product.getProductsByIds)
            .not.toHaveBeenCalled();

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Order Not Found",
                    statusCode: 404
                })
            );

        expect(client.release)
            .toHaveBeenCalledTimes(1);
    });


    // =====================================
    // NOT OWNER
    // =====================================

    test("should return 403 if user is not the owner", async () => {

        req.user.id = 20;

        Order.getOrderById
            .mockResolvedValue(order);

        await cancelOrder(req, res, next);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith(
                "1",
                client
            );

        expect(Order_items.getItemsByOrderId)
            .not.toHaveBeenCalled();

        expect(Product.updateQuantity)
            .not.toHaveBeenCalled();

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Not allowed",
                    statusCode: 403
                })
            );

        expect(client.release)
            .toHaveBeenCalledTimes(1);
    });


    // =====================================
    // WRONG STATUS
    // =====================================

    test("should return error if order is not pending", async () => {

        Order.getOrderById
            .mockResolvedValue({
                ...order,
                status: "shipped"
            });

        await cancelOrder(req, res, next);

        expect(Order_items.getItemsByOrderId)
            .not.toHaveBeenCalled();

        expect(Product.updateQuantity)
            .not.toHaveBeenCalled();

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Only pending orders can be cancelled",
                    statusCode: 400
                })
            );
    });


    // =====================================
    // PRODUCT NOT FOUND
    // =====================================

    test("should rollback if product does not exist", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue([
                {
                    id: 100,
                    quantity: 5
                }
            ]);

        await cancelOrder(req, res, next);

        expect(Product.updateQuantity)
            .toHaveBeenCalledWith(
                100,
                7,
                client
            );

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Product 200 not found",
                    statusCode: 404
                })
            );
    });


    // =====================================
    // GET ITEMS ERROR
    // =====================================

    test("should rollback if getting order items fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        const error = new Error(
            "Get items failed"
        );

        Order_items.getItemsByOrderId
            .mockRejectedValue(error);

        await cancelOrder(req, res, next);

        expect(Product.getProductsByIds)
            .not.toHaveBeenCalled();

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // UPDATE QUANTITY ERROR
    // =====================================

    test("should rollback if updating product quantity fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        const error = new Error(
            "Update quantity failed"
        );

        Product.updateQuantity
            .mockRejectedValue(error);

        await cancelOrder(req, res, next);

        expect(Order.updateOrderStatus)
            .not.toHaveBeenCalled();

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // UPDATE ORDER ERROR
    // =====================================

    test("should rollback if updating order status fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        Product.updateQuantity
            .mockResolvedValue();

        const error = new Error(
            "Update order failed"
        );

        Order.updateOrderStatus
            .mockRejectedValue(error);

        await cancelOrder(req, res, next);

        expect(Order.updateOrderStatus)
            .toHaveBeenCalledWith(
                "1",
                "cancelled",
                client
            );

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // =====================================
    // COMMIT ERROR
    // =====================================

    test("should rollback if commit fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        Product.updateQuantity
            .mockResolvedValue();

        Order.updateOrderStatus
            .mockResolvedValue();

        client.query
            .mockImplementation(async (query) => {

                if (query === "COMMIT") {
                    throw new Error("Commit failed");
                }

            });

        await cancelOrder(req, res, next);

        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(client.query)
            .toHaveBeenCalledWith("ROLLBACK");

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Commit failed"
                })
            );
    });


    // =====================================
    // REDIS ERROR
    // =====================================

    test("should call next if deleting cache fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        Product.updateQuantity
            .mockResolvedValue();

        Order.updateOrderStatus
            .mockResolvedValue();

        client.query
            .mockResolvedValue();

        const error = new Error(
            "Redis delete failed"
        );

        redis.del
            .mockRejectedValue(error);

        await cancelOrder(req, res, next);

        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );

        expect(next)
            .toHaveBeenCalledWith(error);

        /*
         * IMPORTANT:
         * COMMIT already happened,
         * so ROLLBACK should NOT happen.
         */
        expect(client.query)
            .not.toHaveBeenCalledWith("ROLLBACK");
    });


    // =====================================
    // CLEAR CACHE ERROR
    // =====================================

    test("should call next if clearing orders cache fails", async () => {

        Order.getOrderById
            .mockResolvedValue(order);

        Order_items.getItemsByOrderId
            .mockResolvedValue(items);

        Product.getProductsByIds
            .mockResolvedValue(products);

        Product.updateQuantity
            .mockResolvedValue();

        Order.updateOrderStatus
            .mockResolvedValue();

        client.query
            .mockResolvedValue();

        redis.del
            .mockResolvedValue();

        const error = new Error(
            "Clear cache failed"
        );

        clearCacheByPattern
            .mockRejectedValue(error);

        await cancelOrder(req, res, next);

        expect(client.query)
            .toHaveBeenCalledWith("COMMIT");

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );

        expect(next)
            .toHaveBeenCalledWith(error);

        // Transaction already committed
        expect(client.query)
            .not.toHaveBeenCalledWith("ROLLBACK");
    });

});

const { deleteOrder } = require("../controllers/order.controller");

const Order = require("../model/order.model");
const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");
const logger = require("../config/logger");

jest.mock("../model/order.model");

jest.mock("../config/redis", () => ({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn()
}));

jest.mock("../utility/redis.util");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe("Delete Order Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
            },
            user: {
                id: 5,
                role: "admin"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =====================================
    // Success
    // =====================================

    test("should delete order successfully", async () => {

        const order = {
            id: 1,
            user_id: 5,
            status: "pending"
        };

        Order.getOrderById
            .mockResolvedValue(order);

        Order.deleteOrder
            .mockResolvedValue(order);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();


        await deleteOrder(req, res, next);


        // Get order

        expect(Order.getOrderById)
            .toHaveBeenCalledTimes(1);

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");


        // Delete order

        expect(Order.deleteOrder)
            .toHaveBeenCalledTimes(1);

        expect(Order.deleteOrder)
            .toHaveBeenCalledWith("1");


        // Redis

        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );


        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );


        // Logger

        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        // Response

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Order deleted successfully"
            });


        // next

        expect(next)
            .not.toHaveBeenCalled();

    });


    // =====================================
    // Order Not Found
    // =====================================

    test("should return error if order does not exist", async () => {

        Order.getOrderById
            .mockResolvedValue(null);


        await deleteOrder(req, res, next);


        // Database

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");


        // Delete should not happen

        expect(Order.deleteOrder)
            .not.toHaveBeenCalled();


        // Redis should not happen

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Logger

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        // Error

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Order not found",
                    statusCode: 404
                })
            );

    });


    // =====================================
    // Delete Order Error
    // =====================================

    test("should call next if deleting order fails", async () => {

        const order = {
            id: 1,
            user_id: 5,
            status: "pending"
        };

        const error = new Error("Database Error");


        Order.getOrderById
            .mockResolvedValue(order);

        Order.deleteOrder
            .mockRejectedValue(error);


        await deleteOrder(req, res, next);


        // Get order

        expect(Order.getOrderById)
            .toHaveBeenCalledWith("1");


        // Delete

        expect(Order.deleteOrder)
            .toHaveBeenCalledWith("1");


        // Redis should not run

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Response should not run

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        // Error

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);

    });


    // =====================================
    // Redis Delete Error
    // =====================================

    test("should call next if redis delete fails", async () => {

        const order = {
            id: 1,
            user_id: 5,
            status: "pending"
        };

        const error = new Error("Redis Delete Error");


        Order.getOrderById
            .mockResolvedValue(order);

        Order.deleteOrder
            .mockResolvedValue(order);

        redis.del
            .mockRejectedValue(error);


        await deleteOrder(req, res, next);


        // Order deleted

        expect(Order.deleteOrder)
            .toHaveBeenCalledWith("1");


        // Redis

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );


        // Cache pattern should not run

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Response should not run

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        // Error

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);

    });


    // =====================================
    // Clear Cache Error
    // =====================================

    test("should call next if clearing orders cache fails", async () => {

        const order = {
            id: 1,
            user_id: 5,
            status: "pending"
        };

        const error = new Error("Clear Cache Error");


        Order.getOrderById
            .mockResolvedValue(order);

        Order.deleteOrder
            .mockResolvedValue(order);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockRejectedValue(error);


        await deleteOrder(req, res, next);


        // Delete order

        expect(Order.deleteOrder)
            .toHaveBeenCalledWith("1");


        // Delete single cache

        expect(redis.del)
            .toHaveBeenCalledWith(
                "order:1"
            );


        // Clear all orders cache

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "orders:*"
            );


        // Response should not happen

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();


        // Error

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);

    });

});