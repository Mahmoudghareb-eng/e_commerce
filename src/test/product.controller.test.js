
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/product.controller");

const Product = require("../model/product.model");
const logger = require("../config/logger");
const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");

const { product } = require("./mock/product.mock");

// =============================
// Mock Modules
// =============================

jest.mock("../model/product.model");

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


// =====================================================
// CREATE PRODUCT
// =====================================================

describe("Create Product Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            body: {
                name: "labtop",
                description: "core i5 12th 8ram",
                price: 36000,
                quantity: 5,
                image_url: "https://example.com/image.jpg"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // ==========================================
    // SUCCESS
    // ==========================================

    test("should create product successfully", async () => {

        Product.addProduct.mockResolvedValue(product);

        clearCacheByPattern.mockResolvedValue();

        await createProduct(req, res, next);

        expect(Product.addProduct)
            .toHaveBeenCalledTimes(1);

        expect(Product.addProduct)
            .toHaveBeenCalledWith(
                "labtop",
                "core i5 12th 8ram",
                36000,
                5,
                "https://example.com/image.jpg"
            );

        expect(logger.info)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
            );

        expect(res.status)
            .toHaveBeenCalledWith(201);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Product created successfully",
                product
            });

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // TRIM NAME AND DESCRIPTION
    // ==========================================

    test("should trim name and description before creating product", async () => {

        req.body.name = "   labtop   ";
        req.body.description = "   core i5 12th 8ram   ";

        Product.addProduct.mockResolvedValue(product);

        clearCacheByPattern.mockResolvedValue();

        await createProduct(req, res, next);

        expect(Product.addProduct)
            .toHaveBeenCalledWith(
                "labtop",
                "core i5 12th 8ram",
                36000,
                5,
                "https://example.com/image.jpg"
            );

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // CREATE PRODUCT ERROR
    // ==========================================

    test("should call next if creating product fails", async () => {

        const error = new Error("Database Error");

        Product.addProduct
            .mockRejectedValue(error);

        await createProduct(req, res, next);

        expect(Product.addProduct)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();

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


    // ==========================================
    // CLEAR CACHE ERROR
    // ==========================================

    test("should call next if clearing product cache fails", async () => {

        const error = new Error("Clear Cache Error");

        Product.addProduct
            .mockResolvedValue(product);

        clearCacheByPattern
            .mockRejectedValue(error);

        await createProduct(req, res, next);

        expect(Product.addProduct)
            .toHaveBeenCalledWith(
                "labtop",
                "core i5 12th 8ram",
                36000,
                5,
                "https://example.com/image.jpg"
            );

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
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


// =====================================================
// GET PRODUCTS
// =====================================================

describe("Get Products Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            query: {
                page: "1",
                limit: "10"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // ==========================================
    // CACHE HIT
    // ==========================================

    test("should return products from cache", async () => {

        const products = [product];

        redis.get.mockResolvedValue(
            JSON.stringify(products)
        );

        await getProducts(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:1:10::::"
            );

        expect(Product.getProducts)
            .not.toHaveBeenCalled();

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(products);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // DATABASE
    // ==========================================

    test("should get products from database when cache does not exist", async () => {

        const products = [product];

        redis.get.mockResolvedValue(null);

        Product.getProducts
            .mockResolvedValue(products);

        redis.setEx
            .mockResolvedValue();

        await getProducts(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:1:10::::"
            );

        expect(Product.getProducts)
            .toHaveBeenCalledTimes(1);

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                undefined,
                null,
                null,
                undefined,
                10,
                0
            );

        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "products:1:10::::",
                60,
                JSON.stringify(products)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(products);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // PAGINATION
    // ==========================================

    test("should calculate page, limit and offset correctly", async () => {

        req.query = {
            page: "3",
            limit: "5"
        };

        const products = [product];

        redis.get.mockResolvedValue(null);

        Product.getProducts
            .mockResolvedValue(products);

        redis.setEx
            .mockResolvedValue();

        await getProducts(req, res, next);

        // offset = (3 - 1) * 5 = 10

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                undefined,
                null,
                null,
                undefined,
                5,
                10
            );

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:3:5::::"
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "products:3:5::::",
                60,
                JSON.stringify(products)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(products);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // FILTERS
    // ==========================================

    test("should pass search, minPrice, maxPrice and sort correctly", async () => {

        req.query = {
            page: "2",
            limit: "5",
            search: "laptop",
            minPrice: "10000",
            maxPrice: "50000",
            sort: "price_asc"
        };

        const products = [product];

        redis.get.mockResolvedValue(null);

        Product.getProducts
            .mockResolvedValue(products);

        redis.setEx
            .mockResolvedValue();

        await getProducts(req, res, next);

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                "laptop",
                10000,
                50000,
                "price_asc",
                5,
                5
            );

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:2:5:laptop:10000:50000:price_asc"
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "products:2:5:laptop:10000:50000:price_asc",
                60,
                JSON.stringify(products)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(products);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // DEFAULT PAGE AND LIMIT
    // ==========================================

    test("should use default page and limit", async () => {

        req.query = {};

        const products = [product];

        redis.get.mockResolvedValue(null);

        Product.getProducts
            .mockResolvedValue(products);

        redis.setEx
            .mockResolvedValue();

        await getProducts(req, res, next);

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                undefined,
                null,
                null,
                undefined,
                10,
                0
            );

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:1:10::::"
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "products:1:10::::",
                60,
                JSON.stringify(products)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(products);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // REDIS GET ERROR
    // ==========================================

    test("should call next if redis get fails", async () => {

        const error = new Error("Redis GET failed");

        redis.get
            .mockRejectedValue(error);

        await getProducts(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "products:1:10::::"
            );

        expect(Product.getProducts)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // ==========================================
    // DATABASE ERROR
    // ==========================================

    test("should call next if database fails", async () => {

        const error = new Error("Database Error");

        redis.get
            .mockResolvedValue(null);

        Product.getProducts
            .mockRejectedValue(error);

        await getProducts(req, res, next);

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                undefined,
                null,
                null,
                undefined,
                10,
                0
            );

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


    // ==========================================
    // REDIS SET ERROR
    // ==========================================

    test("should call next if redis setEx fails", async () => {

        const products = [product];

        const error = new Error("Redis SET failed");

        redis.get
            .mockResolvedValue(null);

        Product.getProducts
            .mockResolvedValue(products);

        redis.setEx
            .mockRejectedValue(error);

        await getProducts(req, res, next);

        expect(Product.getProducts)
            .toHaveBeenCalledWith(
                undefined,
                null,
                null,
                undefined,
                10,
                0
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "products:1:10::::",
                60,
                JSON.stringify(products)
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


// =====================================================
// GET PRODUCT BY ID
// =====================================================

describe("Get Product By ID Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });


    // ==========================================
    // CACHE HIT
    // ==========================================

    test("should return product from cache", async () => {

        redis.get.mockResolvedValue(
            JSON.stringify(product)
        );

        await getProductById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledTimes(1);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "product:1"
            );

        expect(Product.getProductById)
            .not.toHaveBeenCalled();

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(product);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // DATABASE
    // ==========================================

    test("should get product from database when cache does not exist", async () => {

        redis.get.mockResolvedValue(null);

        Product.getProductById
            .mockResolvedValue(product);

        redis.setEx
            .mockResolvedValue();

        await getProductById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "product:1"
            );

        expect(Product.getProductById)
            .toHaveBeenCalledTimes(1);

        expect(Product.getProductById)
            .toHaveBeenCalledWith(
                "1"
            );

        expect(redis.setEx)
            .toHaveBeenCalledTimes(1);

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "product:1",
                60,
                JSON.stringify(product)
            );

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith(product);

        expect(next)
            .not.toHaveBeenCalled();
    });


    // ==========================================
    // PRODUCT NOT FOUND
    // ==========================================

    test("should call next if product does not exist", async () => {

        redis.get.mockResolvedValue(null);

        Product.getProductById
            .mockResolvedValue(null);

        await getProductById(req, res, next);

        expect(Product.getProductById)
            .toHaveBeenCalledWith(
                "1"
            );

        expect(redis.setEx)
            .not.toHaveBeenCalled();

        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
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


    // ==========================================
    // REDIS GET ERROR
    // ==========================================

    test("should call next if redis get fails", async () => {

        const error = new Error("Redis GET failed");

        redis.get
            .mockRejectedValue(error);

        await getProductById(req, res, next);

        expect(redis.get)
            .toHaveBeenCalledWith(
                "product:1"
            );

        expect(Product.getProductById)
            .not.toHaveBeenCalled();

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);
    });


    // ==========================================
    // DATABASE ERROR
    // ==========================================

    test("should call next if database fails", async () => {

        const error = new Error("Database Error");

        redis.get
            .mockResolvedValue(null);

        Product.getProductById
            .mockRejectedValue(error);

        await getProductById(req, res, next);

        expect(Product.getProductById)
            .toHaveBeenCalledWith(
                "1"
            );

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


    // ==========================================
    // REDIS SET ERROR
    // ==========================================

    test("should call next if redis setEx fails", async () => {

        const error = new Error("Redis SET failed");

        redis.get
            .mockResolvedValue(null);

        Product.getProductById
            .mockResolvedValue(product);

        redis.setEx
            .mockRejectedValue(error);

        await getProductById(req, res, next);

        expect(Product.getProductById)
            .toHaveBeenCalledWith(
                "1"
            );

        expect(redis.setEx)
            .toHaveBeenCalledWith(
                "product:1",
                60,
                JSON.stringify(product)
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

describe("Update Product Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
            },
            body: {
                quantity: 10,
                price: 40000
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

    test("should update product successfully", async () => {

        const updatedProduct = {
            ...product,
            quantity: 10,
            price: 40000
        };

        Product.getProductById
            .mockResolvedValue(product);

        Product.updateProduct
            .mockResolvedValue(updatedProduct);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await updateProduct(req, res, next);


        // Check product exists
        expect(Product.getProductById)
            .toHaveBeenCalledTimes(1);

        expect(Product.getProductById)
            .toHaveBeenCalledWith("1");


        // Update product
        expect(Product.updateProduct)
            .toHaveBeenCalledTimes(1);

        expect(Product.updateProduct)
            .toHaveBeenCalledWith(
                "1",
                10,
                40000
            );


        // Logger
        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        // Delete product cache
        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Clear products cache
        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
            );


        // Response
        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Product updated successfully",
                product: updatedProduct
            });


        // No error
        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Product Not Found
    // =====================================

    test("should return error if product does not exist", async () => {

        Product.getProductById
            .mockResolvedValue(null);

        await updateProduct(req, res, next);


        // Check product
        expect(Product.getProductById)
            .toHaveBeenCalledWith("1");


        // Should not update
        expect(Product.updateProduct)
            .not.toHaveBeenCalled();


        // Should not clear cache
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
                    message: "Product not found",
                    statusCode: 404
                })
            );


        // No response
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Update Product Error
    // =====================================

    test("should call next if updating product fails", async () => {

        Product.getProductById
            .mockResolvedValue(product);

        const error = new Error("Database Error");

        Product.updateProduct
            .mockRejectedValue(error);


        await updateProduct(req, res, next);


        // Product exists
        expect(Product.getProductById)
            .toHaveBeenCalledWith("1");


        // Update called
        expect(Product.updateProduct)
            .toHaveBeenCalledWith(
                "1",
                10,
                40000
            );


        // Cache should not be touched
        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Error
        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(next)
            .toHaveBeenCalledWith(error);


        // No response
        expect(res.status)
            .not.toHaveBeenCalled();

        expect(res.json)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Redis Delete Error
    // =====================================

    test("should call next if deleting product cache fails", async () => {

        const updatedProduct = {
            ...product,
            quantity: 10,
            price: 40000
        };

        Product.getProductById
            .mockResolvedValue(product);

        Product.updateProduct
            .mockResolvedValue(updatedProduct);

        const error = new Error("Redis Delete Error");

        redis.del
            .mockRejectedValue(error);


        await updateProduct(req, res, next);


        // Update should happen
        expect(Product.updateProduct)
            .toHaveBeenCalledWith(
                "1",
                10,
                40000
            );


        // Redis delete
        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Products cache should not be cleared
        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Response should not be sent
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
    // Clear Products Cache Error
    // =====================================

    test("should call next if clearing products cache fails", async () => {

        const updatedProduct = {
            ...product,
            quantity: 10,
            price: 40000
        };

        Product.getProductById
            .mockResolvedValue(product);

        Product.updateProduct
            .mockResolvedValue(updatedProduct);

        redis.del
            .mockResolvedValue();

        const error = new Error("Clear Cache Error");

        clearCacheByPattern
            .mockRejectedValue(error);


        await updateProduct(req, res, next);


        // Update
        expect(Product.updateProduct)
            .toHaveBeenCalledWith(
                "1",
                10,
                40000
            );


        // Product cache deleted
        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Products cache cleared
        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
            );


        // No response
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
    // Check Body Values
    // =====================================

    test("should pass quantity and price to updateProduct", async () => {

        Product.getProductById
            .mockResolvedValue(product);

        Product.updateProduct
            .mockResolvedValue(product);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();


        await updateProduct(req, res, next);


        expect(Product.updateProduct)
            .toHaveBeenCalledWith(
                req.params.id,
                req.body.quantity,
                req.body.price
            );


        expect(next)
            .not.toHaveBeenCalled();
    });

});

describe("Delete Product Controller", () => {

    let req;
    let res;
    let next;

    beforeEach(() => {

        jest.clearAllMocks();

        req = {
            params: {
                id: "1"
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

    test("should delete product successfully", async () => {

        Product.deleteProduct
            .mockResolvedValue(product);

        redis.del
            .mockResolvedValue();

        clearCacheByPattern
            .mockResolvedValue();

        await deleteProduct(req, res, next);


        // Delete product

        expect(Product.deleteProduct)
            .toHaveBeenCalledTimes(1);

        expect(Product.deleteProduct)
            .toHaveBeenCalledWith("1");


        // Logger

        expect(logger.info)
            .toHaveBeenCalledTimes(1);


        // Delete single product cache

        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Clear products cache

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
            );


        // Response

        expect(res.status)
            .toHaveBeenCalledWith(200);

        expect(res.json)
            .toHaveBeenCalledWith({
                message: "Product deleted successfully"
            });


        // No error

        expect(next)
            .not.toHaveBeenCalled();
    });


    // =====================================
    // Product Not Found
    // =====================================

    test("should return error if product does not exist", async () => {

        Product.deleteProduct
            .mockResolvedValue(null);

        await deleteProduct(req, res, next);


        expect(Product.deleteProduct)
            .toHaveBeenCalledTimes(1);

        expect(Product.deleteProduct)
            .toHaveBeenCalledWith("1");


        // Logger warning

        expect(logger.warn)
            .toHaveBeenCalledTimes(1);


        // Cache should not be deleted

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
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
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Product not found",
                    statusCode: 404
                })
            );
    });


    // =====================================
    // Delete Product Error
    // =====================================

    test("should call next if deleting product fails", async () => {

        const error = new Error(
            "Database Error"
        );

        Product.deleteProduct
            .mockRejectedValue(error);

        await deleteProduct(req, res, next);


        expect(Product.deleteProduct)
            .toHaveBeenCalledWith("1");


        // Cache should not be touched

        expect(redis.del)
            .not.toHaveBeenCalled();

        expect(clearCacheByPattern)
            .not.toHaveBeenCalled();


        // Response should not happen

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
    // Redis Delete Error
    // =====================================

    test("should call next if deleting product cache fails", async () => {

        Product.deleteProduct
            .mockResolvedValue(product);

        const error = new Error(
            "Redis Delete Error"
        );

        redis.del
            .mockRejectedValue(error);

        await deleteProduct(req, res, next);


        // Product deleted

        expect(Product.deleteProduct)
            .toHaveBeenCalledWith("1");


        // Redis delete attempted

        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Products cache should not be cleared
        // because redis.del failed

        expect(clearCacheByPattern)
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
    // Clear Products Cache Error
    // =====================================

    test("should call next if clearing products cache fails", async () => {

        Product.deleteProduct
            .mockResolvedValue(product);

        redis.del
            .mockResolvedValue();

        const error = new Error(
            "Clear Cache Error"
        );

        clearCacheByPattern
            .mockRejectedValue(error);

        await deleteProduct(req, res, next);


        // Product deleted

        expect(Product.deleteProduct)
            .toHaveBeenCalledWith("1");


        // Product cache deleted

        expect(redis.del)
            .toHaveBeenCalledTimes(1);

        expect(redis.del)
            .toHaveBeenCalledWith(
                "product:1"
            );


        // Clear cache attempted

        expect(clearCacheByPattern)
            .toHaveBeenCalledTimes(1);

        expect(clearCacheByPattern)
            .toHaveBeenCalledWith(
                "products:*"
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