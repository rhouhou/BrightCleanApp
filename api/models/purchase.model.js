import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    purchaseDate: {
      type: Date,
      required: true,
    },

    itemType: {
      type: String,
      enum: ["material", "bottle", "label"],
      required: true,
    },

    itemId: {
      type: String,
      required: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["unit", "gram", "kg", "litre", "ml"],
      required: true,
    },

    totalPriceUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    unitCostUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    supplier: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;