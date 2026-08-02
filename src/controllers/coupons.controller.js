const Coupons = require('../model/coupons.model');
const { AppError } = require("../middleware/error.middleware");
const logger = require('../config/logger');
const createCoupon = async(req,res,next)=>{
    try{
    const {code,discount_percent,expires_at} = req.body;

    const existingCoupon = await Coupons.getCouponsByCode(code);
    if(existingCoupon){
    logger.warn(`Coupon creation failed: Code "${code}" already exists`); 
    throw new AppError("Coupon already exists",400);
    }
    const coupon = await Coupons.addCoupons(code,discount_percent,expires_at);
    logger.info(`Coupon created: Code "${coupon.code}", Discount ${coupon.discount_percent}%`);
    return res.status(201).json({msg:"create successfully",coupon});
    }catch (err) {
      next(err);
  }
};

const getCouponsByCode = async(req,res,next)=>{
    try{
    const {code} = req.params;
   
    const coupon = await Coupons.getCouponsByCode(code);
    if (!coupon) {
    logger.warn(`Coupon not found: Code "${code}"`);
    throw new AppError("Coupon not found",404);
    }
    return res.status(200).json({coupon});
    }catch (err) {
      next(err);
  }
};

const deleteCoupons = async (req, res, next) => {
    try{
    const {code} = req.params;
   
    const coupon = await Coupons.deleteCoupons(code);
    if (!coupon) {
    logger.warn(`Delete failed: Coupon "${code}" not found`)  
    throw new AppError("Coupon not found",404);
    }
    logger.info(`Coupon deleted: Code "${code}"`);
    return res.status(200).json({coupon});
    }catch (err) {
      next(err);
  }    
};

module.exports = {
    createCoupon,
    getCouponsByCode,
    deleteCoupons
};