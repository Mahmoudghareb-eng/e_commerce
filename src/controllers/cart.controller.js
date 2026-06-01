const Cart = require('../model/cart.model');

// CREATE CART
const createCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    const cart = await Cart.createCart(user_id);

    return res.status(201).json({
      message: "cart created successfully",
      cart
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// GET CART BY USER
const getCartbyUser = async (req, res) => {
  try {
    const user_id = req.user.id;

    const cart = await Cart.getCartbyUser(user_id);

    return res.status(200).json({ cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// CLEAR CART
const clearCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    const cart = await Cart.getCartbyUser(user_id);

    if (!cart) {
      return res.status(404).json({ msg: "Cart not found" });
    }

    await Cart.clearCart(cart.id);

    return res.status(200).json({
      message: "cart cleared successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// DELETE CART
const deleteCart = async (req, res) => {
  try {
    const user_id = req.user.id;

    const cart = await Cart.deleteCart(user_id);

    return res.status(200).json({
      message: "cart deleted successfully",
      cart
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


module.exports = {
  createCart,
  getCartbyUser,
  clearCart,
  deleteCart
};