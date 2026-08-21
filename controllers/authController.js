import bcrypt from "bcryptjs";

import {
  PutCommand,
  GetCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

import { db, TABLES } from "../config/aws.js";
import { generateId } from "../utils/helpers.js";
import { generateToken } from "../utils/jwt.js";


// REGISTER
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,role
    } = req.body;
   
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });

    }


  
    const existing = await db.send(
      new ScanCommand({
        TableName: TABLES.USERS,

        FilterExpression: "email = :email",

        ExpressionAttributeValues: {
          ":email": email
        }
      })
    );
    if (existing.Items?.length) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });

    }
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    const user = {

      id: generateId("USER"),

      name,

      email,

      password: hashedPassword,

      role,

      addresses: [],

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()

    };
   
    await db.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user
      })
    );

    const token = generateToken(user);

    return res.status(201).json({

      success: true,

      message: "User registered successfully",

      token,

      user: {

        userId: user.id,

        name: user.name,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {


    return res.status(500).json({

      success: false,

      message: "Failed to create user",

      error: error.message

    });

  }

};


// LOGIN
export const login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"

      });

    }

    const result = await db.send(
      new ScanCommand({

        TableName: TABLES.USERS,

        FilterExpression: "email = :email",

        ExpressionAttributeValues: {

          ":email": email

        }

      })
    );
   
    const user = result.Items?.[0];


    if (!user) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password"

      });

    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {

      return res.status(401).json({

        success: false,

        message: "Invalid email or password"

      });

    }

    const token = generateToken(user);
    console.log("user",user)

    return res.json({

      success: true,

      message: "Login successful",

      token,

      user: {

        userId: user.id,

        name: user.name,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {



    return res.status(500).json({

      success: false,

      message: "Login failed",

      error: error.message

    });

  }

};


// CURRENT USER
export const getMe = async (req, res) => {

  try {

    const result = await db.send(
      new GetCommand({

        TableName: TABLES.USERS,
        Key: {
          id: req.user.id

        }

      })
    );

    if (!result.Item) {

      return res.status(404).json({

        success: false,

        message: "User not found"

      });

    }

    const {
      password,
      ...user
    } = result.Item;

    return res.json({

      success: true,

      user

    });

  } catch (error) {



    return res.status(500).json({

      success: false,

      message: "Failed to get user",

      error: error.message

    });

  }

};