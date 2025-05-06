import { text } from "express";
import mongoose from "mongoose";
import { validate } from "uuid";

const materialSchema = new mongoose.Schema(
  {
    IDmaterial: {
      type: String,
      unique: true,
      required: true,
    },
    materialname: {
      type: String,
      required: true,
    },
    priceInGramsInUSD: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (value) {
          return Number(value.toFixed(5)) === value && value >= 0;
        },
        message: "priceInGramsInUSD must have no more than 5 decimal places",
      },
    },
  },
  { timestamps: true }
);

const Material = mongoose.model("Material", materialSchema);

export default Material;
