const db = require('../config/db');
const Order = require("../model/order.model");
const Product = require("../model/product.model");
const Order_items = require("../model/orderItem.model");
const AppError = require("../middleware/error.middleware");


const getMyOrders = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const orders = await Order.getOrdersByUser(user_id);

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

    const order = await Order.getOrderById(id);

    if (!order) {
      throw new AppError("Order not found",404);
    }

    //authorization CHECK
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
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
      throw new AppError("Order not found",404);
    }

    const updatedOrder = await Order.updateOrderStatus(id, status);

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
  try{
    client = await db.connect();
    await client.query('BEGIN');
    const orderId = req.params.id;

    //get order
    const order = await Order.getOrderById(orderId,client);
    if(!order){
      throw new AppError('Order Not Found',404);
    } 

    //authorization
    if(order.user_id !== req.user.id){
      throw new AppError('Not allowed',403);     
    }

    //check status
    if(order.status !== 'pending'){
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
    await Order.updateOrderStatus(orderId,'cancelled',client)

    await client.query('COMMIT');
    return res.status(200).json({message: 'Order cancelled successfully'});
  } catch (err) {
    if (client) await client.query('ROLLBACK');
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
      return res.status(404).json({ msg: "Order not found" });
    }

    await Order.deleteOrder(id);

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