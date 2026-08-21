import {
  GetCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";


// ADD TO CART
export const addToCart = async (req, res) => {

  try {

    const {
      productId,
      quantity
    } = req.body;

    const qty = Number(quantity);

    if (
      !productId ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Valid productId and positive quantity are required"

      });

    }

    const productResult = await db.send(
      new GetCommand({

        TableName: TABLES.PRODUCTS,

        Key: {

          productId

        }

      })
    );

    const product = productResult.Item;

    if (!product) {

      return res.status(404).json({

        success: false,

        message: "Product not found"

      });

    }

    if (product.stock < qty) {

      return res.status(400).json({

        success: false,

        message: "Insufficient stock"

      });

    }

    const cartResult = await db.send(
      new GetCommand({

        TableName: TABLES.CARTS,

        Key: {

          userId: req.user.userId

        }

      })
    );

    const cart = cartResult.Item || {

      userId: req.user.userId,

      items: []

    };

    const existingItem = cart.items.find(
      item =>
        item.productId === productId
    );

    if (existingItem) {

      const newQuantity =
        existingItem.quantity + qty;

      if (newQuantity > product.stock) {

        return res.status(400).json({

          success: false,

          message:
            "Requested quantity exceeds available stock"

        });

      }

      existingItem.quantity = newQuantity;

    } else {

      cart.items.push({

        productId: product.productId,

        name: product.name,

        price: product.price,

        quantity: qty,

        image: product.images?.[0] || null

      });

    }

    cart.totalAmount =
      cart.items.reduce(

        (total, item) =>
          total +
          item.price *
          item.quantity,

        0

      );

    cart.updatedAt =
      new Date().toISOString();

    await db.send(
      new PutCommand({

        TableName: TABLES.CARTS,

        Item: cart

      })
    );

    return res.json({

      success: true,

      message: "Product added to cart",

      cart

    });

  } catch (error) {

    console.error("ADD CART ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Failed to add product to cart",

      error: error.message

    });

  }

};


// GET CART
export const getCart = async (req, res) => {

  try {

    const result = await db.send(
      new GetCommand({

        TableName: TABLES.CARTS,

        Key: {

          userId: req.user.userId

        }

      })
    );

    return res.json({

      success: true,

      cart: result.Item || {

        userId: req.user.userId,

        items: [],

        totalAmount: 0

      }

    });

  } catch (error) {

    console.error("GET CART ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Failed to get cart",

      error: error.message

    });

  }

};


// REMOVE FROM CART
export const removeFromCart = async (req, res) => {

  try {

    const result = await db.send(
      new GetCommand({

        TableName: TABLES.CARTS,

        Key: {

          userId: req.user.userId

        }

      })
    );

    if (!result.Item) {

      return res.status(404).json({

        success: false,

        message: "Cart not found"

      });

    }

    const cart = result.Item;

    cart.items = cart.items.filter(

      item =>
        item.productId !==
        req.params.productId

    );

    cart.totalAmount =
      cart.items.reduce(

        (total, item) =>
          total +
          item.price *
          item.quantity,

        0

      );

    cart.updatedAt =
      new Date().toISOString();

    await db.send(
      new PutCommand({

        TableName: TABLES.CARTS,

        Item: cart

      })
    );

    return res.json({

      success: true,

      message: "Product removed from cart",

      cart

    });

  } catch (error) {

    console.error(
      "REMOVE CART ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message: "Failed to remove cart item",

      error: error.message

    });

  }

};