const Cart = require("../model/cart.model");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");

const checkCart = async (req, res, next) => {
  try {
    const cart = await Cart.getCartbyUser(req.user.id);

    if (!cart) {
      logger.warn(`Cart not found for user ${req.user.id}`);
      throw new AppError("Cart not found", 404);
    }

    req.cart = cart;
    next();

  } catch (err) {
    next(err);
  }
};

module.exports = checkCart;