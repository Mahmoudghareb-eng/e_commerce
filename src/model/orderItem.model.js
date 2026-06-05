const db = require('../config/db');


// CREATE ORDER ITEM
const createOrderItem = async (
  order_id,
  product_id,
  quantity,
  price,
  client = db
) => {
  try {

    // validation
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (!price || price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    const result = await client.query(
      `
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        price
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [order_id, product_id, quantity, price]
    );

    return result.rows[0];

  } catch (err) {
    throw new Error(
      'Error creating order item: ' + err.message
    );
  }
};


// GET ALL ITEMS FOR ORDER
const getItemsByOrderId = async (order_id) => {
  try {

    const result = await db.query(
      `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,

        p.name,
        p.description

      FROM order_items oi

      JOIN products p
      ON oi.product_id = p.id

      WHERE oi.order_id = $1

      ORDER BY oi.id ASC
      `,
      [order_id]
    );

    return result.rows;

  } catch (err) {
    throw new Error(
      'Error fetching order items: ' + err.message
    );
  }
};


// GET ORDER ITEM BY ID
const getOrderItemById = async (id) => {
  try {

    const result = await db.query(
      `
      SELECT *
      FROM order_items
      WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error(
      'Error fetching order item: ' + err.message
    );
  }
};


// UPDATE ORDER ITEM QUANTITY
const updateOrderItem = async (id, quantity) => {
  try {

    // validation
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const result = await db.query(
      `
      UPDATE order_items

      SET
        quantity = $1

      WHERE id = $2

      RETURNING *
      `,
      [quantity, id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error(
      'Error updating order item: ' + err.message
    );
  }
};


// DELETE ORDER ITEM
const deleteOrderItem = async (id) => {
  try {

    const result = await db.query(
      `
      DELETE FROM order_items
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error(
      'Error deleting order item: ' + err.message
    );
  }
};


module.exports = {
  createOrderItem,
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
};