const express = require('express');
const auth = require('../middleware/auth.middleware');
const checkCart = require('../middleware/cart.middleware');
const { 
  itemValidator, 
  quantityValidator } = require('../validators/cartItem.validator');
const idValidation = require('../validators/params.validator');
const validate = require('../middleware/validator.middleware');

const {
  addItemToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem
} = require('../controllers/cartItem.controller');

const router = express.Router();

// ADD ITEM
router.post('/', auth, checkCart, itemValidator, validate, addItemToCart);

// GET ITEMS
router.get('/', auth, checkCart, getCartItems);

// UPDATE ITEM
router.put('/:id', auth, checkCart, idValidation, quantityValidator, validate, updateCartItemQuantity);

// DELETE ITEM
router.delete('/:id', auth, checkCart, idValidation, validate, removeCartItem);

module.exports = router;