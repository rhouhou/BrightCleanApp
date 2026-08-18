import express from "express";

import {
  createInventoryMovement,
  getInventoryMovements,
  getInventoryStock,
  getItemStock,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/stock", getInventoryStock);

router.get(
  "/stock/item",
  getItemStock
);

router.get(
  "/movements",
  getInventoryMovements
);

router.post(
  "/movements",
  createInventoryMovement
);

export default router;