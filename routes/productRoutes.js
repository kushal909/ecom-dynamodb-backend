import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { upload } from "../middleware/upload.js";
import {
  authenticate,
  adminOnly
} from "../middleware/authMiddleware.js";

const router = express.Router();

// router.post(
//   "/",
//   authenticate,
//   adminOnly,
//   createProduct
// );
router.post(
  "/",
  authenticate,
  adminOnly,
  upload.array("images", 5),
  createProduct
);

router.get(
  "/",
  getProducts
);

router.get(
  "/:id",
  getProductById
);

router.put(
  "/:id",
  authenticate,
  adminOnly,
  updateProduct
);

router.delete(
  "/:id",
  // authenticate,
  // adminOnly,
  deleteProduct
);

export default router;