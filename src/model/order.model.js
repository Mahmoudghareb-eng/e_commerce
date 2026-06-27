const db = require('../config/db');

// CREATE ORDER
const createOrder = async (
  user_id,
  total_price,
  status = 'pending',
  coupon_code = null,
  discount_amount = 0,
  client = db
) => {
  try {

    const result = await client.query(
      `INSERT INTO orders (
          user_id,
          total_price,
          coupon_code,
          discount_amount,
          status
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, total_price, coupon_code, discount_amount, status]
    );

    return result.rows[0];

  } catch (err) {
    throw new Error('Error creating order: ' + err.message);
  }
};


// GET ALL ORDERS
const getOrders = async (limit = 10, offset = 0) => {
  try {

    const result = await db.query(
      `SELECT *
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching orders: ' + err.message);
  }
};


// GET ORDER BY ID
const getOrderById = async (id,client=db) => {
  try {

    const result = await client.query(
      `SELECT *
       FROM orders
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching order: ' + err.message);
  }
};

//GET ORDER DETIALS
//here ??

// GET ORDERS BY USER
const getOrdersByUser = async (user_id) => {
  try {

    const result = await db.query(
      `SELECT *
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching user orders: ' + err.message);
  }
};


// UPDATE ORDER STATUS
const updateOrderStatus = async (id, status,client=db) => {
  try {

    const result = await client.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error updating order status: ' + err.message);
  }
};


// DELETE ORDER
const deleteOrder = async (id) => {
  try {

    const result = await db.query(
      `DELETE FROM orders
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error deleting order: ' + err.message);
  }
};


module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  deleteOrder
};