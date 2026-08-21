import express from "express";

import {
  createCategory,
  getCategories
} from "../controllers/categoryController.js";

import {
  authenticate,
  adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  adminOnly,
  createCategory
);

router.get(
  "/",
  getCategories
);

export default router;