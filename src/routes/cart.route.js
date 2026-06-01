const express = require('express');
const auth = require('../middleware/auth.middleware');

const {
  createCart,
  getCartbyUser,
  clearCart,
  deleteCart
} = require('../controllers/cart.controller');

const router = express.Router();

// CREATE CART
router.post('/', auth, createCart);
// GET CART BY USER
router.get('/', auth, getCartbyUser);
// CLEAR CART (delete items only)
router.delete('/clear', auth, clearCart);
// DELETE CART (delete cart itself)
router.delete('/', auth, deleteCart);

module.exports = router;