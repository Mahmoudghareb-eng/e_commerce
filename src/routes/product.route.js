const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/product.controller");

const { 
createValidation,
updateValidation 
} = require("../validators/product.validators");
const idValidation = require("../validators/params.validator");
const searchValidation = require("../validators/query.validator");
const validate = require("../middleware/validator.middleware");
const auth = require("../middleware/auth.middleware");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

// CREATE PRODUCT
router.post("/", auth, isAdmin, createValidation, validate, createProduct);

// GET ALL PRODUCTS
router.get("/", searchValidation, validate, getProducts);

// GET PRODUCT BY ID
router.get("/:id", idValidation, validate, getProductById);

// UPDATE PRODUCT
router.put("/:id", auth, isAdmin, idValidation, updateValidation, validate, updateProduct);

// DELETE PRODUCT
router.delete("/:id", auth, isAdmin, idValidation, validate, deleteProduct);

module.exports = router;
  
