const db = require('../config/db');

// ADD PRODUCT
const addProduct = async (name, description, price, quantity) => {
  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, price, quantity]
    );

    return result.rows[0];

  } catch (err) {
    throw new Error('Error creating product: ' + err.message);
  }
};


// GET PRODUCTS (pagination)
const getProducts = async (limit = 10, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT * FROM products
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching products: ' + err.message);
  }
};


// GET PRODUCT BY ID
const getProductById = async (id,client=db) => {
  try {
    const result = await client.query(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching product: ' + err.message);
  }
};

// GET PRODUCT BY IDS
const getProductsByIds = async (ids,client=db) => {
  try {
    const result = await client.query(
      `SELECT * FROM products WHERE id = ANY($1)`,
      [ids]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching product: ' + err.message);
  }
};

// UPDATE PRODUCT
const updateProduct = async (id, quantity, price) => {
  try {
    const result = await db.query(
      `UPDATE products
       SET quantity = $1,
           price = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [quantity, price, id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error updating product: ' + err.message);
  }
};

//update only quantity
const updateQuantity = async(id,quantity,client=db)=>{
  try{
    const result = await client.query(
      `UPDATE products
      SET quantity=$2,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *`,
      [id,quantity]
    );
    return result.rows[0];
  } catch (err) {
    throw new Error('Error updating product: ' + err.message);
  }
};

// DELETE PRODUCT
const deleteProduct = async (id) => {
  try {
    const result = await db.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error deleting product: ' + err.message);
  }
};


// EXPORT
module.exports = {
  addProduct,
  getProducts,
  getProductById,
  getProductsByIds,
  updateProduct,
  updateQuantity,
  deleteProduct
};