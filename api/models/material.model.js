import { text } from "express";
import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    IDmaterial: {
      type: String,
      unique: true,
      required: true,
    },
    dateOfPurchase: {
      type: Date,
      required: true,
    },
    materialname: {
      type: String,
      required: true,
    },
    quantityInGrams: {
      type: Number,
      required: true,
    },
    paidInUSD: {
      type: Number,
      required: true,
    },
    unitpriceinUSD: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Material = mongoose.model("Material", materialSchema);

export default Material;
