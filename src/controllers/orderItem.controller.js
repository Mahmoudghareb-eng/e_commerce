const Order_items = require('../model/orderItem.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');
const AppError = require("../middleware/error.middleware");

// CREATE ORDER ITEM
const createOrderItems = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const {order_id,product_id,quantity} = req.body;

    // VALIDATION
    if (!order_id || !product_id) {
      throw new AppError("order_id and product_id are required",400);
    }
    if (!quantity || quantity <= 0) {
      throw new AppError("Quantity must be greater than 0",400);
    }

    // CHECK ORDER EXISTS
    const order = await Order.getOrderById(order_id);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    // AUTHORIZATION CHECK
    if (order.user_id !== user_id) {
      throw new AppError("Not allowed",403);
    }

    // CHECK PRODUCT EXISTS
    const product = await Product.getProductById(product_id);
    if (!product) {
      throw new AppError("Product not found",404);
    }

    // OPTIONAL STOCK CHECK
    if (quantity > product.quantity) {
      throw new AppError("Insufficient stock",400);
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
    next(err);
  }
};

// GET ITEMS BY ORDER ID
const getItemsByOrderId = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const order_id = req.params.order_id;

    // CHECK ORDER EXISTS
    const order = await Order.getOrderById(order_id);
    if (!order) {
      throw new AppError("Order not found",404);
    }

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      throw new AppError("Not allowed",403);
    }

    // GET ITEMS
    const order_items = await Order_items.getItemsByOrderId(order_id);

    return res.status(200).json({
      message: "Order items fetched successfully",
      order_items
    });
  } catch (err) {
    next(err);
  }
};

// GET ORDER ITEM BY ID
const getOrderItemById = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      throw new AppError("Order item not found",404);      
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      throw new AppError("Not allowed",403);
    }

    return res.status(200).json({
      message: "Order item fetched successfully",
      order_item
    });

  }catch (err) {
    next(err);
  }
};

// UPDATE ORDER ITEM
const updateOrderItem = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;
    const { quantity } = req.body;

    // VALIDATION
    if (!quantity || quantity <= 0) {
      throw new AppError("Quantity must be greater than 0",400);
    }

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      throw new AppError("Order item not found",404);
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      throw new AppError("Not allowed",403);
    }

    // UPDATE ITEM
    const updatedItem =await Order_items.updateOrderItem(id,quantity);

    return res.status(200).json({
      message: "Order item updated successfully",
      order_item: updatedItem
    });

  } catch (err) {
    next(err);
  }
};

// DELETE ORDER ITEM
const deleteOrderItem = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;

    // CHECK ITEM EXISTS
    const order_item = await Order_items.getOrderItemById(id);
    if (!order_item) {
      throw new AppError("Order item not found",404);
    }

    // GET ORDER
    const order = await Order.getOrderById(order_item.order_id);

    // AUTHORIZATION
    if (order.user_id !== user_id) {
      return res.status(403).json({
        msg: "Not allowed"
      });
      throw new AppError("Not allowed",403);
    }

    // DELETE ITEM
    const deletedItem = await Order_items.deleteOrderItem(id);

    return res.status(200).json({
      message: "Order item deleted successfully",
      order_item: deletedItem
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrderItems,
  getItemsByOrderId,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem
};