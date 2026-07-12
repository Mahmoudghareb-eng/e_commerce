const express = require('express');

const auth = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/isAdmin');
const { createValidation, codeValidation} = require("../validators/coupon.validator")
const validate = require('../middleware/validator.middleware');

const {
  createCoupon,
  getCouponsByCode,
  deleteCoupons
} = require('../controllers/coupons.controller');

const router = express.Router();

router.post('/', auth, isAdmin, createValidation, validate, createCoupon);

router.get('/:code', auth, isAdmin, codeValidation, validate, getCouponsByCode);

router.delete('/:code', auth, isAdmin, codeValidation, validate, deleteCoupons);

module.exports = router;