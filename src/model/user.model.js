const db = require('../config/db');

// create user
const createUser = async (name, email, hashedPassword, role = 'user') => {
  try {
    const result = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, role]
    );

    return result.rows[0];

  } catch (err) {
    throw new Error('Error creating user: ' + err.message);
  }
};

// get all users
const getUsers = async (limit = 10, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching users: ' + err.message);
  }
};

// get user by id
const getUserById = async (id) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching user: ' + err.message);
  }
};

// get user by email
const getUserByEmail = async (email) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching user by email: ' + err.message);
  }
};

// update user
const updateUser = async (id, name, email) => {
  try {
    const result = await db.query(
      `UPDATE users
       SET name = $1,
           email = $2
       WHERE id = $3
       RETURNING id, name, email, role, created_at`,
      [name, email, id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error updating user: ' + err.message);
  }
};

// delete user
const deleteUser = async (id) => {
  try {
    const result = await db.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, name, email`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error deleting user: ' + err.message);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
};