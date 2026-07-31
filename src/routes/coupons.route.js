const express = require('express');

const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');
const { createValidation, codeValidation} = require("../validators/coupon.validator")
const validate = require('../middleware/validator.middleware');

const {
  createCoupon,
  getCouponsByCode,
  deleteCoupons
} = require('../controllers/coupons.controller');

const router = express.Router();
/**
 * @swagger
 * /api/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount_percent
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique coupon code
 *                 example: ABC12
 *               discount_percent:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Discount percentage
 *                 example: 10
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: Coupon expiration date
 *                 example: "2026-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error or Coupon already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       500:
 *         description: Server error
 */
router.post('/', auth, isAdmin, createValidation, validate, createCoupon);
/**
 * @swagger
 * /api/coupons/{code}:
 *   get:
 *     summary: Get coupon by code
 *     description: Retrieve coupon details using its unique code.
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Coupon code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: Coupon not found
 *       500:
 *         description: Server error
 */
router.get('/:code', auth, isAdmin, codeValidation, validate, getCouponsByCode);
/**
 * @swagger
 * /api/coupons/{code}:
 *   delete:
 *     summary: Delete coupon by code
 *     tags:
 *       - Coupons
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         description: Coupon code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: Coupon not found
 *       500:
 *         description: Server error
 */
router.delete('/:code', auth, isAdmin, codeValidation, validate, deleteCoupons);

module.exports = router;