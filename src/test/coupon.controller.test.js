const {
    createCoupon,
    getCouponsByCode,
    deleteCoupons
} = require("../controllers/coupons.controller");

const Coupons = require("../model/coupons.model");
const logger = require("../config/logger");

jest.mock("../model/coupons.model");

jest.mock("../config/logger", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe("Coupon Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            body: {
                code: "SAVE20",
                discount_percent: 20,
                expires_at: "2026-12-31"
            },
            params: {
                code: "SAVE20"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // =====================================================
    // CREATE COUPON
    // =====================================================

    describe("Create Coupon Controller", () => {

        // =====================================
        // Success
        // =====================================

        test("should create coupon successfully", async () => {

            const coupon = {
                code: "SAVE20",
                discount_percent: 20,
                expires_at: "2026-12-31"
            };

            Coupons.getCouponsByCode
                .mockResolvedValue(null);

            Coupons.addCoupons
                .mockResolvedValue(coupon);


            await createCoupon(req, res, next);


            // Check existing coupon

            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledTimes(1);

            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("SAVE20");


            // Create coupon

            expect(Coupons.addCoupons)
                .toHaveBeenCalledTimes(1);

            expect(Coupons.addCoupons)
                .toHaveBeenCalledWith(
                    "SAVE20",
                    20,
                    "2026-12-31"
                );


            // Logger

            expect(logger.info)
                .toHaveBeenCalledTimes(1);


            // Response

            expect(res.status)
                .toHaveBeenCalledWith(201);

            expect(res.json)
                .toHaveBeenCalledWith({
                    msg: "create successfully",
                    coupon
                });


            // next

            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Coupon Already Exists
        // =====================================

        test("should return error if coupon already exists", async () => {

            const coupon = {
                code: "SAVE20",
                discount_percent: 20
            };

            Coupons.getCouponsByCode
                .mockResolvedValue(coupon);


            await createCoupon(req, res, next);


            // Should check coupon

            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("SAVE20");


            // Should NOT create coupon

            expect(Coupons.addCoupons)
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
                        message: "Coupon already exists",
                        statusCode: 400
                    })
                );

        });


        // =====================================
        // Get Coupon Error
        // =====================================

        test("should call next if checking coupon fails", async () => {

            const error = new Error("Database Error");

            Coupons.getCouponsByCode
                .mockRejectedValue(error);


            await createCoupon(req, res, next);


            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("SAVE20");


            expect(Coupons.addCoupons)
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
        // Create Coupon Error
        // =====================================

        test("should call next if creating coupon fails", async () => {

            const error = new Error("Database Error");

            Coupons.getCouponsByCode
                .mockResolvedValue(null);

            Coupons.addCoupons
                .mockRejectedValue(error);


            await createCoupon(req, res, next);


            expect(Coupons.addCoupons)
                .toHaveBeenCalledWith(
                    "SAVE20",
                    20,
                    "2026-12-31"
                );


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
    // GET COUPON BY CODE
    // =====================================================

    describe("Get Coupon By Code Controller", () => {

        // =====================================
        // Success
        // =====================================

        test("should return coupon successfully", async () => {

            const coupon = {
                code: "SAVE20",
                discount_percent: 20,
                expires_at: "2026-12-31"
            };

            req.params = {
                code: "SAVE20"
            };

            Coupons.getCouponsByCode
                .mockResolvedValue(coupon);


            await getCouponsByCode(req, res, next);


            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledTimes(1);

            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("SAVE20");


            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    coupon
                });


            expect(logger.warn)
                .not.toHaveBeenCalled();


            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Coupon Not Found
        // =====================================

        test("should return error if coupon does not exist", async () => {

            req.params = {
                code: "NOTFOUND"
            };

            Coupons.getCouponsByCode
                .mockResolvedValue(null);


            await getCouponsByCode(req, res, next);


            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("NOTFOUND");


            expect(logger.warn)
                .toHaveBeenCalledTimes(1);


            expect(res.status)
                .not.toHaveBeenCalled();

            expect(res.json)
                .not.toHaveBeenCalled();


            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Coupon not found",
                        statusCode: 404
                    })
                );

        });


        // =====================================
        // Database Error
        // =====================================

        test("should call next if getting coupon fails", async () => {

            const error = new Error("Database Error");

            Coupons.getCouponsByCode
                .mockRejectedValue(error);


            await getCouponsByCode(req, res, next);


            expect(Coupons.getCouponsByCode)
                .toHaveBeenCalledWith("SAVE20");


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
    // DELETE COUPON
    // =====================================================

    describe("Delete Coupon Controller", () => {

        // =====================================
        // Success
        // =====================================

        test("should delete coupon successfully", async () => {

            const coupon = {
                code: "SAVE20",
                discount_percent: 20,
                expires_at: "2026-12-31"
            };

            req.params = {
                code: "SAVE20"
            };

            Coupons.deleteCoupons
                .mockResolvedValue(coupon);


            await deleteCoupons(req, res, next);


            expect(Coupons.deleteCoupons)
                .toHaveBeenCalledTimes(1);

            expect(Coupons.deleteCoupons)
                .toHaveBeenCalledWith("SAVE20");


            expect(logger.info)
                .toHaveBeenCalledTimes(1);


            expect(res.status)
                .toHaveBeenCalledWith(200);

            expect(res.json)
                .toHaveBeenCalledWith({
                    coupon
                });


            expect(next)
                .not.toHaveBeenCalled();

        });


        // =====================================
        // Coupon Not Found
        // =====================================

        test("should return error if coupon does not exist", async () => {

            req.params = {
                code: "NOTFOUND"
            };

            Coupons.deleteCoupons
                .mockResolvedValue(null);


            await deleteCoupons(req, res, next);


            expect(Coupons.deleteCoupons)
                .toHaveBeenCalledWith("NOTFOUND");


            expect(logger.warn)
                .toHaveBeenCalledTimes(1);


            expect(logger.info)
                .not.toHaveBeenCalled();


            expect(res.status)
                .not.toHaveBeenCalled();

            expect(res.json)
                .not.toHaveBeenCalled();


            expect(next)
                .toHaveBeenCalledTimes(1);

            expect(next)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: "Coupon not found",
                        statusCode: 404
                    })
                );

        });


        // =====================================
        // Delete Error
        // =====================================

        test("should call next if deleting coupon fails", async () => {

            const error = new Error("Database Error");

            Coupons.deleteCoupons
                .mockRejectedValue(error);


            await deleteCoupons(req, res, next);

            expect(Coupons.deleteCoupons)
                .toHaveBeenCalledWith("SAVE20");


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