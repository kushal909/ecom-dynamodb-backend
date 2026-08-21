import express from "express";

import {
  addToCart,
  getCart,
  removeFromCart
} from "../controllers/cartController.js";

import {
  authenticate
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  addToCart
);

router.get(
  "/",
  authenticate,
  getCart
);

router.delete(
  "/:productId",
  authenticate,
  removeFromCart
);

export default router;