const Cart_item = require('../model/cartItem.model');
const Product = require('../model/product.model');
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");

// ADD ITEM TO CART
const addItemToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;

    // check product
    const product = await Product.getProductById(product_id);

    if (!product) {
      logger.warn(`Add to cart failed: Product ${product_id} not found`);
      throw new AppError("Product not found", 404);
    }

    if (product.quantity <= 0) {
      logger.warn(`Product ${product_id} is out of stock`);
      throw new AppError("Product out of stock", 400);
    }

    const cart = req.cart;

    // check existing item
    const isExist = await Cart_item.getCartItemByProduct(cart.id, product_id);

    let cartItem;

    if (isExist) {
      const newQuantity = isExist.quantity + quantity;

      if (newQuantity > product.quantity) {
        logger.warn(
          `Not enough stock for product ${product_id}. Requested: ${newQuantity}, Available: ${product.quantity}`
        );
        throw new AppError("Not enough stock", 400);
      }

      cartItem = await Cart_item.updateCartItemQuantity(
        isExist.id,
        newQuantity
      );

      logger.info(
        `User ${req.user.id} updated cart item (Cart: ${cart.id}, Product: ${product_id}, Quantity: ${newQuantity})`
      );

    } else {
      if (quantity > product.quantity) {
        logger.warn(
          `Not enough stock for product ${product_id}. Requested: ${quantity}, Available: ${product.quantity}`
        );
        throw new AppError("Not enough stock", 400);
      }

      cartItem = await Cart_item.addItemToCart(
        cart.id,
        product_id,
        quantity
      );

      logger.info(
        `User ${req.user.id} added product ${product_id} to cart ${cart.id} (Quantity: ${quantity})`
      );
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

    // VALIDATION
    if (!quantity || quantity <= 0) {
      throw new AppError("Quantity must be greater than 0", 400);
    }
    
    const cart = req.cart;

    // get item first
    const item = await Cart_item.getCartItemById(id);

    if (!item) {
      logger.warn(`Cart item ${id} not found`);
      throw new AppError("Cart item not found", 404);
    }

    // ownership check
    if (cart.id !== item.cart_id) {
      logger.warn(`Unauthorized update attempt on cart item ${id}`);
      throw new AppError("Not allowed", 403);
    }

    // check product stock
    const product = await Product.getProductById(item.product_id);

    if (!product) {
      logger.warn(`Product ${item.product_id} not found`);
      throw new AppError("Product not found", 404);
    }

    if (quantity > product.quantity) {
      logger.warn(`Not enough stock for product ${item.product_id}`);
      throw new AppError("Not enough stock", 400);
    }

    const updated = await Cart_item.updateCartItemQuantity(id, quantity);

    logger.info(
      `User ${req.user.id} updated cart item ${id} quantity to ${quantity}`
    );

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
      logger.warn(`Cart item ${id} not found`);
      throw new AppError("Cart item not found", 404);
    }

    if (cart.id !== item.cart_id) {
      logger.warn(`Unauthorized delete attempt on cart item ${id}`);
      throw new AppError("Not allowed", 403);
    }

    const cartItem = await Cart_item.removeCartItem(id);

    logger.info(
      `User ${req.user.id} removed cart item ${id}`
    );

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