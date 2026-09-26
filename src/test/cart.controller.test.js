const {
    createCart,
    getCartbyUser,
    clearCart,
    deleteCart
} = require("../controllers/cart.controller");

const Cart = require("../model/cart.model");
const logger = require("../config/logger");

jest.mock("../model/cart.model");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));


describe("Cart Controller", () => {

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
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

    });


    // =====================================================
    // CREATE CART
    // =====================================================

    describe("Create Cart Controller", () => {


        // =====================================
        // Success
        // =====================================

        test("should create cart successfully", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            Cart.getCartbyUser
                .mockResolvedValue(null);

            Cart.createCart
                .mockResolvedValue(cart);


            await createCart(req, res, next);


            // Check existing cart

            expect(Cart.getCartbyUser)
                .toHaveBeenCalledTimes(1);

            expect(Cart.getCartbyUser)
                .toHaveBeenCalledWith(1);


            // Create cart

            expect(Cart.createCart)
                .toHaveBeenCalledTimes(1);

            expect(Cart.createCart)
                .toHaveBeenCalledWith(1);


            // Logger

            expect(logger.info)
                .toHaveBeenCalledTimes(1);


            // Response

            expect(res.status)
                .toHaveBeenCalledWith(201);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "cart created successfully",
                    cart
                });


            // next

            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Cart Already Exists
        // =====================================

        test("should return error if cart already exists", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            Cart.getCartbyUser
                .mockResolvedValue(cart);


            await createCart(req, res, next);


            // Check cart

            expect(Cart.getCartbyUser)
                .toHaveBeenCalledWith(1);


            // Should not create another cart

            expect(Cart.createCart)
                .not.toHaveBeenCalled();


            // Logger

            expect(logger.warn)
                .toHaveBeenCalledTimes(1);


            // Response should not happen

            expect(res.status)
                .not.toHaveBeenCalled();

            expect(res.json)
                .not.toHaveBeenCalled();


            // Error

            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Cart already exists",
                        statusCode: 400
                    })
                );

        });


        // =====================================
        // Get Existing Cart Error
        // =====================================

        test("should call next if checking existing cart fails", async () => {

            const error = new Error("Database Error");

            Cart.getCartbyUser
                .mockRejectedValue(error);


            await createCart(req, res, next);


            expect(Cart.getCartbyUser)
                .toHaveBeenCalledWith(1);


            expect(Cart.createCart)
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
        // Create Cart Error
        // =====================================

        test("should call next if creating cart fails", async () => {

            const error = new Error("Database Error");

            Cart.getCartbyUser
                .mockResolvedValue(null);

            Cart.createCart
                .mockRejectedValue(error);


            await createCart(req, res, next);


            expect(Cart.createCart)
                .toHaveBeenCalledWith(1);


            expect(logger.info)
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

    });


    // =====================================================
    // GET CART BY USER
    // =====================================================

    describe("Get Cart By User Controller", () => {


        // =====================================
        // Success
        // =====================================

        test("should return cart successfully", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            req.cart = cart;


            await getCartbyUser(req, res, next);


            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    cart
                });


            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Error
        // =====================================

        test("should call next if getting cart fails", async () => {

            const error = new Error("Unexpected Error");


            // Make req.cart throw an error
            Object.defineProperty(req, "cart", {
                get: () => {
                    throw error;
                }
            });


            await getCartbyUser(req, res, next);


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


    // =====================================================
    // CLEAR CART
    // =====================================================

    describe("Clear Cart Controller", () => {


        // =====================================
        // Success
        // =====================================

        test("should clear cart successfully", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            req.cart = cart;

            Cart.clearCart
                .mockResolvedValue();


            await clearCart(req, res, next);


            // Clear cart

            expect(Cart.clearCart)
                .toHaveBeenCalledTimes(1);

            expect(Cart.clearCart)
                .toHaveBeenCalledWith(10);


            // Logger

            expect(logger.info)
                .toHaveBeenCalledTimes(1);


            // Response

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "cart cleared successfully"
                });


            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Clear Cart Error
        // =====================================

        test("should call next if clearing cart fails", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            const error = new Error("Database Error");

            req.cart = cart;

            Cart.clearCart
                .mockRejectedValue(error);


            await clearCart(req, res, next);


            expect(Cart.clearCart)
                .toHaveBeenCalledWith(10);


            expect(logger.info)
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

    });


    // =====================================================
    // DELETE CART
    // =====================================================

    describe("Delete Cart Controller", () => {


        // =====================================
        // Success
        // =====================================

        test("should delete cart successfully", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            const deleted = {
                id: 10,
                user_id: 1
            };

            req.cart = cart;

            Cart.deleteCart
                .mockResolvedValue(deleted);


            await deleteCart(req, res, next);


            // Delete cart

            expect(Cart.deleteCart)
                .toHaveBeenCalledTimes(1);

            expect(Cart.deleteCart)
                .toHaveBeenCalledWith(1);


            // Logger

            expect(logger.info)
                .toHaveBeenCalledTimes(1);


            // Response

            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    message: "cart deleted successfully",
                    deleted
                });


            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Delete Cart Error
        // =====================================

        test("should call next if deleting cart fails", async () => {

            const cart = {
                id: 10,
                user_id: 1
            };

            const error = new Error("Database Error");

            req.cart = cart;

            Cart.deleteCart
                .mockRejectedValue(error);


            await deleteCart(req, res, next);


            expect(Cart.deleteCart)
                .toHaveBeenCalledWith(1);


            expect(logger.info)
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

    });

});