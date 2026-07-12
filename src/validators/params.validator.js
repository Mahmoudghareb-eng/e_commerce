const { param } = require("express-validator");

const idValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Invalid id")
];

module.exports = idValidation;