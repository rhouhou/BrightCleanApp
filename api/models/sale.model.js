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
      enum: ["B2B", "B2C"],
      required: true,
    },

    priceTier: {
      type: String,
      enum: [
        "retail_with_bottle",
        "retail_without_bottle",
        "wholesale_schools",
        "wholesale_restaurants",
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
      min: 0,
    },

    // Selling price in LL for one sale unit
    unitprice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total selling amount in LL
    totalamount: {
      type: Number,
      required: true,
      min: 0,
    },

    // LL per USD at the time of the sale
    exchangeRate: {
      type: Number,
      required: true,
      min: 1,
    },

    // Snapshot of the production cost when the sale happened.
    // This must NEVER change when the Product cost changes later.
    unitCostAtSaleUSD: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCostAtSaleUSD: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const Sale = mongoose.model("Sale", saleSchema);

export default Sale;