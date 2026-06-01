const express = require("express");

const { rigster, login } = require("../controllers/auth.controller");
const { getMe, updateProfile, deleteUser } = require("../controllers/user.controller");

const auth = require("../middleware/auth.middleware");

const router = express.Router();

// auth routes
router.post('/register', rigster);
router.post('/login', login);

// user profile (protected)
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfile);
router.delete('/me', auth, deleteUser);

module.exports = router;