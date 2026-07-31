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
/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Create a new cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: cart created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Cart already exists
 *       500:
 *         description: Server error
 */
router.post('/', auth, createCart);
// GET CART BY USER
/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: cart fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.get('/', auth, checkCart, getCartbyUser);
// CLEAR CART (delete items only)
/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear all items from the cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: cart cleared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.delete('/clear', auth, checkCart, clearCart); 
// DELETE CART (delete cart itself)
/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Delete the current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: cart deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.delete('/', auth, checkCart, deleteCart);

module.exports = router;