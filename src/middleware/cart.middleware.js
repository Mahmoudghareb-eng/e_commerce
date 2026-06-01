const Cart = require('../model/cart.model');

const checkCart = async (req, res, next) => {
  try {
    const cart = await Cart.getCartbyUser(req.user.id);

    if (!cart) {
      return res.status(404).json({
        msg: "Cart not found"
      });
    }

    req.cart = cart;

    next();

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Server error"
    });
  }
};

module.exports = checkCart;