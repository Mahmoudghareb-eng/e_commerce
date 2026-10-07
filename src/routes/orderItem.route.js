const express = require('express');
const auth = require('../middleware/auth.middleware');
const {
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
} = require('../controllers/orderItem.controller');

const idValidation = require('../validators/params.validator');
const validate = require('../middleware/validator.middleware');

const router = express.Router();

// GET ITEMS BY ORDER ID
router.get('/order/:order_id', auth, idValidation("order_id"), validate, getItemsByOrderId);
// GET SINGLE ORDER ITEM
router.get('/:id', auth, idValidation(), validate, getOrderItemById);
// UPDATE ORDER ITEM
router.put('/:id', auth, idValidation(), validate, updateOrderItem);
// DELETE ORDER ITEM
router.delete('/:id', auth, idValidation(), validate, deleteOrderItem);

module.exports = router;