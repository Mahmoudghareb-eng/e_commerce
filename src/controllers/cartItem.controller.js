const Cart_item = require('../model/cartItem.model');
const Product = require('../model/product.model');
const AppError = require("../middleware/error.middleware");

// ADD ITEM TO CART
const addItemToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    // check product
    const product = await Product.getProductById(product_id);

    if (!product) {
      throw new AppError("Product not found",404);
    }

    if (product.quantity <= 0) {
      throw new AppError("Product out of stock",400);
    }

    const cart = req.cart;

    // check existing item
    const isExist = await Cart_item.getCartItemByProduct(cart.id, product_id);

    let cartItem;

    if (isExist) {
      const newQuantity = isExist.quantity + quantity;

      if (newQuantity > product.quantity) {
        throw new AppError("Not enough stock",400);
      }
      cartItem = await Cart_item.updateCartItemQuantity(
        isExist.id,
        newQuantity
      );
    } else {
      if (quantity > product.quantity) {
        throw new AppError("Not enough stock",400);
      }
      cartItem = await Cart_item.addItemToCart(cart.id,product_id,quantity);
    }
    return res.status(201).json({
      message: "Item added successfully",
      cartItem
    });

  } catch (err) {
    next(err);
  }
};


// GET CART ITEMS
const getCartItems = async (req, res, next) => {
  try {
    const cart = req.cart;

    const cartItems = await Cart_item.getCartItems(cart.id);

    return res.status(200).json({ cartItems });

  } catch (err) {
    next(err);
  }
};


// UPDATE ITEM QUANTITY
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = req.cart;

    // get item first
    const item = await Cart_item.getCartItemById(id);

    if (!item) {
      throw new AppError("Cart item not found",404);
    }

    // ownership check
    if (cart.id !== item.cart_id) {
      throw new AppError("Not allowed",403);
    }

    // check product stock
    const product = await Product.getProductById(item.product_id);

    if (!product) {
      throw new AppError("Product not found",404);
    }

    if (quantity > product.quantity) {
      throw new AppError("Not enough stock",400);
    }

    const updated = await Cart_item.updateCartItemQuantity(id, quantity);

    return res.status(200).json({
      message: "Updated successfully",
      updated
    });

  } catch (err) {
    next(err);
  }
};


// REMOVE CART ITEM
const removeCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = req.cart;

    const item = await Cart_item.getCartItemById(id);

    if (!item) {
      throw new AppError("Cart item not found",404); 
    }

    if (cart.id !== item.cart_id) {
      throw new AppError("Not allowed",403);
    }

    const cartItem = await Cart_item.removeCartItem(id);

    return res.status(200).json({
      msg: "Deleted successfully",
      cartItem
    });

  } catch (err) {
    next(err);
  }
};


module.exports = {
  addItemToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem
};