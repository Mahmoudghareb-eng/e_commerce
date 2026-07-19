const Coupons = require('../model/coupons.model');
const AppError = require("../middleware/error.middleware");

const createCoupon = async(req,res,next)=>{
    try{
    const {code,discount_percent,expires_at} = req.body;

    const existingCoupon = await Coupons.getCouponsByCode(code);
    if(existingCoupon){
    throw new AppError("Coupon already exists",400);
    }
    const coupon = await Coupons.addCoupons(code,discount_percent,expires_at);
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
    throw new AppError("Coupon not found",404);
    }
    return res.status(200).json({coupon});
    }catch (err) {
      next(err);
  }
};

const deleteCoupons = async(req,res)=>{
    try{
    const {code} = req.params;
   
    const coupon = await Coupons.deleteCoupons(code);
    if (!coupon) {
    throw new AppError("Coupon not found",404);
    }
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