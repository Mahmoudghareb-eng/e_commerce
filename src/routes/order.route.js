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
router.get('/myorders', auth, getMyOrders);

// GET ORDER BY ID
router.get('/:id', auth, idValidation, getOrderById);

// UPDATE ORDER STATUS
router.put('/:id', auth, isAdmin, idValidation, orderValidation, validate, updateOrderStatus);

//CANCEL ORDER
router.patch('/:id/cancel', auth, idValidation, validate, cancelOrder);

// DELETE ORDER
router.delete('/:id', auth, isAdmin, idValidation, validate, deleteOrder);

module.exports = router;