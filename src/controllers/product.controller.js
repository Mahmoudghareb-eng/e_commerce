const Product = require("../model/product.model");


// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;

    const product = await Product.addProduct(
      name.trim(),
      description.trim(),
      price,
      quantity
    );

    return res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
};


// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit)||10;
    const offset = (page-1)*limit;
    const minPrice = req.query.minPrice? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice? Number(req.query.maxPrice) : null;
    const products = await Product.getProducts(
    req.query.search,
    minPrice,
    maxPrice,
    req.query.sort,
    limit,
    offset
  );

    return res.status(200).json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
};


// GET PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.getProductById(id);

    if (!product) {
      return res.status(404).json({
        msg: "Product not found"
      });
    }

    return res.status(200).json(product);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const { quantity, price } = req.body;

    const isExist = await Product.getProductById(id);

    if (!isExist) {
      return res.status(404).json({
        msg: "Product not found"
      });
    }

    const updatedProduct = await Product.updateProduct(
      id,
      quantity,
      price
    );

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
};


// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const isExist = await Product.getProductById(id);

    if (!isExist) {
      return res.status(404).json({
        msg: "Product not found"
      });
    }

    await Product.deleteProduct(id);

    return res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Server error"
    });
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};