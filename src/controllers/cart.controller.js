const Cart = require('../model/cart.model');

// CREATE CART
const createCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const existingCart = await Cart.getCartbyUser(user_id);

    if (existingCart) {
    return res.status(400).json({msg: "Cart already exists"});
  }
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

    const cart = req.cart;

    return res.status(200).json({ cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};


// CLEAR CART
const clearCart = async (req, res) => {
  try {

    const cart = req.cart;

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

    const cart = req.cart;
    const deleted = await Cart.deleteCart(cart.user_id);
    return res.status(200).json({
      message: "cart deleted successfully",
      deleted
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