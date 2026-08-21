import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import crypto from "crypto";

export const uploadToS3 = async (file, productId) => {
  const extension = file.originalname.split(".").pop();

  const fileName = `${crypto.randomUUID()}.${extension}`;

  const key = `products/${productId}/${fileName}`;

await s3.send(
  new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: "*",
    ContentDisposition: "inline",
  })
);

  const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
};