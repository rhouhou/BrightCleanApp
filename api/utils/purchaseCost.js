import Purchase from "../models/purchase.model.js";

export const getPurchaseCostAtDate = async ({
  itemId,
  itemType,
  date,
}) => {
  if (!itemId || !date) {
    return null;
  }

  const asOfDate = new Date(date);

  if (Number.isNaN(asOfDate.getTime())) {
    return null;
  }

  asOfDate.setUTCHours(23, 59, 59, 999);

  const query = {
    itemId,
    purchaseDate: {
      $lte: asOfDate,
    },
  };

  if (itemType) {
    query.itemType = itemType;
  }

  const purchase = await Purchase.findOne(query).sort({
    purchaseDate: -1,
    createdAt: -1,
  });

  if (!purchase) {
    return null;
  }

  return {
    unitCostUSD: purchase.unitCostUSD,
    purchaseDate: purchase.purchaseDate,
    purchaseId: purchase._id,
    itemId: purchase.itemId,
    itemName: purchase.itemName,
    itemType: purchase.itemType,
    unit: purchase.unit,
    quantity: purchase.quantity,
    totalPriceUSD: purchase.totalPriceUSD,
  };
};

// Recipes currently store raw-material quantities in grams.
// Therefore material purchases must be converted to $ / gram.
export const getMaterialCostPerGramAtDate = async ({
  materialId,
  date,
}) => {
  const purchase = await getPurchaseCostAtDate({
    itemId: materialId,
    itemType: "material",
    date,
  });

  if (!purchase) {
    return null;
  }

  let costPerGramUSD;

  switch (purchase.unit) {
    case "gram":
      costPerGramUSD = purchase.unitCostUSD;
      break;

    case "kg":
      costPerGramUSD = purchase.unitCostUSD / 1000;
      break;

    default:
      throw new Error(
        `Material ${materialId} uses unit "${purchase.unit}". ` +
        `Recipes currently require material purchases in gram or kg.`
      );
  }

  return {
    ...purchase,
    costPerGramUSD,
  };
};