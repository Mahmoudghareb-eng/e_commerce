const {
    addItemToCart,
    getCartItems,
    updateCartItemQuantity,
    removeCartItem
} = require("../controllers/cartItem.controller");

const Cart_item = require("../model/cartItem.model");
const Product = require("../model/product.model");
const logger = require("../config/logger");

jest.mock("../model/cartItem.model");
jest.mock("../model/product.model");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe("Cart Item Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            user: {
                id: 1
            },

            cart: {
                id: 10,
                user_id: 1
            },

            body: {
                product_id: 5,
                quantity: 2
            },

            params: {
                id: 20
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =========================================================
    // ADD ITEM TO CART
    // =========================================================

    describe("Add Item To Cart Controller", () => {

        test("should add new item to cart successfully", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 10
            };

            const cartItem = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.getCartItemByProduct
                .mockResolvedValue(null);

            Cart_item.addItemToCart
                .mockResolvedValue(cartItem);

            await addItemToCart(req, res, next);

            expect(Product.getProductById)
                .toHaveBeenCalledTimes(1);

            expect(Product.getProductById)
                .toHaveBeenCalledWith(5);

            expect(Cart_item.getCartItemByProduct)
                .toHaveBeenCalledTimes(1);

            expect(Cart_item.getCartItemByProduct)
                .toHaveBeenCalledWith(10, 5);

            expect(Cart_item.addItemToCart)
                .toHaveBeenCalledTimes(1);

            expect(Cart_item.addItemToCart)
                .toHaveBeenCalledWith(
                    10,
                    5,
                    2
                );

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(201);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Item added successfully",
                    cartItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        test("should update existing cart item", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 10
            };

            const existingItem = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const updatedItem = {
                ...existingItem,
                quantity: 4
            };

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.getCartItemByProduct
                .mockResolvedValue(existingItem);

            Cart_item.updateCartItemQuantity
                .mockResolvedValue(updatedItem);

            await addItemToCart(req, res, next);

            expect(Cart_item.getCartItemByProduct)
                .toHaveBeenCalledWith(10, 5);

            expect(Cart_item.updateCartItemQuantity)
                .toHaveBeenCalledTimes(1);

            expect(Cart_item.updateCartItemQuantity)
                .toHaveBeenCalledWith(
                    20,
                    4
                );

            expect(Cart_item.addItemToCart)
                .not.toHaveBeenCalled();

            expect(res.status)
                .toHaveBeenCalledWith(201);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Item added successfully",
                    cartItem: updatedItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        test("should call next if product does not exist", async () => {

            Product.getProductById
                .mockResolvedValue(null);

            await addItemToCart(req, res, next);

            expect(Product.getProductById)
                .toHaveBeenCalledWith(5);

            expect(Cart_item.getCartItemByProduct)
                .not.toHaveBeenCalled();

            expect(Cart_item.addItemToCart)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Product not found",
                        statusCode: 404
                    })
                );
        });


        test("should call next if product is out of stock", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 0
            };

            Product.getProductById
                .mockResolvedValue(product);

            await addItemToCart(req, res, next);

            expect(Cart_item.getCartItemByProduct)
                .not.toHaveBeenCalled();

            expect(Cart_item.addItemToCart)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Product out of stock",
                        statusCode: 400
                    })
                );
        });


        test("should call next if requested quantity exceeds stock", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 1
            };

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.getCartItemByProduct
                .mockResolvedValue(null);

            req.body.quantity = 5;

            await addItemToCart(req, res, next);

            expect(Cart_item.addItemToCart)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not enough stock",
                        statusCode: 400
                    })
                );
        });


        test("should call next if existing quantity exceeds stock", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 5
            };

            const existingItem = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 4
            };

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.getCartItemByProduct
                .mockResolvedValue(existingItem);

            req.body.quantity = 2;

            await addItemToCart(req, res, next);

            expect(Cart_item.updateCartItemQuantity)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not enough stock",
                        statusCode: 400
                    })
                );
        });


        test("should call next if getting product fails", async () => {

            const error = new Error("Database Error");

            Product.getProductById
                .mockRejectedValue(error);

            await addItemToCart(req, res, next);

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(error);
        });


        test("should call next if adding cart item fails", async () => {

            const product = {
                id: 5,
                name: "Laptop",
                price: 36000,
                quantity: 10
            };

            const error = new Error("Database Error");

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.getCartItemByProduct
                .mockResolvedValue(null);

            Cart_item.addItemToCart
                .mockRejectedValue(error);

            await addItemToCart(req, res, next);

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });


    // =========================================================
    // GET CART ITEMS
    // =========================================================

    describe("Get Cart Items Controller", () => {

        test("should get cart items successfully", async () => {

            const cartItems = [
                {
                    id: 20,
                    cart_id: 10,
                    product_id: 5,
                    quantity: 2
                },
                {
                    id: 21,
                    cart_id: 10,
                    product_id: 6,
                    quantity: 1
                }
            ];

            Cart_item.getCartItems
                .mockResolvedValue(cartItems);

            await getCartItems(req, res, next);

            expect(Cart_item.getCartItems)
                .toHaveBeenCalledTimes(1);

            expect(Cart_item.getCartItems)
                .toHaveBeenCalledWith(10);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    cartItems
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        test("should call next if getting cart items fails", async () => {

            const error = new Error("Database Error");

            Cart_item.getCartItems
                .mockRejectedValue(error);

            await getCartItems(req, res, next);

            expect(Cart_item.getCartItems)
                .toHaveBeenCalledWith(10);

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
    // UPDATE CART ITEM QUANTITY
    // =========================================================

    describe("Update Cart Item Quantity Controller", () => {

        test("should update cart item successfully", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const product = {
                id: 5,
                quantity: 10,
                price: 36000
            };

            const updated = {
                ...item,
                quantity: 5
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.updateCartItemQuantity
                .mockResolvedValue(updated);

            req.body.quantity = 5;

            await updateCartItemQuantity(req, res, next);

            expect(Cart_item.getCartItemById)
                .toHaveBeenCalledWith(20);

            expect(Product.getProductById)
                .toHaveBeenCalledWith(5);

            expect(Cart_item.updateCartItemQuantity)
                .toHaveBeenCalledWith(
                    20,
                    5
                );

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "Updated successfully",
                    updated
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        test("should call next if quantity is invalid", async () => {

            req.body.quantity = 0;

            await updateCartItemQuantity(req, res, next);

            expect(Cart_item.getCartItemById)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Quantity must be greater than 0",
                        statusCode: 400
                    })
                );
        });


        test("should call next if cart item does not exist", async () => {

            Cart_item.getCartItemById
                .mockResolvedValue(null);

            await updateCartItemQuantity(req, res, next);

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Cart_item.updateCartItemQuantity)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Cart item not found",
                        statusCode: 404
                    })
                );
        });


        test("should call next if user does not own cart item", async () => {

            const item = {
                id: 20,
                cart_id: 99,
                product_id: 5,
                quantity: 2
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            await updateCartItemQuantity(req, res, next);

            expect(Product.getProductById)
                .not.toHaveBeenCalled();

            expect(Cart_item.updateCartItemQuantity)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        test("should call next if product does not exist", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Product.getProductById
                .mockResolvedValue(null);

            await updateCartItemQuantity(req, res, next);

            expect(Cart_item.updateCartItemQuantity)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Product not found",
                        statusCode: 404
                    })
                );
        });


        test("should call next if quantity exceeds product stock", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const product = {
                id: 5,
                quantity: 3
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Product.getProductById
                .mockResolvedValue(product);

            req.body.quantity = 5;

            await updateCartItemQuantity(req, res, next);

            expect(Cart_item.updateCartItemQuantity)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not enough stock",
                        statusCode: 400
                    })
                );
        });


        test("should call next if updating cart item fails", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const product = {
                id: 5,
                quantity: 10
            };

            const error = new Error("Database Error");

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Product.getProductById
                .mockResolvedValue(product);

            Cart_item.updateCartItemQuantity
                .mockRejectedValue(error);

            await updateCartItemQuantity(req, res, next);

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });


    // =========================================================
    // REMOVE CART ITEM
    // =========================================================

    describe("Remove Cart Item Controller", () => {

        test("should remove cart item successfully", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const deletedItem = {
                ...item
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Cart_item.removeCartItem
                .mockResolvedValue(deletedItem);

            await removeCartItem(req, res, next);

            expect(Cart_item.getCartItemById)
                .toHaveBeenCalledWith(20);

            expect(Cart_item.removeCartItem)
                .toHaveBeenCalledTimes(1);

            expect(Cart_item.removeCartItem)
                .toHaveBeenCalledWith(20);

            expect(logger.info)
                .toHaveBeenCalledTimes(1);

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    msg: "Deleted successfully",
                    cartItem: deletedItem
                });

            expect(next)
                .not.toHaveBeenCalled();
        });


        test("should call next if cart item does not exist", async () => {

            Cart_item.getCartItemById
                .mockResolvedValue(null);

            await removeCartItem(req, res, next);

            expect(Cart_item.removeCartItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Cart item not found",
                        statusCode: 404
                    })
                );
        });


        test("should call next if user does not own cart item", async () => {

            const item = {
                id: 20,
                cart_id: 99,
                product_id: 5,
                quantity: 2
            };

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            await removeCartItem(req, res, next);

            expect(Cart_item.removeCartItem)
                .not.toHaveBeenCalled();

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Not allowed",
                        statusCode: 403
                    })
                );
        });


        test("should call next if deleting cart item fails", async () => {

            const item = {
                id: 20,
                cart_id: 10,
                product_id: 5,
                quantity: 2
            };

            const error = new Error("Database Error");

            Cart_item.getCartItemById
                .mockResolvedValue(item);

            Cart_item.removeCartItem
                .mockRejectedValue(error);

            await removeCartItem(req, res, next);

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(error);
        });

    });

});