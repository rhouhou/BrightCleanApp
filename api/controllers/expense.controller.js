import Expense from "../models/expense.model.js";
import { errorHandler } from "../utils/error.js";

export const createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Error saving expense:", error);
    res.status(500).json({ error: "Failed to save expense" });
  }
};

export const deleteExpense = async (req, res, next) => {
  const existingExpense = await Expense.findById(req.params.id);

  if (!existingExpense) return next(errorHandler(404, "Expense not found"));

  try {
    await Expense.findByIdAndDelete(req.params.id);
    return res.status(200).json("Expense has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) return next(errorHandler(404, "Expense not found"));

  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json(updatedExpense);
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
