const db = require('../config/db');

// CREATE CART
const createCart = async (user_id) => {
  try {
    const cart = await db.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING *`,
      [user_id]
    );

    return cart.rows[0];
  } catch (err) {
    throw new Error('Error creating cart: ' + err.message, { cause: err });
  }
};


// GET CART BY USER
const getCartbyUser = async (user_id) => {
  try {
    const cart = await db.query(
      `SELECT * FROM carts WHERE user_id = $1`,
      [user_id]
    );

    return cart.rows[0];
  } catch (err) {
    throw new Error('Error fetching cart: ' + err.message, { cause: err });
  }
};


// CLEAR CART ITEMS
const clearCart = async (cartId,client=db) => {
  try {
    const result = await client.query(
      `DELETE FROM cart_items WHERE cart_id = $1`,
      [cartId]
    );

    return result.rowCount;
  } catch (err) {
    throw new Error("Error clearing cart: " + err.message, { cause: err });
  }
};


// DELETE CART
const deleteCart = async (user_id) => {
  try {
    const cart = await db.query(
      `DELETE FROM carts WHERE user_id = $1 RETURNING *`,
      [user_id]
    );

    return cart.rows[0];
  } catch (err) {
    throw new Error("Error deleting cart: " + err.message, { cause: err });
  }
};


module.exports = {
  createCart,
  getCartbyUser,
  clearCart,
  deleteCart
};