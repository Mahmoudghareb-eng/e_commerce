const Order_items = require('../model/orderItem.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');


// CREATE ORDER ITEM
const createOrderItems = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {order_id,product_id,quantity} = req.body;

    // VALIDATION
    if (!order_id || !product_id) {
      return res.status(400).json({
        msg: "order_id and product_id are required"
      });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        msg: "Quantity must be greater than 0"
      });
    }

    // CHECK ORDER EXISTS
    const order = await Order.getOrderById(order_id);
    if (!order) {
      return res.status(404).json({
        msg: "Order not found"
      });
    }

    // AUTHORIZATION CHECK
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
    }

    // CHECK PRODUCT EXISTS
    const product = await Product.getProductById(product_id);
    if (!product) {
      return res.status(404).json({
        msg: "Product not found"
      });
    }

    // OPTIONAL STOCK CHECK
    if (quantity > product.quantity) {
      return res.status(400).json({
        msg: "Insufficient stock"
      });
    }

    // GET REAL PRICE FROM DATABASE
    const price = product.price;

    // CREATE ORDER ITEM
    const order_item = await Order_items.createOrderItem(order_id,product_id,quantity,price);

    return res.status(201).json({
      message: "Order item created successfully",
      order_item
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({msg: "Server error"});
  }
};

// GET ITEMS BY ORDER ID
const getItemsByOrderId = async (req, res) => {
  try {
    const user_id = req.user.id;
    const order_id = req.params.order_id;

    // CHECK ORDER EXISTS
    const order = await Order.getOrderById(order_id);
    if (!order) {
      return res.status(404).json({
        msg: "Order not found"
      });
    }

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
    }

    // GET ITEMS
    const order_items = await Order_items.getItemsByOrderId(order_id);

    return res.status(200).json({
      message: "Order items fetched successfully",
      order_items
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({msg: "Server error"});
  }
};

// GET ORDER ITEM BY ID
const getOrderItemById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      return res.status(404).json({
        msg: "Order item not found"
      });
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
    }

    return res.status(200).json({
      message: "Order item fetched successfully",
      order_item
    });

  }catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Server error"
    });
  }
};

// UPDATE ORDER ITEM
const updateOrderItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;
    const { quantity } = req.body;

    // VALIDATION
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        msg: "Quantity must be greater than 0"
      });
    }

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      return res.status(404).json({
        msg: "Order item not found"
      });
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
    }

    // UPDATE ITEM
    const updatedItem =await Order_items.updateOrderItem(id,quantity);

    return res.status(200).json({
      message: "Order item updated successfully",
      order_item: updatedItem
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Server error"
    });
  }
};

// DELETE ORDER ITEM
const deleteOrderItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      return res.status(404).json({
        msg: "Order item not found"
      });
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
    }

    // DELETE ITEM
    const deletedItem = await Order_items.deleteOrderItem(id);

    return res.status(200).json({
      message: "Order item deleted successfully",
      order_item: deletedItem
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Server error"
    });
  }
};

module.exports = {
  createOrderItems,
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
};