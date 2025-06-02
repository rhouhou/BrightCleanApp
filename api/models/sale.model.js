import { text } from "express";
import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
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
    priceTier:{
      type: String,
      enum: [
        "retail_with_bottle", 
        "retail_without_bottle", 
        "Wholesale_schools",
        "wholesale_restaurants"
      ],
      required: true,
    },
    productname: {
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

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;
