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
    throw new Error('Error creating user: ' + err.message, { cause: err }, { cause: err });
  }
};

// get all users
const getUsers = async (limit = 10, offset = 0) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;

  } catch (err) {
    throw new Error('Error fetching users: ' + err.message, { cause: err });
  }
};

// get user by id
const getUserById = async (id) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching user: ' + err.message, { cause: err });
  }
};

// get user by email
const getUserByEmail = async (email) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error fetching user by email: ' + err.message, { cause: err });
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
       AND deleted_at IS NULL
       RETURNING id, name, email, role, created_at`,
      [name, email, id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error updating user: ' + err.message, { cause: err });
  }
};

const setResetCode = async (userId, code, expiresAt) => {
  const result = await db.query(
    `UPDATE users
     SET reset_code = $1,
         reset_code_expires_at = $2,
         reset_attempts = 0
     WHERE id = $3
     RETURNING id, email`,
    [code, expiresAt, userId]
  );

  return result.rows[0];
};

const incrementResetAttempts = async (userId) => {
  const result = await db.query(
    `UPDATE users
     SET reset_attempts = reset_attempts + 1
     WHERE id = $1
     RETURNING reset_attempts`,
    [userId]
  );

  return result.rows[0];
};

const updatePassword = async (userId, password) => {
  const result = await db.query(
    `UPDATE users
     SET password = $1,
         reset_code = NULL,
         reset_code_expires_at = NULL,
         reset_attempts = 0
     WHERE id = $2
     RETURNING id, email`,
    [password, userId]
  );

  return result.rows[0];
};

// delete user
const deleteUser = async (id) => {
  try {
    const result = await db.query(
      `UPDATE users
      SET deleted_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *`,
      [id]
    );

    return result.rows[0] || null;

  } catch (err) {
    throw new Error('Error deleting user: ' + err.message, { cause: err });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  setResetCode,
  updatePassword,
  incrementResetAttempts,
  deleteUser
};