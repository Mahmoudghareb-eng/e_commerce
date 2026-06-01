const db = require('../config/db');


// ADD ITEM TO CART
const addItemToCart = async (cart_id,product_id,quantity) => {
  try {
    const item = await db.query(
      `INSERT INTO cart_items (cart_id,product_id,quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cart_id, product_id, quantity]
    );

    return item.rows[0];

  } catch (err) {
    throw new Error(
      'Error adding item to cart: ' + err.message
    );
  }
};

// GET CART ITEMS
const getCartItems = async (cart_id) => {
  try {
    const items = await db.query(
      `SELECT
          ci.id,
          ci.quantity,
          p.id AS product_id,
          p.name,
          p.price
       FROM cart_items ci
       JOIN products p
       ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cart_id]
    );

    return items.rows;

  } catch (err) {
    throw new Error(
      'Error fetching cart items: ' + err.message
    );
  }
};

// GET ITEM BY ID
const getCartItemById = async(id)=>{
  try{
    const item = await db.query(
      `SELECET * FROM cart_items WHERE id = $1`,
      [id]
    );
    return item.rows[0];
  } catch (err) {
    throw new Error(
      'Error fetching cart items: ' + err.message
    );
  }
};

// GET ITEM BY PRODUCT
const getCartItemByProduct = async (cart_id,product_id) => {
  try {
    const item = await db.query(
      `SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cart_id, product_id]
    );

    return item.rows[0];

  } catch (err) {
    throw new Error(
      'Error fetching cart item: ' + err.message
    );
  }
};

// UPDATE ITEM QUANTITY
const updateCartItemQuantity = async (id,quantity) => {
  try {
    const item = await db.query(
      `UPDATE cart_items SET quantity = $2 WHERE id = $1 RETURNING *`,
      [id, quantity]
    );

    return item.rows[0];

  } catch (err) {
    throw new Error(
      'Error updating cart item: ' + err.message
    );
  }
};

// REMOVE ITEM
const removeCartItem = async (id) => {
  try {

    const item = await db.query(
      `DELETE FROM cart_items WHERE id = $1 RETURNING *`,
      [id]
    );

    return item.rows[0];

  } catch (err) {
    throw new Error(
      'Error deleting cart item: ' + err.message
    );
  }
};


module.exports = {
  addItemToCart,
  getCartItems,
  getCartItemById,
  getCartItemByProduct,
  updateCartItemQuantity,
  removeCartItem
};