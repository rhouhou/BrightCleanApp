import { text } from "express";
import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    transactions: {
      type: String,
      unique: true,
      required: true,
    },
    dateOfPurchase: {
      type: Date,
      required: true,
    },
    businessType: {
      type: String,
      required: true,
    },
    productname: {
      type: String,
      required: true,
    },
    isWithBottle: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitprice: {
      type: Number,
      required: true,
    },
    totalamount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;
