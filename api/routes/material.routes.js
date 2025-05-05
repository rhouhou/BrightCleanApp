import express from "express";
import {
  createMaterial,
  deleteMaterial,
  updateMaterial,
  getMaterials,
} from "../controllers/material.controller.js";

const router = express.Router();

// Create a new product
router.post("/", createMaterial);

// Delete a product by ID
router.delete("/:id", deleteMaterial);

// Update a product by ID
router.put("/:id", updateMaterial);

// Get all products
router.get("/", getMaterials);

export default router;
