import express from "express";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  getExpenses,
} from "../controllers/expense.controller.js";

const router = express.Router();

// Create a new product
router.post("/", createExpense);

// Delete a product by ID
router.delete("/:id", deleteExpense);

// Update a product by ID
router.put("/:id", updateExpense);

// Get all products
router.get("/", getExpenses);

export default router;
