import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

console.log("AWS REGION:", process.env.AWS_REGION);
console.log("AWS ACCESS KEY:", process.env.AWS_ACCESS_KEY_ID);
console.log(
  "AWS SECRET EXISTS:",
  !!process.env.AWS_SECRET_ACCESS_KEY
);
const client = new DynamoDBClient({
  region: process.env.AWS_REGION
});
console.log("AWS REGION:", process.env.AWS_REGION);
console.log("AWS ACCESS KEY:", process.env.AWS_ACCESS_KEY_ID);
console.log(
  "AWS SECRET EXISTS:",
  !!process.env.AWS_SECRET_ACCESS_KEY
);
export const db = DynamoDBDocumentClient.from(client);

export const TABLES = {
  USERS: "Users",
  PRODUCTS: "Products",
  CATEGORIES: "Categories",
  CARTS: "Carts",
  ORDERS: "Orders"
};