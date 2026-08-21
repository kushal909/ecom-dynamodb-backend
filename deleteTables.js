import dotenv from "dotenv";

import {
  DynamoDBClient,
  DeleteTableCommand
} from "@aws-sdk/client-dynamodb";

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tableNames = [
  "Users",
  "Products",
  "Categories",
  "Comments",
  "Likes",
  "Carts",
  "Orders"
];

const deleteTables = async () => {

  for (const tableName of tableNames) {

    try {

      await client.send(
        new DeleteTableCommand({
          TableName: tableName
        })
      );

      console.log(
        `🗑️ ${tableName} deleted`
      );

    } catch (error) {

      console.error(
        `❌ Failed to delete ${tableName}:`,
        error.message
      );

    }
  }
};

deleteTables();