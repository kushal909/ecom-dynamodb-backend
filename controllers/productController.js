// import {
//   PutCommand,
//   GetCommand,
//   ScanCommand,
//   UpdateCommand,
//   DeleteCommand
// } from "@aws-sdk/lib-dynamodb";
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { db,
  // s3,
   TABLES } from "../config/aws.js";
   import {
   s3,
   } from "../config/s3.js";
   import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { generateId } from "../utils/helpers.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
// import { generateId } from "../utils/generateId.js";


export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description = "",
      price,
      categoryId = null,
      brand = "",
      stock,
      discount = 0,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and stock are required",
      });
    }

    // Generate product ID
    const productId = generateId("PROD");

    // Upload images to S3
    let images = [];

  


if (req.files && req.files.length > 0) {
  images = await Promise.all(
    req.files.map((file) =>
      uploadToS3(file, productId)
    )
  );
}
    // Create DynamoDB product
   const product = {
  productId,
  name,
  description,
  price: Number(price),
  categoryId,
  brand,
  stock: Number(stock),
  images,
  discount: Number(discount),
  // Initialize counters
  likeCount: 0,
  commentCount: 0,
  rating: 0,
  reviewCount: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
    // Save product in DynamoDB


    let result =await db.send(
      new PutCommand({
        TableName: TABLES.PRODUCTS,
        Item: product,
      })
    );


   
    return res.status(201).json({
      success: true,

      message: "Product created successfully",

      product,
    });

  } catch (error) {


    return res.status(500).json({
      success: false,

      message: "Failed to create product",

      error: error.message,
    });
  }
};
// GET PRODUCTS
export const getProducts = async (req, res) => {

  try {

    const {
      search,
      categoryId
    } = req.query;

    const result = await db.send(
      new ScanCommand({

        TableName: TABLES.PRODUCTS

      })
    );

    let products = result.Items || [];

    if (search) {

      products = products.filter(
        product =>
          String(product.name)
            .toLowerCase()
            .includes(
              String(search).toLowerCase()
            )
      );

    }

    if (categoryId) {

      products = products.filter(
        product =>
          product.categoryId === categoryId
      );

    }

    return res.json({

      success: true,

      count: products.length,

      products

    });

  } catch (error) {

 

    return res.status(500).json({

      success: false,

      message: "Failed to get products",

      error: error.message

    });

  }

};


// GET PRODUCT BY ID

// GET COMPLETE PRODUCT DETAILS
export const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    // =====================================================
    // 1. GET MAIN PRODUCT
    // =====================================================

    const productResult = await db.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId: productId
        }
      })
    );

    if (!productResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = productResult.Item;

    // =====================================================
    // 2. GET ALL PRODUCT RELATED DATA IN PARALLEL
    // =====================================================

    const [
      commentsResult,
      reviewsResult,
      inventoryResult
    ] = await Promise.all([

      // -------------------------------------------------
      // COMMENTS
      // productId = HASH KEY
      // commentId = RANGE KEY
      // -------------------------------------------------

      db.send(
        new QueryCommand({
          TableName: TABLES.COMMENTS,

          KeyConditionExpression:
            "productId = :productId",

          ExpressionAttributeValues: {
            ":productId": productId
          }
        })
      ),

      // -------------------------------------------------
      // REVIEWS
      // productId = HASH KEY
      // reviewId = RANGE KEY
      // -------------------------------------------------

      db.send(
        new QueryCommand({
          TableName: TABLES.REVIEWS,

          KeyConditionExpression:
            "productId = :productId",

          ExpressionAttributeValues: {
            ":productId": productId
          }
        })
      ),

      // -------------------------------------------------
      // INVENTORY
      // productId = HASH KEY
      // -------------------------------------------------

      db.send(
        new GetCommand({
          TableName: TABLES.INVENTORY,

          Key: {
            productId: productId
          }
        })
      )
    ]);

    // =====================================================
    // 3. EXTRACT RESULTS
    // =====================================================

    const comments = commentsResult.Items || [];

    const reviews = reviewsResult.Items || [];

    const inventory = inventoryResult.Item || null;

    // =====================================================
    // 4. RETURN EVERYTHING
    // =====================================================

    return res.status(200).json({
      success: true,

      product: {
        ...product,

        comments,

        reviews,

        inventory
      }
    });

  } catch (error) {



    return res.status(500).json({
      success: false,
      message: "Failed to get product details",
      error: error.message
    });
  }
};

// UPDATE PRODUCT
// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const {
      name,
      description = "",
      price,
      categoryId = null,
      brand = "",
      stock,
      discount = 0,
    } = req.body;

    // -----------------------------
    // 1. Validate required fields
    // -----------------------------
    if (
      !name ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and stock are required",
      });
    }

    // -----------------------------
    // 2. Get existing product
    // -----------------------------
    const existingResult = await db.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,
        Key: {
          productId,
        },
      })
    );

    if (!existingResult.Item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingProduct = existingResult.Item;

    // -----------------------------
    // 3. Handle images
    // -----------------------------
    let images = existingProduct.images || [];

    // If new images are uploaded
    if (req.files && req.files.length > 0) {

      // Upload new images
      const newImages = await Promise.all(
        req.files.map((file) =>
          uploadToS3(file, productId)
        )
      );

      // Delete old images from S3
      const oldObjects = images
        .filter((image) => image.key)
        .map((image) => ({
          Key: image.key,
        }));

      if (oldObjects.length > 0) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Delete: {
              Objects: oldObjects,
            },
          })
        );
      }

      // Replace old images with new images
      images = newImages;
    }

    // -----------------------------
    // 4. Update DynamoDB
    // -----------------------------
    const result = await db.send(
      new UpdateCommand({
        TableName: TABLES.PRODUCTS,

        Key: {
          productId,
        },

        UpdateExpression: `
          SET
            #name = :name,
            description = :description,
            price = :price,
            categoryId = :categoryId,
            brand = :brand,
            stock = :stock,
            discount = :discount,
            images = :images,
            updatedAt = :updatedAt
        `,

        ExpressionAttributeNames: {
          "#name": "name",
        },

        ExpressionAttributeValues: {
          ":name": name,
          ":description": description,
          ":price": Number(price),
          ":categoryId": categoryId,
          ":brand": brand,
          ":stock": Number(stock),
          ":discount": Number(discount),
          ":images": images,
          ":updatedAt": new Date().toISOString(),
        },

        ReturnValues: "ALL_NEW",
      })
    );

    // -----------------------------
    // 5. Response
    // -----------------------------
    return res.json({
      success: true,
      message: "Product updated successfully",
      product: result.Attributes,
    });

  } catch (error) {


    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};


// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Get product first
    const result = await db.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,
        Key: {
          productId
        }
      })
    );

    // Product doesn't exist
    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const product = result.Item;

    // 2. Get images from product
    const images = product.images || [];

    // 3. Prepare S3 objects for deletion
    const objects = images
      .filter((image) => image.key)
      .map((image) => ({
        Key: image.key
      }));

    // 4. Delete images from S3
    if (objects.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,

          Delete: {
            Objects: objects
          }
        })
      );
    }

    // 5. Delete product from DynamoDB
    await db.send(
      new DeleteCommand({
        TableName: TABLES.PRODUCTS,
        Key: {
          productId
        }
      })
    );

    return res.json({
      success: true,
      message: "Product and images deleted successfully"
    });

  } catch (error) {


    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
};