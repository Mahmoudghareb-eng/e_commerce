const express = require('express');
const auth = require('../middleware/auth.middleware');
const {
  createOrderItems,
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
} = require('../controllers/orderItem.controller');

const router = express.Router();

// CREATE ORDER ITEM
router.post('/', auth, createOrderItems);
// GET ITEMS BY ORDER ID
router.get('/order/:order_id', auth, getItemsByOrderId);
// GET SINGLE ORDER ITEM
router.get('/:id', auth, getOrderItemById);
// UPDATE ORDER ITEM
router.put('/:id', auth, updateOrderItem);
// DELETE ORDER ITEM
router.delete('/:id', auth, deleteOrderItem);

module.exports = router;