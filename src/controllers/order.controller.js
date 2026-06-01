const Order = require("../model/order.model");
const User = require("../model/user.model");

const createOrder = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { total_price, status } = req.body;

    //check total_price
    if (total_price == null || isNaN(total_price) || total_price <= 0) {
      return res.status(400).json({
        msg: "total_price must be a valid number greater than 0"
      });
    }

    //check status 
    const allowedStatus = ["pending", "paid", "shipped", "delivered"];

    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        msg: "Invalid status value"
      });
    }

    // create order
    const order = await Order.createOrder(
      user_id,
      total_price,
      status || "pending"
    );

    return res.status(201).json({
      message: "Order created successfully",
      order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

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

    if (!id || isNaN(id)) {
      return res.status(400).json({ msg: "Invalid order id" });
    }

    const order = await Order.getOrderById(id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    //authorization CHECK
    if (order.user_id !== req.user.id) {
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

    //authorization
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const allowedStatus = ["pending", "paid", "shipped", "delivered"];

    if (!status || !allowedStatus.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
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

const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id;

    const order = await Order.getOrderById(id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    //authorization
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed" });
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
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};