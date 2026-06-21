const express = require('express');

const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');

const {
  createCoupon,
  getCouponsByCode,
  deleteCoupons
} = require('../controllers/coupons.controller');

const router = express.Router();

router.post('/', auth, isAdmin, createCoupon);

router.get('/:code', auth, isAdmin, getCouponsByCode);

router.delete('/:code', auth, isAdmin, deleteCoupons);

module.exports = router;