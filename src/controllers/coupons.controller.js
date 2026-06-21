const Coupons = require('../model/coupons.model');

const createCoupon = async(req,res)=>{
    try{
    const {code,discount_percent,expires_at} = req.body;
    if(!code?.trim()||discount_percent==null)
    return res.status(400).json({msg: "All fields are required"});
    if (!(discount_percent > 0 && discount_percent <= 100))
    return res.status(400).json({msg:"Discount price must be between 0 and 100"});
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
    if(!code?.tirm())
    return res.status(400).json({msg: "Coupon code is required"});     
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
    if(!code?.tirm())
    return res.status(400).json({msg: "Coupon code is required"});     
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