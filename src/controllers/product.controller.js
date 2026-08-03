const Product = require("../model/product.model");
const { AppError } = require("../middleware/error.middleware");
const logger = require("../config/logger");


// CREATE PRODUCT
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, quantity } = req.body;

    const product = await Product.addProduct(
      name.trim(),
      description.trim(),
      price,
      quantity
    );
    logger.info(`Product created (ID: ${product.id}, Name: ${product.name})`);
    return res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {
    next(err);
  }
};


// GET ALL PRODUCTS
const getProducts = async (req, res, next) => {
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
    next(err);
  }
};


// GET PRODUCT BY ID
const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const product = await Product.getProductById(id);

    if (!product) {
      logger.warn(`Product not found (ID: ${id})`);
      throw new AppError("Product not found",404);
    }

    return res.status(200).json(product);

  } catch (err) {
    next(err);
  }
};


// UPDATE PRODUCT
const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const { quantity, price } = req.body;

    const isExist = await Product.getProductById(id);

    if (!isExist) {
      logger.warn(`Update failed: Product ${id} not found`);
      throw new AppError("Product not found",404);
    }

    const updatedProduct = await Product.updateProduct(
      id,
      quantity,
      price
    );
    logger.info(`Product updated (ID: ${id})`);
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (err) {
    next(err);
  }
};


// DELETE PRODUCT
const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const deletedProduct = await Product.deleteProduct(id);

    if (!deletedProduct) {
      logger.warn(`Delete failed: Product ${id} not found`);
      throw new AppError("Product not found",404);
    }

    await Product.deleteProduct(id);
    logger.info(`Product deleted (ID: ${id}, Name: ${deletedProduct.name})`);
    return res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};