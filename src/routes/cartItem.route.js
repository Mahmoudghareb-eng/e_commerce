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
/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add a product to the current user's cart
 *     tags:
 *       - Cart Items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or cart not found
 *       500:
 *         description: Server error
 */
router.post('/', auth, checkCart, itemValidator, validate, addItemToCart);

// GET ITEMS
/**
 * @swagger
 * /api/cart/items:
 *   get:
 *     summary: Get all items in the current user's cart
 *     tags:
 *       - Cart Items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.get('/', auth, checkCart, getCartItems);

// UPDATE ITEM
/**
 * @swagger
 * /api/cart/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags:
 *       - Cart Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Cart item or product not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, checkCart, idValidation, quantityValidator, validate, updateCartItemQuantity);

// DELETE ITEM
/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     summary: Remove an item from the current user's cart
 *     tags:
 *       - Cart Items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, checkCart, idValidation, validate, removeCartItem);

module.exports = router;