const express = require('express');

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
} = require('../controllers/order.controller');

const auth = require('../middleware/auth.middleware');

const router = express.Router();


// CREATE ORDER
router.post('/', auth, createOrder);

// GET USER ORDERS
router.get('/', auth, getOrders);

// GET ORDER BY ID
router.get('/:id', auth, getOrderById);

// UPDATE ORDER STATUS
router.put('/:id', auth, updateOrderStatus);

//CANCEL ORDER
router.patch('/:id/cancel',auth,cancelOrder);

// DELETE ORDER
router.delete('/:id', auth, deleteOrder);

module.exports = router;