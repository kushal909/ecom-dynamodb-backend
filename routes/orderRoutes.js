import express from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

import {
  authenticate,
  adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  createOrder
);

router.get(
  "/",
  authenticate,
  getMyOrders
);

router.get(
  "/admin/all",
  authenticate,
  adminOnly,
  getAllOrders
);

router.get(
  "/:id",
  authenticate,
  getOrderById
);

router.put(
  "/admin/:id/status",
  authenticate,
  adminOnly,
  updateOrderStatus
);

export default router;