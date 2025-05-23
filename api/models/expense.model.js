import { text } from "express";
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    transactionsEXP:{
      type: String,
      required: true,
      unique: true,
    },
    dateOfExpense: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    weightInGrams: {
      type: Number,
      required: true,
    },
    paidInLL: {
      type: Number,
      required: true,
    },
    exchangeRate: {
      type: Number,
      required: true,
    },
    paidInUSD: {
      type: Number,
      required: true,
    },
    unitPriceInUSD: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
