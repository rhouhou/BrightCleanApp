import Sale from "../models/sale.model.js";
import Product from "../models/product.model.js";
import { errorHandler } from "../utils/error.js";
import {
  calculateProductCostAtDate,
} from "../utils/productCost.js";

const buildSaleCostSnapshot = async ({
  product,
  priceTier,
  dateOfPurchase,
  quantity,
}) => {
  const productCost =
    await calculateProductCostAtDate({
      productId: product._id,
      date: dateOfPurchase,
    });

  const recipeMissing =
    productCost.missingCosts?.filter(
      (item) => item.type === "material" || item.type === "recipe"
    ) || [];

  // Every sale needs the recipe/material cost.
  if (recipeMissing.length > 0) {
    return {
      error: true,
      message:
        "Product cost cannot be calculated because recipe/material purchase information is missing.",
      missingCosts: recipeMissing,
    };
  }

  const numericQuantity =
    parseFloat(quantity) || 0;

  // ---------------------------------
  // RETAIL WITH BOTTLE
  // quantity = number of bottles
  // ---------------------------------
  if (priceTier === "retail_with_bottle") {
    const packagingMissing =
      productCost.missingCosts?.filter(
        (item) =>
          item.type === "bottle" ||
          item.type === "label"
      ) || [];

    if (packagingMissing.length > 0) {
      return {
        error: true,
        message:
          "Packaged product cost cannot be calculated because bottle or label purchase information is missing.",
        missingCosts: packagingMissing,
      };
    }

    return {
      error: false,

      costBasis: "packaged_unit",

      unitCostAtSaleUSD:
        productCost.packagedUnitCostUSD,

      totalCostAtSaleUSD:
        productCost.packagedUnitCostUSD *
        numericQuantity,

      contentCostAtSaleUSD:
        productCost.contentCostForBottleUSD,

      bottleCostAtSaleUSD:
        productCost.bottleCostUSD,

      labelCostAtSaleUSD:
        productCost.labelCostUSD,
    };
  }

  // ---------------------------------
  // RETAIL WITHOUT BOTTLE
  // quantity = number of bottle-size
  // refill quantities, e.g. 3.75 L
  // ---------------------------------
  if (priceTier === "retail_without_bottle") {
    return {
      error: false,

      costBasis: "refill_bottle_volume",

      unitCostAtSaleUSD:
        productCost.contentCostForBottleUSD,

      totalCostAtSaleUSD:
        productCost.contentCostForBottleUSD *
        numericQuantity,

      contentCostAtSaleUSD:
        productCost.contentCostForBottleUSD,

      bottleCostAtSaleUSD: 0,
      labelCostAtSaleUSD: 0,
    };
  }

  // ---------------------------------
  // WHOLESALE
  // quantity = litres
  // ---------------------------------
  if (
    priceTier === "wholesale_schools" ||
    priceTier === "wholesale_restaurants"
  ) {
    return {
      error: false,

      costBasis: "refill_per_litre",

      unitCostAtSaleUSD:
        productCost.refillCostPerLitreUSD,

      totalCostAtSaleUSD:
        productCost.refillCostPerLitreUSD *
        numericQuantity,

      contentCostAtSaleUSD:
        productCost.refillCostPerLitreUSD,

      bottleCostAtSaleUSD: 0,
      labelCostAtSaleUSD: 0,
    };
  }

  return {
    error: true,
    message: `Unsupported price tier: ${priceTier}`,
  };
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

    const product = await Product.findOne({
      productname,
    });

    if (!product) {
      return res.status(404).json({
        message: `Product "${productname}" was not found`,
      });
    }

    const numericQuantity =
      parseFloat(quantity) || 0;

    if (numericQuantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero",
      });
    }

    const costSnapshot =
      await buildSaleCostSnapshot({
        product,
        priceTier,
        dateOfPurchase,
        quantity: numericQuantity,
      });

    if (costSnapshot.error) {
      return res.status(400).json({
        message: costSnapshot.message,
        missingCosts:
          costSnapshot.missingCosts || [],
      });
    }

    const sale = new Sale({
      transactions,
      dateOfPurchase,
      businessType,
      priceTier,

      productId: product._id,
      productCode: product.productId,
      productname: product.productname,

      quantity: numericQuantity,

      unitprice,
      totalamount,
      exchangeRate,

      unitCostAtSaleUSD:
        costSnapshot.unitCostAtSaleUSD,

      totalCostAtSaleUSD:
        costSnapshot.totalCostAtSaleUSD,

      costBasis:
        costSnapshot.costBasis,

      contentCostAtSaleUSD:
        costSnapshot.contentCostAtSaleUSD,

      bottleCostAtSaleUSD:
        costSnapshot.bottleCostAtSaleUSD,

      labelCostAtSaleUSD:
        costSnapshot.labelCostAtSaleUSD,
    });

    const savedSale = await sale.save();

    return res.status(201).json(savedSale);
  } catch (error) {
    console.error(
      "Error saving sale:",
      error
    );

    return res.status(500).json({
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

export const updateSale = async (
  req,
  res,
  next
) => {
  try {
    const existingSale =
      await Sale.findById(req.params.id);

    if (!existingSale) {
      return next(
        errorHandler(404, "Sale not found")
      );
    }

    const productname =
      req.body.productname ||
      existingSale.productname;

    const product = await Product.findOne({
      productname,
    });

    if (!product) {
      return next(
        errorHandler(404, "Product not found")
      );
    }

    const dateOfPurchase =
      req.body.dateOfPurchase ||
      existingSale.dateOfPurchase;

    const priceTier =
      req.body.priceTier ||
      existingSale.priceTier;

    const quantity =
      parseFloat(
        req.body.quantity ??
          existingSale.quantity
      ) || 0;

    const costSnapshot =
      await buildSaleCostSnapshot({
        product,
        priceTier,
        dateOfPurchase,
        quantity,
      });

    if (costSnapshot.error) {
      return res.status(400).json({
        message: costSnapshot.message,
        missingCosts:
          costSnapshot.missingCosts || [],
      });
    }

    const updateData = {
      ...req.body,

      productId: product._id,
      productCode: product.productId,
      productname: product.productname,

      quantity,

      unitCostAtSaleUSD:
        costSnapshot.unitCostAtSaleUSD,

      totalCostAtSaleUSD:
        costSnapshot.totalCostAtSaleUSD,

      costBasis:
        costSnapshot.costBasis,

      contentCostAtSaleUSD:
        costSnapshot.contentCostAtSaleUSD,

      bottleCostAtSaleUSD:
        costSnapshot.bottleCostAtSaleUSD,

      labelCostAtSaleUSD:
        costSnapshot.labelCostAtSaleUSD,
    };

    const updatedSale =
      await Sale.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json(
      updatedSale
    );
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