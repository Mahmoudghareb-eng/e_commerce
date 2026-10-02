const db = require('../config/db');

// ADD PRODUCT
const addProduct = async (name, description, price, quantity, image_url) => {
  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, quantity, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, quantity, image_url]
    );

    return result.rows[0];

  } catch (err) {
    throw new Error('Error creating product: ' + err.message);
  }
};


// GET PRODUCTS (pagination)
const getProducts = async(search,minprice,maxprice,sort,limit,offset)=>{
  try{
  let query = `SELECT * FROM products WHERE 1=1 AND deleted_at IS NULL`;
  let values = [];
  if (search) {
    values.push(`%${search}%`);
    query += ` AND name ILIKE $${values.length}`;
  }if(minprice){
    values.push(minprice);
    query += ` AND price >= $${values.length}`
  }if(maxprice){
    values.push(maxprice);    
    query += ` AND price <= $${values.length}`
  }
  if(sort){
    if(sort === 'price_asc')
      query += ` ORDER BY price ASC`;
    else if(sort === 'price_desc')
      query += ` ORDER BY price DESC`;
  }if(limit!=null&&offset!=null){
    values.push(limit);
    values.push(offset);
    query+= ` LIMIT $${values.length-1} OFFSET $${values.length}`
  }
  const result = await db.query(query,values);
  return result.rows;
  }catch (err) {
    throw new Error('Error fetching products: ' + err.message);
  }
}

// GET PRODUCT BY ID
const getProductById = async (id,client=db) => {
  try {
    const result = await client.query(
      `SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL`,
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
      `SELECT * FROM products WHERE id = ANY($1) AND deleted_at IS NULL
      FOR UPDATE`,
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
       AND deleted_at IS NULL
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
      WHERE id = $1 AND deleted_at IS NULL
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
      `UPDATE products
       SET deleted_at = NOW(),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       AND deleted_at IS NULL
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