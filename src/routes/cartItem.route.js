const express = require('express');
const auth = require('../middleware/auth.middleware');
const checkCart = require('../middleware/cart.middleware');

const {
  addItemToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem
} = require('../controllers/cartItem.controller');

const router = express.Router();

// ADD ITEM
router.post('/', auth, checkCart, addItemToCart);

// GET ITEMS
router.get('/', auth, checkCart, getCartItems);

// UPDATE ITEM
router.put('/:id', auth, checkCart, updateCartItemQuantity);

// DELETE ITEM
router.delete('/:id', auth, checkCart, removeCartItem);

module.exports = router;