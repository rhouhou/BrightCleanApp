import Purchase from "../models/purchase.model.js";
import { getPurchaseCostAtDate } from "../utils/purchaseCost.js";
import { errorHandler } from "../utils/error.js";

export const createPurchase = async (req, res) => {
  try {
    const {
      purchaseDate,
      itemType,
      itemId,
      itemName,
      quantity,
      unit,
      totalPriceUSD,
      supplier,
      notes,
    } = req.body;

    const numericQuantity = parseFloat(quantity);
    const numericTotalPrice = parseFloat(totalPriceUSD);

    if (
      !numericQuantity ||
      numericQuantity <= 0 ||
      numericTotalPrice < 0
    ) {
      return res.status(400).json({
        message: "Quantity and total price must be valid numbers",
      });
    }

    const unitCostUSD =
      numericTotalPrice / numericQuantity;

    const purchase = new Purchase({
      purchaseDate,
      itemType,
      itemId,
      itemName,
      quantity: numericQuantity,
      unit,
      totalPriceUSD: numericTotalPrice,
      unitCostUSD,
      supplier,
      notes,
    });

    const savedPurchase = await purchase.save();

    res.status(201).json(savedPurchase);
  } catch (error) {
    console.error("Error saving purchase:", error);

    res.status(500).json({
      message: "Failed to save purchase",
      error: error.message,
    });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({
      purchaseDate: -1,
    });

    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return next(errorHandler(404, "Purchase not found"));
    }

    const quantity =
      parseFloat(req.body.quantity ?? purchase.quantity);

    const totalPriceUSD =
      parseFloat(
        req.body.totalPriceUSD ?? purchase.totalPriceUSD
      );

    const unitCostUSD =
      quantity > 0
        ? totalPriceUSD / quantity
        : 0;

    const updatedPurchase =
      await Purchase.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          quantity,
          totalPriceUSD,
          unitCostUSD,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json(updatedPurchase);
  } catch (error) {
    next(error);
  }
};

export const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(
      req.params.id
    );

    if (!purchase) {
      return next(errorHandler(404, "Purchase not found"));
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Purchase deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const getCostAtDate = async (req, res) => {
  try {
    const {
      itemId,
      itemType,
      date,
    } = req.query;

    if (!itemId || !date) {
      return res.status(400).json({
        message: "itemId and date are required",
      });
    }

    const result = await getPurchaseCostAtDate({
      itemId,
      itemType,
      date,
    });

    if (!result) {
      return res.status(404).json({
        message: `No purchase found for ${itemId} on or before ${date}`,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Error finding historical purchase cost:",
      error
    );

    return res.status(500).json({
      message: "Failed to retrieve purchase cost",
      error: error.message,
    });
  }
};