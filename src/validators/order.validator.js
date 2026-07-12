const { body } = require("express-validator");

const orderValidation = [

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "paid", "shipped", "delivered"])
    .withMessage("Invalid status value")
];

module.exports = orderValidation;