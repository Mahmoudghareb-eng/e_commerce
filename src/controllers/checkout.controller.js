const db = require('../config/db');
const Cart = require('../model/cart.model');
const Cart_item = require('../model/cartItem.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');
const Order_items = require('../model/orderItem.model');
const Coupon = require('../model/coupons.model');
const AppError = require("../middleware/error.middleware");

const checkout = async(req,res,next)=>{
    let client;
    try{
        client = await db.connect()   
        await client.query('BEGIN');

        const cart = req.cart;
        const {code} = req.body;
        const items = await Cart_item.getCartItems(cart.id,client);
        if(items.length === 0){
            throw new AppError("cart is empty",400);
        }
        const productsIds = items.map(item=>item.product_id);
        const productRows = await Product.getProductsByIds(productsIds,client);
        const products = {};
        for(const product of productRows){
            products[product.id]=product;
        }
        for(const item of items){
            const product = products[item.product_id];
            if (!product) {
                throw new AppError(`Product ${item.product_id} not found`,404);
            }
            if(product.quantity<item.quantity){
                throw new AppError(`${product.name} does not have enough stock`,400);                
            }
        }
        let total_price = 0;
        for(const item of items){
            total_price+=item.quantity*item.price;
        }
        let discount = 0;
        let coupon;
        if(code){
            coupon = await Coupon.getCouponsByCode(code,client);
            if(!coupon){
                throw new AppError('Invalid Coupon',400);                
            }
            if(coupon.expires_at&&new Date(coupon.expires_at)<new Date()){
                throw new AppError('Coupon expired',400);
            }
            discount = total_price * (coupon.discount_percent/100);
            total_price-=discount;
        }
        const order = await Order.createOrder(req.user.id,total_price,"pending",code,discount,client);
        let order_items=[];
        for(const item of items){
            const orderItem = await Order_items.createOrderItem(
                order.id,
                item.product_id,
                item.quantity,
                item.price,
                client
            );
            order_items.push(orderItem);
            const product = products[item.product_id];
            await Product.updateQuantity(product.id,product.quantity - item.quantity,client);
        }
        await Cart.clearCart(cart.id,client);
        await client.query('COMMIT');
        return res.status(201).json({
    message: "Checkout successful",
    order,
    order_items
});
    } catch (err) {
    if (client) await client.query('ROLLBACK');
    next(err);
  }finally{
    if (client) client.release()
  }
}

module.exports = checkout;
