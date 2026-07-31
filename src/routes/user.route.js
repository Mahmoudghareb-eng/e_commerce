const express = require("express");

const { register, login, refresh, logout } = require("../controllers/auth.controller");
const { getMe, updateProfile, deleteUser } = require("../controllers/user.controller");

const auth = require("../middleware/auth.middleware");
const {authLimiter, refreshLimiter} = require("../middleware/rateLimit.middleware");
const {loginValidation, registerValidation} = require("../validators/auth.validators");
const validate = require("../middleware/validator.middleware")

const router = express.Router();

// auth routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', refreshLimiter, logout);

// user profile (protected)
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfile);
router.delete('/me', auth, deleteUser);

module.exports = router;