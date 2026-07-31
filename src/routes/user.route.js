const express = require("express");

const { register, login, refresh, logout } = require("../controllers/auth.controller");
const { getMe, updateProfile, deleteUser } = require("../controllers/user.controller");

const auth = require("../middleware/auth.middleware");
const {authLimiter, refreshLimiter} = require("../middleware/rateLimit.middleware");
const {loginValidation, registerValidation} = require("../validators/auth.validators");
const validate = require("../middleware/validator.middleware")

const router = express.Router();

// auth routes

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mahmoud
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mahmoud@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already exists
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post('/register', authLimiter, registerValidation, validate, register);
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mahmoud@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post('/login', authLimiter, loginValidation, validate, login);
/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Generate a new access token using refresh token
 *     description: Uses the refresh token stored in an HttpOnly cookie. 
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: Refresh token not found
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post('/refresh', refreshLimiter, refresh);
/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the refresh token and clears the HttpOnly cookie. 
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Invalid or missing refresh token
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post('/logout', refreshLimiter, logout);

// user profile (protected)

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', auth, getMe);
/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mahmoud Gharib 
 *               email:
 *                 type: string
 *                 format: email 
 *                 example: mahmoud@example.com 
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/me', auth, updateProfile);
/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete current user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/me', auth, deleteUser);

module.exports = router;