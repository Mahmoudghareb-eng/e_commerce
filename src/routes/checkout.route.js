const express = require('express');
const checkCart = require('../middleware/cart.middleware');
const auth = require('../middleware/auth.middleware');
const checkout = require('../controllers/checkout.controller');

const router = express.Router();
/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create a new order from the current user's cart
 *     description: Creates an order from the authenticated user's cart and optionally applies a coupon.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Coupon code (optional)
 *                 example: SUMMER25
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request (empty cart, invalid or expired coupon, or insufficient stock)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or product not found
 *       500:
 *         description: Server error
 */
router.post('/',auth,checkCart,checkout);

module.exports = router;