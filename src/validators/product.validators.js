const { body } = require("express-validator");

const createValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer")
];

const updateValidation = [
  body("price")
    .optional() 
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("quantity")
    .optional()  
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer")
];

module.exports = {
  createValidation,
  updateValidation
};