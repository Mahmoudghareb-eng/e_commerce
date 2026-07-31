const { param } = require("express-validator");

const idValidation = (paramName = "id") => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`Invalid ${paramName}`)
];

module.exports = idValidation;