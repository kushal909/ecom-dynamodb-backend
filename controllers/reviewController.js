import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";
import { generateId } from "../utils/helpers.js";


// =====================================================
// CREATE REVIEW + RATING
// POST /api/products/:productId/reviews
// =====================================================

export const createReview = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Assuming authMiddleware adds req.user
    const userId = req.user.id;

    const { rating, comment } = req.body;

    // -------------------------------------------------
    // 1. VALIDATE RATING
    // -------------------------------------------------

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
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
    // 3. CHECK WHETHER USER ALREADY REVIEWED
    // -------------------------------------------------

    const existingReviews = await db.send(
      new QueryCommand({
        TableName: TABLES.REVIEWS,

        KeyConditionExpression:
          "productId = :productId",

        FilterExpression:
          "userId = :userId",

        ExpressionAttributeValues: {
          ":productId": productId,
          ":userId": userId
        }
      })
    );

    if (existingReviews.Items?.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    // -------------------------------------------------
    // 4. CREATE REVIEW
    // -------------------------------------------------

    const reviewId = generateId();

    const review = {
      productId,
      reviewId,
      userId,
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date().toISOString()
    };

    await db.send(
      new PutCommand({
        TableName: TABLES.REVIEWS,

        Item: review
      })
    );

    // -------------------------------------------------
    // 5. UPDATE PRODUCT RATING
    // -------------------------------------------------

    const currentAverage =
      productResult.Item.averageRating || 0;

    const currentTotal =
      productResult.Item.totalRatings || 0;

    const newTotal = currentTotal + 1;

    const newAverage =
      (
        currentAverage * currentTotal +
        Number(rating)
      ) / newTotal;

    await db.send(
      new UpdateCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId
        },

        UpdateExpression:
          "SET averageRating = :averageRating, totalRatings = :totalRatings",

        ExpressionAttributeValues: {
          ":averageRating":
            Number(newAverage.toFixed(2)),

          ":totalRatings":
            newTotal
        }
      })
    );

    // -------------------------------------------------
    // 6. RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Review added successfully",

      review,

      ratingSummary: {
        averageRating:
          Number(newAverage.toFixed(2)),

        totalRatings:
          newTotal
      }
    });

  } catch (error) {

    console.error(
      "CREATE REVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message
    });
  }
};


// =====================================================
// GET PRODUCT REVIEWS
// GET /api/products/:productId/reviews
// =====================================================

export const getProductReviews = async (req, res) => {
  try {

    const productId = req.params.productId;

    const result = await db.send(
      new QueryCommand({
        TableName: TABLES.REVIEWS,

        KeyConditionExpression:
          "productId = :productId",

        ExpressionAttributeValues: {
          ":productId": productId
        }
      })
    );

    return res.status(200).json({
      success: true,

      count: result.Items?.length || 0,

      reviews: result.Items || []
    });

  } catch (error) {

    console.error(
      "GET REVIEWS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get reviews",
      error: error.message
    });
  }
};


// =====================================================
// UPDATE REVIEW
// PUT /api/reviews/:reviewId
// =====================================================

export const updateReview = async (req, res) => {
  try {

    const reviewId = req.params.reviewId;

    const userId = req.user.id;

    const {
      rating,
      comment
    } = req.body;

    // -------------------------------------------------
    // 1. VALIDATE
    // -------------------------------------------------

    if (
      rating !== undefined &&
      (rating < 1 || rating > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // -------------------------------------------------
    // 2. FIND REVIEW
    // -------------------------------------------------

    // Because your primary key is:
    //
    // productId = HASH
    // reviewId  = RANGE
    //
    // We cannot GetCommand using only reviewId.
    //
    // We therefore need productId from request.
    // Recommended URL:
    //
    // PUT /products/:productId/reviews/:reviewId

    const productId = req.params.productId;

    const reviewResult = await db.send(
      new GetCommand({
        TableName: TABLES.REVIEWS,

        Key: {
          productId,
          reviewId
        }
      })
    );

    if (!reviewResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const review = reviewResult.Item;

    // -------------------------------------------------
    // 3. CHECK OWNER
    // -------------------------------------------------

    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review"
      });
    }

    // -------------------------------------------------
    // 4. UPDATE REVIEW
    // -------------------------------------------------

    const oldRating = Number(review.rating);

    const newRating =
      rating !== undefined
        ? Number(rating)
        : oldRating;

    await db.send(
      new UpdateCommand({
        TableName: TABLES.REVIEWS,

        Key: {
          productId,
          reviewId
        },

        UpdateExpression:
          "SET rating = :rating, #comment = :comment, updatedAt = :updatedAt",

        ExpressionAttributeNames: {
          "#comment": "comment"
        },

        ExpressionAttributeValues: {
          ":rating": newRating,
          ":comment":
            comment !== undefined
              ? comment
              : review.comment || "",
          ":updatedAt":
            new Date().toISOString()
        }
      })
    );

    // -------------------------------------------------
    // 5. UPDATE PRODUCT AVERAGE
    // -------------------------------------------------

    if (newRating !== oldRating) {

      const productResult = await db.send(
        new GetCommand({
          TableName: TABLES.PRODUCTS,

          Key: {
            productId
          }
        })
      );

      const product = productResult.Item;

      const totalRatings =
        product.totalRatings || 0;

      const currentAverage =
        product.averageRating || 0;

      const newAverage =
        (
          currentAverage * totalRatings -
          oldRating +
          newRating
        ) / totalRatings;

      await db.send(
        new UpdateCommand({
          TableName: TABLES.PRODUCTS,

          Key: {
            productId
          },

          UpdateExpression:
            "SET averageRating = :averageRating",

          ExpressionAttributeValues: {
            ":averageRating":
              Number(newAverage.toFixed(2))
          }
        })
      );
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully"
    });

  } catch (error) {

    console.error(
      "UPDATE REVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message
    });
  }
};


// =====================================================
// DELETE REVIEW
// DELETE /api/products/:productId/reviews/:reviewId
// =====================================================

export const deleteReview = async (req, res) => {
  try {

    const {
      productId,
      reviewId
    } = req.params;

    const userId = req.user.id;

    // -------------------------------------------------
    // 1. GET REVIEW
    // -------------------------------------------------

    const reviewResult = await db.send(
      new GetCommand({
        TableName: TABLES.REVIEWS,

        Key: {
          productId,
          reviewId
        }
      })
    );

    if (!reviewResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const review = reviewResult.Item;

    // -------------------------------------------------
    // 2. CHECK OWNER
    // -------------------------------------------------

    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review"
      });
    }

    // -------------------------------------------------
    // 3. DELETE REVIEW
    // -------------------------------------------------

    await db.send(
      new DeleteCommand({
        TableName: TABLES.REVIEWS,

        Key: {
          productId,
          reviewId
        }
      })
    );

    // -------------------------------------------------
    // 4. UPDATE PRODUCT RATING
    // -------------------------------------------------

    const productResult = await db.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId
        }
      })
    );

    const product = productResult.Item;

    const oldTotal =
      product.totalRatings || 0;

    const oldAverage =
      product.averageRating || 0;

    const newTotal =
      Math.max(oldTotal - 1, 0);

    let newAverage = 0;

    if (newTotal > 0) {
      newAverage =
        (
          oldAverage * oldTotal -
          Number(review.rating)
        ) / newTotal;
    }

    await db.send(
      new UpdateCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId
        },

        UpdateExpression:
          "SET averageRating = :averageRating, totalRatings = :totalRatings",

        ExpressionAttributeValues: {
          ":averageRating":
            Number(newAverage.toFixed(2)),

          ":totalRatings":
            newTotal
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",

      ratingSummary: {
        averageRating:
          Number(newAverage.toFixed(2)),

        totalRatings:
          newTotal
      }
    });

  } catch (error) {

    console.error(
      "DELETE REVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message
    });
  }
};