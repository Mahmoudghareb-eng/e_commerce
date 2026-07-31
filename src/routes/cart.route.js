const express = require('express');
const auth = require('../middleware/auth.middleware');
const checkCart = require('../middleware/cart.middleware');

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
router.get('/', auth, checkCart, getCartbyUser);
// CLEAR CART (delete items only)
router.delete('/clear', auth, checkCart, clearCart); 
// DELETE CART (delete cart itself)
router.delete('/', auth, checkCart, deleteCart);

module.exports = router;