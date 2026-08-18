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

  // Include the whole selected day
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
  };
};