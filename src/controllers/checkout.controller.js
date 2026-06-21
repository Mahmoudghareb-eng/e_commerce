const db = require('../config/db');
const Cart = require('../model/cart.model');
const Cart_item = require('../model/cartItem.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');
const Order_items = require('../model/orderItem.model');
const Coupon = require('../model/coupons.model');

const checkout = async(req,res)=>{
    let client;
    try{
        client = await db.connect()   
        await client.query('BEGIN');

        const cart = req.cart;
        const {code} = req.body;
        const items = await Cart_item.getCartItems(cart.id,client);
        if(items.length === 0){
            const err = new Error(`cart is empty`);
            err.status=400;
            throw err;
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
                const err = new Error(`Product ${item.product_id} not found`);
                err.status=404;
                throw err;
            }
            if(product.quantity<item.quantity){
                const err = new Error(`${product.name} does not have enough stock`);
                err.status=400;
                throw err;                
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
                const err = new Error('Invalid Coupon')
                err.status=400
                throw err;                
            }
            if(coupon.expires_at&&new Date(coupon.expires_at)<new Date()){
                const err = new Error('Coupon expired');
                err.status=400
                throw err;
            }
            discount = total_price * (coupon.discount_percent/100);
            total_price-=discount;
        }
        const order = await Order.createOrder(req.user.id,total_price,"pending",client);
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
    res.status(err.status||500).json({ msg: err.message||"Server error" });
  }finally{
    if (client) client.release()
  }
}

module.exports = checkout;
