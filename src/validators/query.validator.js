const { query } = require("express-validator");

const searchValidation = [
    query("minPrice")
        .optional()
        .isFloat({ min: 0 }),

    query("maxPrice")
        .optional()
        .isFloat({ min: 0 }),

    query("sort")
        .optional()
        .isIn([
            "price_asc",
            "price_desc"
        ])
];

module.exports = searchValidation;