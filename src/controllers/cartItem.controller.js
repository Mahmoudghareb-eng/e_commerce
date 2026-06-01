const Cart_item = require('../model/cartItem.model');
const Product = require('../model/product.model');

// ADD ITEM TO CART
const addItemToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    // validation
    if (!product_id) {
      return res.status(400).json({ msg: "Product id is required" });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({msg: "Quantity must be greater than 0"});
    }

    // check product
    const product = await Product.getProductById(product_id);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({msg: "Product out of stock"});
    }

    const cart = req.cart;

    // check existing item
    const isExist = await Cart_item.getCartItemByProduct(cart.id, product_id);

    let cartItem;

    if (isExist) {
      const newQuantity = isExist.quantity + quantity;

      if (newQuantity > product.quantity) {
        return res.status(400).json({msg: "Not enough stock"});
      }
      cartItem = await Cart_item.updateCartItemQuantity(
        isExist.id,
        newQuantity
      );
    } else {
      if (quantity > product.quantity) {
        return res.status(400).json({msg: "Not enough stock"});
      }
      cartItem = await Cart_item.addItemToCart(cart.id,product_id,quantity);
    }
    return res.status(201).json({
      message: "Item added successfully",
      cartItem
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


// GET CART ITEMS
const getCartItems = async (req, res) => {
  try {
    const cart = req.cart;

    const cartItems = await Cart_item.getCartItems(cart.id);

    return res.status(200).json({ cartItems });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


// UPDATE ITEM QUANTITY
const updateCartItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({msg: "Quantity must be greater than 0"});
    }

    const cart = req.cart;

    // get item first
    const item = await Cart_item.getCartItemById(id);

    if (!item) {
      return res.status(404).json({msg: "Cart item not found"});
    }

    // ownership check
    if (cart.id !== item.cart_id) {
      return res.status(403).json({msg: "Not allowed"});
    }

    // check product stock
    const product = await Product.getProductById(item.product_id);

    if (!product) {
      return res.status(404).json({msg: "Product not found"});
    }

    if (quantity > product.quantity) {
      return res.status(400).json({msg: "Not enough stock"});
    }

    const updated = await Cart_item.updateCartItemQuantity(id, quantity);

    return res.status(200).json({
      message: "Updated successfully",
      updated
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


// REMOVE CART ITEM
const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const cart = req.cart;

    const item = await Cart_item.getCartItemById(id);

    if (!item) {
      return res.status(404).json({msg: "Cart item not found"});
    }

    if (cart.id !== item.cart_id) {
      return res.status(403).json({msg: "Not allowed"});
    }

    const cartItem = await Cart_item.removeCartItem(id);

    return res.status(200).json({
      msg: "Deleted successfully",
      cartItem
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


module.exports = {
  addItemToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem
};