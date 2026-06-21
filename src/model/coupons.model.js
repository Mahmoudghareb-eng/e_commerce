const db = require('../config/db');

const addCoupons = async (code, discount_percent, expires_at = null) => {
    try {
        const result = await db.query(
            `INSERT INTO coupons(code, discount_percent, expires_at)
             VALUES($1, $2, $3)
             RETURNING *`,
            [code.toUpperCase(), discount_percent, expires_at]
        );

        return result.rows[0];

    } catch (err) {
        throw new Error('Error creating coupon: ' + err.message);
    }
};

const getCouponsByCode = async (code,client=db) => {
    try {
        const result = await client.query(
            `SELECT * FROM coupons WHERE code = $1`,
            [code.toUpperCase()]
        );

        return result.rows[0] || null;

    } catch (err) {
        throw new Error('Error fetching coupon: ' + err.message);
    }
};

const deleteCoupons = async (code) => {
    try {
        const result = await db.query(
            `DELETE FROM coupons
             WHERE code = $1
             RETURNING *`,
            [code.toUpperCase()]
        );

        return result.rows[0] || null;

    } catch (err) {
        throw new Error('Error deleting coupon: ' + err.message);
    }
};

module.exports = {
    addCoupons,
    getCouponsByCode,
    deleteCoupons
};