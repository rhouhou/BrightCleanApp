import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/product.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import accountingRoutes from "./routes/accounting.routes.js";
import materialRoutes from "./routes/material.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import barcodeRoutes from './routes/barcode.routes.js';
import purchaseRoutes from "./routes/purchase.routes.js";
import {
  verifyStaff,
  requireSection,
} from "./middleware/auth.middleware.js";
import inventoryRoutes from "./routes/inventory.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/auth", authRoutes);

app.use("/api/products", verifyStaff, requireSection("products"), productRoutes);
app.use("/api/sales", verifyStaff, requireSection("sales"), saleRoutes);
app.use("/api/expenses", verifyStaff, requireSection("expenses"), expenseRoutes);
app.use("/api/accounting", verifyStaff, requireSection("accounting"), accountingRoutes);
app.use("/api/materials", verifyStaff, requireSection("materials"), materialRoutes);
app.use("/api/recipes", verifyStaff, requireSection("recipes"), recipeRoutes);
app.use("/api/purchases", verifyStaff, requireSection("purchases"), purchaseRoutes);
app.use("/api/user", verifyStaff, requireSection("users"), userRoutes);
app.use('/api/barcode', verifyStaff, requireSection("products"), barcodeRoutes);
app.use('/api/inventory', verifyStaff, requireSection("inventory"), inventoryRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000!!!");
});
