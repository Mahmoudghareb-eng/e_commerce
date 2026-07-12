const Coupons = require('../model/coupons.model');

const createCoupon = async(req,res)=>{
    try{
    const {code,discount_percent,expires_at} = req.body;

    const existingCoupon = await Coupons.getCouponsByCode(code);
    if(existingCoupon){
    return res.status(400).json({msg: "Coupon already exists"});
    }
    const coupon = await Coupons.addCoupons(code,discount_percent,expires_at);
    return res.status(201).json({msg:"create successfully",coupon});
    }catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

const getCouponsByCode = async(req,res)=>{
    try{
    const {code} = req.params;
   
    const coupon = await Coupons.getCouponsByCode(code);
    if (!coupon) {
    return res.status(404).json({msg: "Coupon not found"});
    }
    return res.status(200).json({coupon});
    }catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

const deleteCoupons = async(req,res)=>{
    try{
    const {code} = req.params;
   
    const coupon = await Coupons.deleteCoupons(code);
    if (!coupon) {
    return res.status(404).json({msg: "Coupon not found"});
    }
    return res.status(200).json({coupon});
    }catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }    
};

module.exports = {
    createCoupon,
    getCouponsByCode,
    deleteCoupons
};