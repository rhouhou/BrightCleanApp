import InventoryMovement from "../models/inventoryMovement.model.js";

import {
  getCurrentStock,
  recordInventoryMovement,
} from "../utils/inventory.js";

export const createInventoryMovement =
  async (req, res) => {
    try {
      const result =
        await recordInventoryMovement({
          ...req.body,
          createdBy: req.user?.id,
        });

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
  };

export const getInventoryMovements =
  async (req, res) => {
    try {
      const movements =
        await InventoryMovement.find()
          .sort({
            movementDate: -1,
            createdAt: -1,
          })
          .limit(500);

      return res.status(200).json(
        movements
      );
    } catch (error) {
      return res.status(500).json({
        message:
          "Failed to load inventory movements",
        error: error.message,
      });
    }
  };

export const getInventoryStock =
  async (req, res) => {
    try {
      const stock =
        await InventoryMovement.aggregate([
          {
            $group: {
              _id: {
                itemType: "$itemType",
                itemId: "$itemId",
                itemName: "$itemName",
                unit: "$unit",
              },

              quantity: {
                $sum: "$quantityChange",
              },
            },
          },

          {
            $project: {
              _id: 0,

              itemType:
                "$_id.itemType",

              itemId:
                "$_id.itemId",

              itemName:
                "$_id.itemName",

              unit:
                "$_id.unit",

              quantity: 1,
            },
          },

          {
            $sort: {
              itemType: 1,
              itemName: 1,
            },
          },
        ]);

      return res.status(200).json(stock);
    } catch (error) {
      return res.status(500).json({
        message:
          "Failed to load inventory",
        error: error.message,
      });
    }
  };

export const getItemStock =
  async (req, res) => {
    try {
      const {
        itemType,
        itemId,
      } = req.query;

      if (!itemType || !itemId) {
        return res.status(400).json({
          message:
            "itemType and itemId are required",
        });
      }

      const quantity =
        await getCurrentStock({
          itemType,
          itemId,
        });

      return res.status(200).json({
        itemType,
        itemId,
        quantity,
      });
    } catch (error) {
      return res.status(500).json({
        message:
          "Failed to load item stock",
        error: error.message,
      });
    }
  };