const { body } = require("express-validator");

const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
];

const registerValidation = [
  body("name")
   .notEmpty()
   .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .isLength({min:6})
    .withMessage("Password must be at least 6 characters")
]

module.exports = {
  loginValidation,
  registerValidation
};