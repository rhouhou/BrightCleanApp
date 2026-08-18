import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use("/api/purchases", purchaseRoutes);

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
