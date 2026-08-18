import express from "express";

import {
  login,
  logout,
  me,
} from "../controllers/auth.controller.js";

import {
  verifyStaff,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", verifyStaff, me);

export default router;