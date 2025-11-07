import express from "express";
import {
  createSale,
  deleteSale,
  updateSale,
  getSales,
} from "../controllers/sale.controller.js";

const router = express.Router();

// Create a new product
router.post("/", createSale);

// Delete a product by ID
router.delete("/:id", deleteSale);

// Update a product by ID
router.put("/:id", updateSale);

// Get all products
router.get("/", getSales);

export default router;
