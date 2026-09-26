const db = require('../config/db');
const Order = require("../model/order.model");
const Product = require("../model/product.model");
const Order_items = require("../model/orderItem.model");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");
const redis = require("../config/redis");
const clearCacheByPattern = require("../utility/redis.util");

const getMyOrders = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const cacheKey = `orders:${user_id}`;
    const cache = await redis.get(cacheKey);
    if (cache) {
      return res.status(200).json({
        message: "Orders fetched successfully",
        orders: JSON.parse(cache)
      });
    }

    const orders = await Order.getOrdersByUser(user_id);
    await redis.setEx(cacheKey,60,JSON.stringify(orders));
    return res.status(200).json({
      message: "Orders fetched successfully",
      orders
    });

  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const cacheKey = `order:${id}`;
    const cache = await redis.get(cacheKey);
    let order;
    if(cache){
      order = JSON.parse(cache);
    }else{
       order = await Order.getOrderById(id);

      if (!order) {
      logger.warn(`Order ${id} not found`);
      throw new AppError("Order not found",404);
    }
    await redis.setEx(cacheKey, 60, JSON.stringify(order));
    }

    //authorization CHECK
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      logger.warn(`Unauthorized access to order ${id} by user ${req.user.id}`);
      throw new AppError("Not allowed",403);
    }
    return res.status(200).json({
      message: "Order fetched successfully",
      order
    });

  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const order = await Order.getOrderById(id);

    if (!order) {
      logger.warn(`Update failed: Order ${id} not found`);
      throw new AppError("Order not found",404);
    }

    const updatedOrder = await Order.updateOrderStatus(id, status);
    logger.info(`Order ${id} status updated to ${status} by user ${req.user.id}`);
    await redis.del(`order:${id}`);
    await clearCacheByPattern("orders:*");
    return res.status(200).json({
      message: "Order updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    next(err);
  }
};

const cancelOrder = async(req,res,next)=>{
  let client;
  let committed = false;

  try{
    client = await db.connect();
    await client.query('BEGIN');
    const orderId = req.params.id;

    //get order
    const order = await Order.getOrderById(orderId,client);
    if(!order){
      logger.warn(`Cancel failed: Order ${orderId} not found`);
      throw new AppError('Order Not Found',404);
    } 

    //authorization
    if(order.user_id !== req.user.id){
      logger.warn(`User ${req.user.id} tried to cancel order ${orderId} without permission`);
      throw new AppError('Not allowed',403);     
    }

    //check status
    if(order.status !== 'pending'){
      logger.warn(`Cancel failed: Order ${orderId} status is ${order.status}`);
      throw new AppError('Only pending orders can be cancelled',400);
    }

    //get items
    const items = await Order_items.getItemsByOrderId(orderId,client);

    //restore stock
    const productIds = items.map(item=>item.product_id);
    const productRows = await Product.getProductsByIds(productIds,client)
    const products = {};
    for(const product of productRows){
        products[product.id]=product;
    }
    for(const item of items){
      const product = products[item.product_id];
      if (!product) {
      throw new AppError(`Product ${item.product_id} not found`,404);
    }
      const newQuantity = item.quantity + product.quantity;
      await Product.updateQuantity(product.id,newQuantity,client);
    }

    //update status
    await Order.updateOrderStatus(orderId,'cancelled',client);

    await client.query('COMMIT');
    committed=true;
    await redis.del(`order:${orderId}`);
    await clearCacheByPattern("orders:*");
    logger.info(`Order ${orderId} cancelled successfully by user ${req.user.id}`);
    return res.status(200).json({message: 'Order cancelled successfully'});
  } catch (err) {
    if (client&&!committed){
      await client.query('ROLLBACK');
      logger.error(`Transaction rolled back while cancelling order ${req.params.id}`);
    } 
    next(err);
  }finally{
    if (client) client.release()
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const id = req.params.id;

    const order = await Order.getOrderById(id);

    if (!order) {
      logger.warn(`Delete failed: Order ${id} not found`);
      throw new AppError("Order not found",404);
    }

    await Order.deleteOrder(id);
    logger.info(`Order ${id} deleted by user ${req.user.id}`);
    await redis.del(`order:${id}`);
    await clearCacheByPattern("orders:*");
    return res.status(200).json({
      message: "Order deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
};