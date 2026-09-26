const {
    createOrderItems,
    getItemsByOrderId,
    getOrderItemById,
    updateOrderItem,
    deleteOrderItem
} = require("../controllers/orderItem.controller");

const Order_items = require("../model/orderItem.model");
const Product = require("../model/product.model");
const Order = require("../model/order.model");

const logger = require("../config/logger");

jest.mock("../model/orderItem.model");
jest.mock("../model/product.model");
jest.mock("../model/order.model");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe("Order Item Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            user: {
                id: 1
            },

            body: {
                order_id: 10,
                product_id: 20,
                quantity: 2
            },

            params: {
                id: "100",
                order_id: "10"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =========================================================
    // CREATE ORDER ITEM
    // =========================================================

    describe("Create Order Item Controller", () => {

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        test("should create order item successfully", async () => {

            const order = {
                id: 10,
                user_id: 1
            };

            const product = {
                id: 20,
                name: "Laptop",
                price: 36000,
                quantity: 5
            };

            const orderItem = {
                id: 100,
                order_id: 10,
                product_id: 20,
                quantity: 2,
                price: 36000
            };

            Order.getOrderById
                .mockResolvedValue(order);

            Product.getProductById
                .mockResolvedValue(product);

            Order_items.createOrderItem
                .mockResolvedValue(orderItem);

            await createOrderItems(req, res, next);

            expect(Order.getOrderById)
                .toHaveBeenCalledTimes(1);

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(Product.getProductById)
                .toHaveBeenCalledTimes(1);

            expect(Product.getProductById)
                .toHaveBeenCalledWith(20);

            expect(Order_items.createOrderItem)
                .toHaveBeenCalledTimes(1);

            expect(Order_items.createOrderItem)
                .toHaveBeenCalledWith(
                    10,
                    20,
                    2,
                    36000
                );

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(201);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Order item created successfully",
                    order_item: orderItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        // -----------------------------------------------------
        // ORDER ID / PRODUCT ID MISSING
        // -----------------------------------------------------

        test("should return error if order_id or product_id is missing", async () => {

            req.body = {
                quantity: 2
            };

            await createOrderItems(req, res, next);

            expect(Order.getOrderById)
                .not.toHaveBeenCalled();

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "order_id and product_id are required",
                        statusCode: 400
                    })
                );
        });


        // -----------------------------------------------------
        // INVALID QUANTITY
        // -----------------------------------------------------

        test("should return error if quantity is invalid", async () => {

            req.body.quantity = 0;

            await createOrderItems(req, res, next);

            expect(Order.getOrderById)
                .not.toHaveBeenCalled();

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Quantity must be greater than 0",
                        statusCode: 400
                    })
                );
        });


        // -----------------------------------------------------
        // ORDER NOT FOUND
        // -----------------------------------------------------

        test("should return error if order does not exist", async () => {

            Order.getOrderById
                .mockResolvedValue(null);

            await createOrderItems(req, res, next);

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // UNAUTHORIZED USER
        // -----------------------------------------------------

        test("should return error if user is not the owner of the order", async () => {

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 999
                });

            await createOrderItems(req, res, next);

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        // -----------------------------------------------------
        // PRODUCT NOT FOUND
        // -----------------------------------------------------

        test("should return error if product does not exist", async () => {

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Product.getProductById
                .mockResolvedValue(null);

            await createOrderItems(req, res, next);

            expect(Product.getProductById)
                .toHaveBeenCalledWith(20);

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Product not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // INSUFFICIENT STOCK
        // -----------------------------------------------------

        test("should return error if quantity exceeds product stock", async () => {

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Product.getProductById
                .mockResolvedValue({
                    id: 20,
                    price: 36000,
                    quantity: 1
                });

            await createOrderItems(req, res, next);

            expect(Order_items.createOrderItem)
                .not.toHaveBeenCalled();

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Insufficient stock",
                        statusCode: 400
                    })
                );
        });


        // -----------------------------------------------------
        // CREATE ORDER ITEM ERROR
        // -----------------------------------------------------

        test("should call next if creating order item fails", async () => {

            const error = new Error("Database Error");

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Product.getProductById
                .mockResolvedValue({
                    id: 20,
                    price: 36000,
                    quantity: 5
                });

            Order_items.createOrderItem
                .mockRejectedValue(error);

            await createOrderItems(req, res, next);

            expect(Order_items.createOrderItem)
                .toHaveBeenCalledWith(
                    10,
                    20,
                    2,
                    36000
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

    });


    // =========================================================
    // GET ITEMS BY ORDER ID
    // =========================================================

    describe("Get Items By Order ID Controller", () => {

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        test("should get order items successfully", async () => {

            const order = {
                id: 10,
                user_id: 1
            };

            const orderItems = [
                {
                    id: 100,
                    order_id: 10,
                    product_id: 20,
                    quantity: 2,
                    price: 36000
                }
            ];

            Order.getOrderById
                .mockResolvedValue(order);

            Order_items.getItemsByOrderId
                .mockResolvedValue(orderItems);

            await getItemsByOrderId(req, res, next);

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(Order_items.getItemsByOrderId)
                .toHaveBeenCalledWith(10);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Order items fetched successfully",
                    order_items: orderItems
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        // -----------------------------------------------------
        // ORDER NOT FOUND
        // -----------------------------------------------------

        test("should return error if order does not exist", async () => {

            Order.getOrderById
                .mockResolvedValue(null);

            await getItemsByOrderId(req, res, next);

            expect(Order_items.getItemsByOrderId)
                .not.toHaveBeenCalled();

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // UNAUTHORIZED
        // -----------------------------------------------------

        test("should return error if user is not the owner", async () => {

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 999
                });

            await getItemsByOrderId(req, res, next);

            expect(Order_items.getItemsByOrderId)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        // -----------------------------------------------------
        // DATABASE ERROR
        // -----------------------------------------------------

        test("should call next if getting order items fails", async () => {

            const error = new Error("Database Error");

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Order_items.getItemsByOrderId
                .mockRejectedValue(error);

            await getItemsByOrderId(req, res, next);

            expect(Order_items.getItemsByOrderId)
                .toHaveBeenCalledWith(10);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });


    // =========================================================
    // GET ORDER ITEM BY ID
    // =========================================================

    describe("Get Order Item By ID Controller", () => {

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        test("should get order item successfully", async () => {

            const orderItem = {
                id: 100,
                order_id: 10,
                product_id: 20,
                quantity: 2,
                price: 36000
            };

            const order = {
                id: 10,
                user_id: 1
            };

            Order_items.getOrderItemById
                .mockResolvedValue(orderItem);

            Order.getOrderById
                .mockResolvedValue(order);

            await getOrderItemById(req, res, next);

            expect(Order_items.getOrderItemById)
                .toHaveBeenCalledWith(100);

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Order item fetched successfully",
                    order_item: orderItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        // -----------------------------------------------------
        // ORDER ITEM NOT FOUND
        // -----------------------------------------------------

        test("should return error if order item does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue(null);

            await getOrderItemById(req, res, next);

            expect(Order.getOrderById)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order item not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // ORDER NOT FOUND
        // -----------------------------------------------------

        test("should return error if order does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue(null);

            await getOrderItemById(req, res, next);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // UNAUTHORIZED
        // -----------------------------------------------------

        test("should return error if user is not the owner", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 999
                });

            await getOrderItemById(req, res, next);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        // -----------------------------------------------------
        // DATABASE ERROR
        // -----------------------------------------------------

        test("should call next if getting order item fails", async () => {

            const error = new Error("Database Error");

            Order_items.getOrderItemById
                .mockRejectedValue(error);

            await getOrderItemById(req, res, next);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });


    // =========================================================
    // UPDATE ORDER ITEM
    // =========================================================

    describe("Update Order Item Controller", () => {

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        test("should update order item successfully", async () => {

            const orderItem = {
                id: 100,
                order_id: 10,
                product_id: 20,
                quantity: 2
            };

            const order = {
                id: 10,
                user_id: 1
            };

            const updatedItem = {
                ...orderItem,
                quantity: 5
            };

            Order_items.getOrderItemById
                .mockResolvedValue(orderItem);

            Order.getOrderById
                .mockResolvedValue(order);

            Order_items.updateOrderItem
                .mockResolvedValue(updatedItem);

            req.body.quantity = 5;

            await updateOrderItem(req, res, next);

            expect(Order_items.getOrderItemById)
                .toHaveBeenCalledWith("100");

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(Order_items.updateOrderItem)
                .toHaveBeenCalledWith(
                    "100",
                    5
                );

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Order item updated successfully",
                    order_item: updatedItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        // -----------------------------------------------------
        // INVALID QUANTITY
        // -----------------------------------------------------

        test("should return error if quantity is invalid", async () => {

            req.body.quantity = 0;

            await updateOrderItem(req, res, next);

            expect(Order_items.getOrderItemById)
                .not.toHaveBeenCalled();

            expect(Order_items.updateOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Quantity must be greater than 0",
                        statusCode: 400
                    })
                );
        });


        // -----------------------------------------------------
        // ORDER ITEM NOT FOUND
        // -----------------------------------------------------

        test("should return error if order item does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue(null);

            await updateOrderItem(req, res, next);

            expect(Order.getOrderById)
                .not.toHaveBeenCalled();

            expect(Order_items.updateOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order item not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // ORDER NOT FOUND
        // -----------------------------------------------------

        test("should return error if order does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue(null);

            await updateOrderItem(req, res, next);

            expect(Order_items.updateOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // UNAUTHORIZED
        // -----------------------------------------------------

        test("should return error if user is not the owner", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 999
                });

            await updateOrderItem(req, res, next);

            expect(Order_items.updateOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        // -----------------------------------------------------
        // UPDATE ERROR
        // -----------------------------------------------------

        test("should call next if updating order item fails", async () => {

            const error = new Error("Database Error");

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Order_items.updateOrderItem
                .mockRejectedValue(error);

            await updateOrderItem(req, res, next);

            expect(Order_items.updateOrderItem)
                .toHaveBeenCalledWith(
                    "100",
                    2
                );

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });


    // =========================================================
    // DELETE ORDER ITEM
    // =========================================================

    describe("Delete Order Item Controller", () => {

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        test("should delete order item successfully", async () => {

            const orderItem = {
                id: 100,
                order_id: 10,
                product_id: 20,
                quantity: 2
            };

            const order = {
                id: 10,
                user_id: 1
            };

            const deletedItem = {
                ...orderItem
            };

            Order_items.getOrderItemById
                .mockResolvedValue(orderItem);

            Order.getOrderById
                .mockResolvedValue(order);

            Order_items.deleteOrderItem
                .mockResolvedValue(deletedItem);

            await deleteOrderItem(req, res, next);

            expect(Order_items.getOrderItemById)
                .toHaveBeenCalledWith("100");

            expect(Order.getOrderById)
                .toHaveBeenCalledWith(10);

            expect(Order_items.deleteOrderItem)
                .toHaveBeenCalledWith("100");

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Order item deleted successfully",
                    order_item: deletedItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        // -----------------------------------------------------
        // ORDER ITEM NOT FOUND
        // -----------------------------------------------------

        test("should return error if order item does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue(null);

            await deleteOrderItem(req, res, next);

            expect(Order.getOrderById)
                .not.toHaveBeenCalled();

            expect(Order_items.deleteOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order item not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // ORDER NOT FOUND
        // -----------------------------------------------------

        test("should return error if order does not exist", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue(null);

            await deleteOrderItem(req, res, next);

            expect(Order_items.deleteOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Order not found",
                        statusCode: 404
                    })
                );
        });


        // -----------------------------------------------------
        // UNAUTHORIZED
        // -----------------------------------------------------

        test("should return error if user is not the owner", async () => {

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 999
                });

            await deleteOrderItem(req, res, next);

            expect(Order_items.deleteOrderItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        // -----------------------------------------------------
        // DELETE ERROR
        // -----------------------------------------------------

        test("should call next if deleting order item fails", async () => {

            const error = new Error("Database Error");

            Order_items.getOrderItemById
                .mockResolvedValue({
                    id: 100,
                    order_id: 10
                });

            Order.getOrderById
                .mockResolvedValue({
                    id: 10,
                    user_id: 1
                });

            Order_items.deleteOrderItem
                .mockRejectedValue(error);

            await deleteOrderItem(req, res, next);

            expect(Order_items.deleteOrderItem)
                .toHaveBeenCalledWith("100");

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });

});