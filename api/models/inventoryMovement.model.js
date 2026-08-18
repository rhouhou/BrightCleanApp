import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    movementDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    itemType: {
      type: String,
      enum: [
        "empty_bottle",
        "finished_product",
        "bulk_product",
      ],
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

    unit: {
      type: String,
      enum: ["unit", "litre"],
      required: true,
    },

    // Positive = stock enters
    // Negative = stock leaves
    quantityChange: {
      type: Number,
      required: true,
    },

    movementType: {
      type: String,
      enum: [
        "opening_stock",
        "purchase",
        "production_in",
        "production_out",
        "sale",
        "refill",
        "return",
        "sample",
        "waste",
        "adjustment",
      ],
      required: true,
    },

    sourceType: {
      type: String,
      enum: [
        "manual",
        "purchase",
        "order",
        "production",
      ],
      default: "manual",
    },

    sourceId: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const InventoryMovement = mongoose.model(
  "InventoryMovement",
  inventoryMovementSchema
);

export default InventoryMovement;