const db = require('../config/db');
const Order = require("../model/order.model");
const Product = require("../model/product.model");
const Order_items = require("../model/orderItem.model");


const getOrders = async (req, res) => {
  try {
    const user_id = req.user.id;

    const orders = await Order.getOrdersByUser(user_id);

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const id = req.params.id;



    const order = await Order.getOrderById(id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    //authorization CHECK
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    const order = await Order.getOrderById(id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const updatedOrder = await Order.updateOrderStatus(id, status);

    return res.status(200).json({
      message: "Order updated successfully",
      order: updatedOrder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const cancelOrder = async(req,res)=>{
  let client;
  try{
    client = await db.connect();
    await client.query('BEGIN');
    const orderId = req.params.id;

    //get order
    const order = await Order.getOrderById(orderId,client);
    if(!order){
      const err = new Error('Order Not Found');
      err.status=404;
      throw err;
    } 

    //authorization
    if(order.user_id !== req.user.id){
      const err = new Error('Not allowed');
      err.status=403;
      throw err;
    }

    //check status
    if(order.status !== 'pending'){
      const err = new Error('Only pending orders can be cancelled');
      err.status=400;
      throw err;
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
      const err = new Error(`Product ${item.product_id} not found`);
      err.status = 404;
      throw err;
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
    res.status(err.status||500).json({ msg: err.message||"Server error" });
  }finally{
    if (client) client.release()
  }
};

const deleteOrder = async (req, res) => {
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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder
};