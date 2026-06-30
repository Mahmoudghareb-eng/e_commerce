const db = require('../config/db');

// CREATE REFRESH TOKEN
const createRefreshToken = async (
  user_id,
  token_hash,
  revoked = false
) => {
  try {
    const result = await db.query(
      `INSERT INTO refresh_tokens
      (user_id, token_hash, expires_at, revoked)
      VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)
      RETURNING *`,
      [user_id, token_hash, revoked]
    );

    return result.rows[0];
  } catch (err) {
    throw new Error("Error creating refresh token: " + err.message);
  }
};

// GET REFRESH TOKEN
const getRefreshToken = async (token_hash) => {
  try {
    const result = await db.query(
      `SELECT *
       FROM refresh_tokens
       WHERE token_hash = $1
       AND expires_at > NOW()
       AND revoked = FALSE`,
      [token_hash]
    );

    return result.rows[0] || null;
  } catch (err) {
    throw new Error("Error fetching refresh token: " + err.message);
  }
};

// REVOKE REFRESH TOKEN
const revokeRefreshToken = async (token_hash) => {
  try {
    const result = await db.query(
      `UPDATE refresh_tokens
       SET revoked = TRUE
       WHERE token_hash = $1
       RETURNING *`,
      [token_hash]
    );

    return result.rows[0] || null;
  } catch (err) {
    throw new Error("Error revoking refresh token: " + err.message);
  }
};

// DELETE REFRESH TOKEN
const deleteRefreshToken = async (token_hash) => {
  try {
    const result = await db.query(
      `DELETE FROM refresh_tokens
       WHERE token_hash = $1
       AND expires_at < NOW()
       RETURNING *`,
      [token_hash]
    );

    return result.rows[0] || null;
  } catch (err) {
    throw new Error("Error deleting refresh token: " + err.message);
  }
};

module.exports = {
  createRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  deleteRefreshToken,
};