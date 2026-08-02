const Cart = require('../model/cart.model');
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");

// CREATE CART
const createCart = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const existingCart = await Cart.getCartbyUser(user_id);

    if (existingCart) {
      logger.warn(`Cart already exists for user ${user_id}`);
      throw new AppError("Cart already exists",400);
    }
    const cart = await Cart.createCart(user_id);
    logger.info(`Cart created (ID: ${cart.id}) for user ${user_id}`);
    return res.status(201).json({
      message: "cart created successfully",
      cart
    });

  } catch (err) {
    next(err);
  }
};


// GET CART BY USER
const getCartbyUser = async (req, res, next) => {
  try {

    const cart = req.cart;

    return res.status(200).json({ cart });

  } catch (err) {
    next(err);
  }
};


// CLEAR CART
const clearCart = async (req, res, next) => {
  try {

    const cart = req.cart;

    await Cart.clearCart(cart.id);
    logger.info(`Cart ${cart.id} cleared by user ${cart.user_id}`);
    return res.status(200).json({
      message: "cart cleared successfully"
    });

  } catch (err) {
    next(err);
  }
};


// DELETE CART
const deleteCart = async (req, res, next) => {
  try {

    const cart = req.cart;
    const deleted = await Cart.deleteCart(cart.user_id);
    logger.info(`Cart ${cart.id} deleted by user ${cart.user_id}`);
    return res.status(200).json({
      message: "cart deleted successfully",
      deleted
    });

  } catch (err) {
    next(err);
  }
};


module.exports = {
  createCart,
  getCartbyUser,
  clearCart,
  deleteCart
};