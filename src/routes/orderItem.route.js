const express = require('express');
const auth = require('../middleware/auth.middleware');
const {
  createOrderItems,
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
} = require('../controllers/orderItem.controller');

const idValidation = require('../validators/params.validator');
const validate = require('../middleware/validator.middleware');

const router = express.Router();

// GET ITEMS BY ORDER ID
/**
 * @swagger
 * /api/orders/items/order/{order_id}:
 *   get:
 *     summary: Get all items for a specific order
 *     tags:
 *       - Order Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order items fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/order/:order_id', auth, idValidation("order_id"), validate, getItemsByOrderId);
// GET SINGLE ORDER ITEM
/**
 * @swagger
 * /api/orders/items/{id}:
 *   get:
 *     summary: Get order item by ID
 *     tags:
 *       - Order Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     responses:
 *       200:
 *         description: Order item fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, idValidation, validate, getOrderItemById);
// UPDATE ORDER ITEM
/**
 * @swagger
 * /api/orders/items/{id}:
 *   put:
 *     summary: Update order item quantity
 *     tags:
 *       - Order Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *     responses:
 *       200:
 *         description: Order item updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order item not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, idValidation, validate, updateOrderItem);
// DELETE ORDER ITEM
/**
 * @swagger
 * /api/orders/items/{id}:
 *   delete:
 *     summary: Delete order item
 *     tags:
 *       - Order Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order Item ID
 *     responses:
 *       200:
 *         description: Order item deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, idValidation, validate, deleteOrderItem);

module.exports = router;