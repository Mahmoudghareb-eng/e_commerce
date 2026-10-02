const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/product.controller");

const cloudinaryUpload = require("../config/cloudinary");

const {
    createValidation,
    updateValidation
} = require("../validators/product.validators");

const idValidation = require("../validators/params.validator");
const searchValidation = require("../validators/query.validator");

const validate = require("../middleware/validator.middleware");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin");

const uploadMemory = require("../middleware/upload.middleware");

const router = express.Router();


// CREATE PRODUCT
router.post(
    "/",
    auth,
    isAdmin,
    uploadMemory.single("image"),
    createValidation,
    validate,
    cloudinaryUpload(false, "products"),
    createProduct
);


// GET ALL PRODUCTS
router.get(
    "/",
    searchValidation,
    validate,
    getProducts
);


// GET PRODUCT BY ID
router.get(
    "/:id",
    idValidation(),
    validate,
    getProductById
);


// UPDATE PRODUCT
router.put(
    "/:id",
    auth,
    isAdmin,
    uploadMemory.single("image"),
    idValidation(),
    updateValidation,
    validate,
    cloudinaryUpload(false, "products"),
    updateProduct
);


// DELETE PRODUCT
router.delete(
    "/:id",
    auth,
    isAdmin,
    idValidation(),
    validate,
    deleteProduct
);


module.exports = router;