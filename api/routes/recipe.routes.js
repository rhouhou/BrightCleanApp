import express from "express";
import {
  createRecipe,
  deleteRecipe,
  updateRecipe,
  getRecipes,
} from "../controllers/recipe.controller.js";

const router = express.Router();

// Create a new product
router.post("/", createRecipe);

// Delete a product by ID
router.delete("/:id", deleteRecipe);

// Update a product by ID
router.put("/:id", updateRecipe);

// Get all products
router.get("/", getRecipes);

export default router;
