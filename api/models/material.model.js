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
    quantity: {
      type: Number,
      required: true,
    },
    totalpriceInUSD: {
      type: Number,
      required: true,
      min: [0, "Total price must be >= 0"],
    },
    priceInGramsInUSD: {
      type: Number,
      required: true,
      min: [0, "Price per gram must be >= 0"],
      validate: {
        validator: function (value) {
          return Number(value.toFixed(5)) === value;
        },
        message: "priceInGramsInUSD must have no more than 5 decimal places",
      },
    },
  },
  { timestamps: true }
);

materialSchema.pre("validate", function (next) {
  if (this.quantity > 0 && this.totalPriceInUSD != null) {
    // round to 5 decimal places
    const raw = this.totalPriceInUSD / this.quantity;
    this.priceInGramsInUSD = parseFloat(raw.toFixed(5));
  }
  next();
});

const Material = mongoose.model("Material", materialSchema);

export default Material;
