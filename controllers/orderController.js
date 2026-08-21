import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";
import { generateId } from "../utils/helpers.js";


// CREATE ORDER
export const createOrder = async (req, res) => {

  try {

    const {
      shippingAddress
    } = req.body;

    const cartResult = await db.send(
      new GetCommand({

        TableName: TABLES.CARTS,

        Key: {

          userId: req.user.userId

        }

      })
    );

    const cart = cartResult.Item;

    if (!cart?.items?.length) {

      return res.status(400).json({

        success: false,

        message: "Cart is empty"

      });

    }

    const order = {

      orderId: generateId("ORDER"),

      userId: req.user.userId,

      items: cart.items,

      shippingAddress:
        shippingAddress || {},

      totalAmount: cart.totalAmount,

      paymentStatus: "PENDING",

      orderStatus: "PENDING",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };

    await db.send(
      new PutCommand({

        TableName: TABLES.ORDERS,

        Item: order

      })
    );

    await db.send(
      new DeleteCommand({

        TableName: TABLES.CARTS,

        Key: {

          userId:
            req.user.userId

        }

      })
    );

    return res.status(201).json({

      success: true,

      message:
        "Order created successfully",

      order

    });

  } catch (error) {

    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message: "Failed to create order",

      error: error.message

    });

  }

};


// GET MY ORDERS
export const getMyOrders = async (req, res) => {

  try {

    const result = await db.send(
      new ScanCommand({

        TableName: TABLES.ORDERS,

        FilterExpression:
          "userId = :userId",

        ExpressionAttributeValues: {

          ":userId":
            req.user.userId

        }

      })
    );

    return res.json({

      success: true,

      count:
        result.Items?.length || 0,

      orders:
        result.Items || []

    });

  } catch (error) {

    console.error(
      "GET MY ORDERS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to get orders",

      error: error.message

    });

  }

};


// GET ORDER BY ID
export const getOrderById = async (req, res) => {

  try {

    const result = await db.send(
      new GetCommand({

        TableName: TABLES.ORDERS,

        Key: {

          orderId:
            req.params.id

        }

      })
    );

    if (!result.Item) {

      return res.status(404).json({

        success: false,

        message: "Order not found"

      });

    }

    if (

      req.user.role !== "admin" &&

      result.Item.userId !==
        req.user.userId

    ) {

      return res.status(403).json({

        success: false,

        message: "Access denied"

      });

    }

    return res.json({

      success: true,

      order: result.Item

    });

  } catch (error) {

    console.error(
      "GET ORDER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to get order",

      error: error.message

    });

  }

};


// ADMIN GET ALL ORDERS
export const getAllOrders = async (req, res) => {

  try {

    const result = await db.send(
      new ScanCommand({

        TableName:
          TABLES.ORDERS

      })
    );

    return res.json({

      success: true,

      count:
        result.Items?.length || 0,

      orders:
        result.Items || []

    });

  } catch (error) {

    console.error(
      "GET ALL ORDERS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to get orders",

      error: error.message

    });

  }

};


// ADMIN UPDATE ORDER
export const updateOrderStatus = async (
  req,
  res
) => {

  try {

    const allowedStatuses = [

      "PENDING",

      "CONFIRMED",

      "PACKED",

      "SHIPPED",

      "DELIVERED",

      "CANCELLED"

    ];

    const {
      orderStatus
    } = req.body;

    if (
      !allowedStatuses.includes(
        orderStatus
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid order status"

      });

    }

    const result = await db.send(
      new UpdateCommand({

        TableName:
          TABLES.ORDERS,

        Key: {

          orderId:
            req.params.id

        },

        UpdateExpression:
          "SET orderStatus = :status, updatedAt = :updatedAt",

        ExpressionAttributeValues: {

          ":status":
            orderStatus,

          ":updatedAt":
            new Date().toISOString()

        },

        ReturnValues:
          "ALL_NEW"

      })
    );

    return res.json({

      success: true,

      message:
        "Order status updated",

      order:
        result.Attributes

    });

  } catch (error) {

    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to update order status",

      error: error.message

    });

  }

};