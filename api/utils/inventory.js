import InventoryMovement from "../models/inventoryMovement.model.js";

export const getCurrentStock = async ({
  itemType,
  itemId,
}) => {
  const result =
    await InventoryMovement.aggregate([
      {
        $match: {
          itemType,
          itemId,
        },
      },
      {
        $group: {
          _id: null,
          quantity: {
            $sum: "$quantityChange",
          },
        },
      },
    ]);

  return result.length
    ? result[0].quantity
    : 0;
};

export const recordInventoryMovement =
  async ({
    movementDate,
    itemType,
    itemId,
    itemName,
    unit,
    quantityChange,
    movementType,
    sourceType = "manual",
    sourceId = "",
    notes = "",
    createdBy,
  }) => {
    const numericChange =
      Number(quantityChange);

    if (
      !Number.isFinite(numericChange) ||
      numericChange === 0
    ) {
      throw new Error(
        "quantityChange must be a non-zero number"
      );
    }

    // Unit validation
    if (
      itemType === "empty_bottle" &&
      unit !== "unit"
    ) {
      throw new Error(
        "Empty bottles must use unit"
      );
    }

    if (
      itemType === "finished_product" &&
      unit !== "unit"
    ) {
      throw new Error(
        "Finished products must use unit"
      );
    }

    if (
      itemType === "bulk_product" &&
      unit !== "litre"
    ) {
      throw new Error(
        "Bulk products must use litre"
      );
    }

    const currentStock =
      await getCurrentStock({
        itemType,
        itemId,
      });

    const newStock =
      currentStock + numericChange;

    // Do not allow stock below zero
    if (newStock < -0.000001) {
      throw new Error(
        `Not enough stock. Current: ${currentStock}, requested change: ${numericChange}`
      );
    }

    const movement =
      new InventoryMovement({
        movementDate:
          movementDate || new Date(),

        itemType,
        itemId,
        itemName,
        unit,

        quantityChange:
          numericChange,

        movementType,
        sourceType,
        sourceId,
        notes,
        createdBy,
      });

    await movement.save();

    return {
      movement,
      previousStock: currentStock,
      newStock,
    };
  };