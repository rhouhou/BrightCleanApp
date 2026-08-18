import Product from "../models/product.model.js";
import Recipe from "../models/recipe.model.js";

import {
  calculateRecipeCostAtDate,
} from "./recipeCost.js";

import {
  getPurchaseCostAtDate,
} from "./purchaseCost.js";

const formatBottleSize = (size) => {
  return Number(size).toString();
};

export const calculateProductCostAtDate = async ({
  productId,
  date,
}) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // Use the final, non-archived recipe for this product
  const recipe = await Recipe.findOne({
    productId: product._id,
    isFinal: true,
    isArchived: false,
  }).sort({
    updatedAt: -1,
  });

  if (!recipe) {
    return {
      productId: product._id,
      productCode: product.productId,
      productName: product.productname,
      calculationDate: date,

      isComplete: false,

      missingCosts: [
        {
          type: "recipe",
          message: "No final recipe found for this product",
        },
      ],
    };
  }

  // -----------------------------
  // RECIPE / CONTENT COST
  // -----------------------------
  const recipeCost =
    await calculateRecipeCostAtDate({
      recipeId: recipe._id,
      date,
    });

  const bottleSizeLitres =
    parseFloat(product.bottlesize) || 0;

  const contentCostPerLitreUSD =
    recipeCost.costPerLitreUSD || 0;

  const contentCostForBottleUSD =
    contentCostPerLitreUSD *
    bottleSizeLitres;

  // -----------------------------
  // BOTTLE
  // -----------------------------

  // Default naming convention:
  // BOTTLE-3.75L
  //
  // You may override this later in Product.
  const bottleItemId =
    product.bottlePurchaseItemId ||
    `BOTTLE-${formatBottleSize(
      bottleSizeLitres
    )}L`;

  const bottleCostInfo =
    await getPurchaseCostAtDate({
      itemId: bottleItemId,
      itemType: "bottle",
      date,
    });

  const bottleCostUSD =
    bottleCostInfo?.unitCostUSD || 0;

  // -----------------------------
  // LABEL
  // -----------------------------

  // Default:
  // LABEL-HW-AMJ-001
  const labelItemId =
    product.labelPurchaseItemId ||
    `LABEL-${product.productId}`;

  const labelCostInfo =
    await getPurchaseCostAtDate({
      itemId: labelItemId,
      itemType: "label",
      date,
    });

  const labelCostUSD =
    labelCostInfo?.unitCostUSD || 0;

  // -----------------------------
  // COMPLETE COST
  // -----------------------------

  const packagedUnitCostUSD =
    contentCostForBottleUSD +
    bottleCostUSD +
    labelCostUSD;

  const missingCosts = [];

  if (!recipeCost.isComplete) {
    recipeCost.missingPurchases.forEach(
      (missing) => {
        missingCosts.push({
          type: "material",
          ...missing,
        });
      }
    );
  }

  if (!bottleCostInfo) {
    missingCosts.push({
      type: "bottle",
      itemId: bottleItemId,
      message:
        `No bottle purchase found on or before ${date}`,
    });
  }

  if (!labelCostInfo) {
    missingCosts.push({
      type: "label",
      itemId: labelItemId,
      message:
        `No label purchase found on or before ${date}`,
    });
  }

  return {
    productId: product._id,
    productCode: product.productId,
    productName: product.productname,

    calculationDate: date,

    bottleSizeLitres,

    recipeId: recipe._id,
    recipeName: recipe.name,

    // REFILL
    refillCostPerLitreUSD:
      contentCostPerLitreUSD,

    // CONTENTS OF ONE FULL BOTTLE
    contentCostForBottleUSD,

    // PACKAGING
    bottleItemId,
    bottleCostUSD,
    bottlePurchaseDate:
      bottleCostInfo?.purchaseDate || null,

    labelItemId,
    labelCostUSD,
    labelPurchaseDate:
      labelCostInfo?.purchaseDate || null,

    // COMPLETE PACKAGED PRODUCT
    packagedUnitCostUSD,

    recipeIngredients:
      recipeCost.ingredients,

    missingCosts,

    isComplete:
      missingCosts.length === 0,
  };
};