import {
  PutCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";
import { generateId } from "../utils/helpers.js";


// CREATE CATEGORY
export const createCategory = async (req, res) => {

  try {

    const {
      name,
      description = ""
    } = req.body;

    if (!name) {

      return res.status(400).json({

        success: false,

        message: "Category name is required"

      });

    }

    const category = {

      categoryId: generateId("CAT"),

      name,

      description,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()

    };

    await db.send(
      new PutCommand({

        TableName: TABLES.CATEGORIES,

        Item: category

      })
    );

    return res.status(201).json({

      success: true,

      message: "Category created successfully",

      category

    });

  } catch (error) {

    console.error("CREATE CATEGORY ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Failed to create category",

      error: error.message

    });

  }

};


// GET CATEGORIES
export const getCategories = async (req, res) => {

  try {

    const result = await db.send(
      new ScanCommand({

        TableName: TABLES.CATEGORIES

      })
    );

    return res.json({

      success: true,

      count: result.Items?.length || 0,

      categories: result.Items || []

    });

  } catch (error) {

    console.error("GET CATEGORIES ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Failed to get categories",

      error: error.message

    });

  }

};