import Sale from "../models/sale.model.js";
import { errorHandler } from "../utils/error.js";

export const createSale = async (req, res) => {
  try {
    const sale = new Sale(req.body);
    const savedSale = await sale.save();
    res.status(201).json(savedSale);
  } catch (error) {
    console.error("Error saving sale:", error.message);
    res
      .status(500)
      .json({ message: "Failed to save sale", error: error.message });
  }
};

export const deleteSale = async (req, res, next) => {
  const existingSale = await Sale.findById(req.params.id);

  if (!existingSale) return next(errorHandler(404, "Sale not found"));

  try {
    await Sale.findByIdAndDelete(req.params.id);
    return res.status(200).json("Sale has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (req, res, next) => {
  const sale = await Sale.findById(req.params.id);

  if (!sale) return next(errorHandler(404, "Sale not found"));

  try {
    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(updatedSale);
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
