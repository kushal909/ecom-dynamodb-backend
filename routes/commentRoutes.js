import express from "express";

import {
  createComment,
  getProductComments,
  updateComment,
  deleteComment
} from "../controllers/commentController.js";

import {
  authenticate
} from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// GET PRODUCT COMMENTS
// Public
// =====================================================

router.get(
  "/products/:productId/comments",
  getProductComments
);


// =====================================================
// CREATE COMMENT
// Login required
// =====================================================

router.post(
  "/products/:productId/comments",
  authenticate,
  createComment
);


// =====================================================
// UPDATE COMMENT
// Login required
// =====================================================

router.put(
  "/products/:productId/comments/:commentId",
  authenticate,
  updateComment
);


// =====================================================
// DELETE COMMENT
// Login required
// =====================================================

router.delete(
  "/products/:productId/comments/:commentId",
  authenticate,
  deleteComment
);


export default router;