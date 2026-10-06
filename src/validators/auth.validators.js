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
];

const resetPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Invalid email"),

  body("code") 
    .isString() 
    .withMessage("Code must contain only numbers") 
    .isLength({ min: 6, max: 6 }) 
    .withMessage("Code must be exactly 6 digits"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
]

module.exports = {
  loginValidation,
  registerValidation,
  resetPasswordValidation
};