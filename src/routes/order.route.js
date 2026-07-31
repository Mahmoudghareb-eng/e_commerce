const express = require('express');

const {
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
} = require('../controllers/order.controller');

const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');
const orderValidation = require('../validators/order.validator');
const idValidation = require('../validators/params.validator');
const validate = require('../middleware/validator.middleware');

const router = express.Router();


// GET USER ORDERS
/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get my orders
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: orders fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/myorders', auth, getMyOrders);

// GET ORDER BY ID
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: order ID
 *     responses:
 *       200:
 *         description: order fetched successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not allowed
 *       404:
 *         description: order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, idValidation, validate, getOrderById);

// UPDATE ORDER STATUS
/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: update order by ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: 
 *                   - pending 
 *                   - pending 
 *                   - shipped 
 *                   - delivered 
 *                   - cancelled 
 *     responses:
 *       200:
 *         description: order fetched successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin only
 *       404:
 *         description: order not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, isAdmin, idValidation, orderValidation, validate, updateOrderStatus);

//CANCEL ORDER
/**
 * @swagger
 * /api/orders/{id}/cancel::
 *   patch:
 *     summary: cancel order by ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: order ID
 *     responses:
 *       200:
 *         description: order fetched successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not allowed
 *       404:
 *         description: order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/cancel', auth, idValidation, validate, cancelOrder);

// DELETE ORDER
/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: delete order by ID
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: order ID
 *     responses:
 *       200:
 *         description: order fetched successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not allowed
 *       404:
 *         description: order not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, isAdmin, idValidation, validate, deleteOrder);

module.exports = router;