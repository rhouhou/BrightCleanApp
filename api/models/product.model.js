import { text } from "express";
import mongoose from "mongoose";

const priceTierSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: [
      "retail_with_bottle",
      "retail_without_bottle",
      "wholesale_schools",
      "wholesale_restaurants",
      // add new tiers here as needed...
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "LL",    // or "USD", depending on the tier
    enum: ["LL", "USD"],
  },
});

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    scent: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
      default: "colorless",
    },
    productname: {
      type: String,
      required: true,
      unique: true,
    },
    bottlesize: {
      type: Number,
      required: true,
      min: 0,
    },
    bottlePurchaseItemId: {
      type: String,
      default: "",
    },
    labelPurchaseItemId: {
      type: String,
      default: "",
    },
    bottlecost: {
      type: Number,
      required: true,
      min: 0,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalcost: {
      type: Number,
      required: true,
      min: 0,
    },
    prices: {
      type: [priceTierSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
