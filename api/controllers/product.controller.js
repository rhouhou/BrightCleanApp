import Product from "../models/product.model.js";
import {
  calculateProductCostAtDate,
} from "../utils/productCost.js";
import { errorHandler } from "../utils/error.js";

export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ error: "Failed to save product" });
  }
};

export const deleteProduct = async (req, res, next) => {
  const existingProduct = await Product.findById(req.params.id);

  if (!existingProduct) return next(errorHandler(404, "Product not found"));

  try {
    await Product.findByIdAndDelete(req.params.id);
    return res.status(200).json("Product has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(errorHandler(404, "Product not found"));

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductCostAtDate = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const result =
      await calculateProductCostAtDate({
        productId: id,
        date,
      });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error calculating product cost:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to calculate product cost",
      error: error.message,
    });
  }
};