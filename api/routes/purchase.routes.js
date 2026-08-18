import express from "express";

import {
  createPurchase,
  getPurchases,
  getCostAtDate,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchase.controller.js";

const router = express.Router();

router.get("/cost", getCostAtDate);

router.post("/", createPurchase);
router.get("/", getPurchases);
router.put("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;