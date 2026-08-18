import Sale from "../models/sale.model.js";
import Product from "../models/product.model.js";
import { errorHandler } from "../utils/error.js";

const getCostAtSale = (product, priceTier) => {
  const bottleSize = parseFloat(product.bottlesize) || 0;
  const productCost = parseFloat(product.cost) || 0;
  const packagedCost = parseFloat(product.totalcost) || 0;

  switch (priceTier) {
    // One complete packaged bottle
    case "retail_with_bottle":
      return packagedCost;

    // One complete bottle-size quantity of product,
    // but customer does not take a new bottle
    case "retail_without_bottle":
      return productCost;

    // These prices are stored per litre
    case "wholesale_schools":
    case "wholesale_restaurants":
      return bottleSize > 0 ? productCost / bottleSize : 0;

    default:
      return 0;
  }
};

export const createSale = async (req, res) => {
  try {
    const {
      transactions,
      dateOfPurchase,
      businessType,
      priceTier,
      productname,
      quantity,
      unitprice,
      totalamount,
      exchangeRate,
    } = req.body;

    const product = await Product.findOne({ productname });

    if (!product) {
      return res.status(404).json({
        message: `Product "${productname}" was not found`,
      });
    }

    const numericQuantity = parseFloat(quantity) || 0;
    const unitCostAtSaleUSD = getCostAtSale(product, priceTier);
    const totalCostAtSaleUSD =
      numericQuantity * unitCostAtSaleUSD;

    const sale = new Sale({
      transactions,
      dateOfPurchase,
      businessType,
      priceTier,
      productname,
      quantity: numericQuantity,
      unitprice,
      totalamount,
      exchangeRate,
      unitCostAtSaleUSD,
      totalCostAtSaleUSD,
    });

    const savedSale = await sale.save();

    res.status(201).json(savedSale);
  } catch (error) {
    console.error("Error saving sale:", error.message);

    res.status(500).json({
      message: "Failed to save sale",
      error: error.message,
    });
  }
};

export const deleteSale = async (req, res, next) => {
  const existingSale = await Sale.findById(req.params.id);

  if (!existingSale) {
    return next(errorHandler(404, "Sale not found"));
  }

  try {
    await Sale.findByIdAndDelete(req.params.id);
    return res.status(200).json("Sale has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (req, res, next) => {
  const existingSale = await Sale.findById(req.params.id);

  if (!existingSale) {
    return next(errorHandler(404, "Sale not found"));
  }

  try {
    const product = await Product.findOne({
      productname: req.body.productname || existingSale.productname,
    });

    if (!product) {
      return next(errorHandler(404, "Product not found"));
    }

    const priceTier =
      req.body.priceTier || existingSale.priceTier;

    const quantity =
      parseFloat(req.body.quantity ?? existingSale.quantity) || 0;

    // If an old sale is edited, snapshot the cost again
    // using the product cost that exists at the time of editing.
    const unitCostAtSaleUSD = getCostAtSale(product, priceTier);

    const updateData = {
      ...req.body,
      unitCostAtSaleUSD,
      totalCostAtSaleUSD: quantity * unitCostAtSaleUSD,
    };

    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json(updatedSale);
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ dateOfPurchase: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};