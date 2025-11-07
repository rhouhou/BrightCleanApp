import express from "express";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  getProducts,
} from "../controllers/product.controller.js";

const router = express.Router();

// Create a new product
router.post("/", createProduct);

// Delete a product by ID
router.delete("/:id", deleteProduct);

// Update a product by ID
router.put("/:id", updateProduct);

// Get all products
router.get("/", getProducts);

export default router;
