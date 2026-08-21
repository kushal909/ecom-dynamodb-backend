import express from "express";

import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
} from "../controllers/reviewController.js";

import {
  authenticate
} from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// GET ALL REVIEWS FOR A PRODUCT
// Public API
// =====================================================

router.get(
  "/products/:productId/reviews",
  getProductReviews
);


// =====================================================
// CREATE REVIEW + RATING
// Login required
// =====================================================

router.post(
  "/products/:productId/reviews",
  authenticate,
  createReview
);


// =====================================================
// UPDATE REVIEW
// Login required
// =====================================================

router.put(
  "/products/:productId/reviews/:reviewId",
  authenticate,
  updateReview
);


// =====================================================
// DELETE REVIEW
// Login required
// =====================================================

router.delete(
  "/products/:productId/reviews/:reviewId",
  authenticate,
  deleteReview
);


export default router;