import {
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";
import { generateId } from "../utils/helpers.js";


// =====================================================
// CREATE COMMENT
// POST /api/products/:productId/comments
// =====================================================

export const createComment = async (req, res) => {
  try {
    const productId = req.params.productId;

    // authenticate middleware should set req.user
    const userId = req.user.id;

    const { comment } = req.body;

    // -------------------------------------------------
    // 1. VALIDATE COMMENT
    // -------------------------------------------------

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required"
      });
    }

    // -------------------------------------------------
    // 2. CHECK PRODUCT EXISTS
    // -------------------------------------------------

    const productResult = await db.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId
        }
      })
    );

    if (!productResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // -------------------------------------------------
    // 3. CREATE COMMENT
    // -------------------------------------------------

    const commentId = generateId();

    const newComment = {
      productId,
      commentId,
      userId,

      comment: comment.trim(),

      createdAt: new Date().toISOString()
    };

    // -------------------------------------------------
    // 4. SAVE COMMENT
    // -------------------------------------------------

    await db.send(
      new PutCommand({
        TableName: TABLES.COMMENTS,

        Item: newComment
      })
    );

    // -------------------------------------------------
    // 5. RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });

  } catch (error) {

    console.error(
      "CREATE COMMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
      error: error.message
    });
  }
};


// =====================================================
// GET ALL COMMENTS FOR PRODUCT
// GET /api/products/:productId/comments
// =====================================================

export const getProductComments = async (req, res) => {
  try {
    const productId = req.params.productId;

    // -------------------------------------------------
    // QUERY USING PARTITION KEY
    // -------------------------------------------------

    const result = await db.send(
      new QueryCommand({
        TableName: TABLES.COMMENTS,

        KeyConditionExpression:
          "productId = :productId",

        ExpressionAttributeValues: {
          ":productId": productId
        }
      })
    );

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      count: result.Items?.length || 0,

      comments: result.Items || []
    });

  } catch (error) {

    console.error(
      "GET PRODUCT COMMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get comments",
      error: error.message
    });
  }
};


// =====================================================
// UPDATE COMMENT
// PUT /api/products/:productId/comments/:commentId
// =====================================================

export const updateComment = async (req, res) => {
  try {
    const {
      productId,
      commentId
    } = req.params;

    const userId = req.user.id;

    const { comment } = req.body;

    // -------------------------------------------------
    // 1. VALIDATE COMMENT
    // -------------------------------------------------

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required"
      });
    }

    // -------------------------------------------------
    // 2. GET EXISTING COMMENT
    // -------------------------------------------------

    const commentResult = await db.send(
      new GetCommand({
        TableName: TABLES.COMMENTS,

        Key: {
          productId,
          commentId
        }
      })
    );

    if (!commentResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const existingComment = commentResult.Item;

    // -------------------------------------------------
    // 3. CHECK COMMENT OWNER
    // -------------------------------------------------

    if (existingComment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own comment"
      });
    }

    // -------------------------------------------------
    // 4. UPDATE COMMENT
    // -------------------------------------------------

    const updatedAt = new Date().toISOString();

    await db.send(
      new UpdateCommand({
        TableName: TABLES.COMMENTS,

        Key: {
          productId,
          commentId
        },

        UpdateExpression:
          "SET #comment = :comment, updatedAt = :updatedAt",

        ExpressionAttributeNames: {
          "#comment": "comment"
        },

        ExpressionAttributeValues: {
          ":comment": comment.trim(),
          ":updatedAt": updatedAt
        }
      })
    );

    // -------------------------------------------------
    // 5. RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully"
    });

  } catch (error) {

    console.error(
      "UPDATE COMMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: error.message
    });
  }
};


// =====================================================
// DELETE COMMENT
// DELETE /api/products/:productId/comments/:commentId
// =====================================================

export const deleteComment = async (req, res) => {
  try {
    const {
      productId,
      commentId
    } = req.params;

    const userId = req.user.id;

    // -------------------------------------------------
    // 1. GET COMMENT
    // -------------------------------------------------

    const commentResult = await db.send(
      new GetCommand({
        TableName: TABLES.COMMENTS,

        Key: {
          productId,
          commentId
        }
      })
    );

    if (!commentResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const existingComment = commentResult.Item;

    // -------------------------------------------------
    // 2. CHECK COMMENT OWNER
    // -------------------------------------------------

    if (existingComment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comment"
      });
    }

    // -------------------------------------------------
    // 3. DELETE COMMENT
    // -------------------------------------------------

    await db.send(
      new DeleteCommand({
        TableName: TABLES.COMMENTS,

        Key: {
          productId,
          commentId
        }
      })
    );

    // -------------------------------------------------
    // 4. RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error) {

    console.error(
      "DELETE COMMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message
    });
  }
};