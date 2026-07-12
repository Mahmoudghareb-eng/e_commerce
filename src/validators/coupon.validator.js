const { body, param } = require("express-validator");

const createValidation = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Code must be between 3 and 20 characters"),

  body("discount_percent")
    .notEmpty()
    .withMessage("Discount percent is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100")
];

const codeValidation = [
  param("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Code must be between 3 and 20 characters")
]

module.exports = {
  createValidation,
  codeValidation
};