const express = require('express');
const checkCart = require('../middleware/cart.middleware');
const auth = require('../middleware/auth.middleware');
const checkout = require('../controllers/checkout.controller');

const router = express.Router();

router.post('/',auth,checkCart,checkout);

module.exports = router;