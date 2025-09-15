/**
 * AWS S3 Client Configuration
 * 
 * This module sets up and exports an S3 client instance using the AWS SDK.
 * Ensure that the following environment variables are set in your .env file:
 * - AWS_REGION: The AWS region where your S3 bucket is located.
 * - AWS_ACCESS_KEY_ID: Your AWS access key ID.
 * - AWS_SECRET_ACCESS_KEY: Your AWS secret access key.
 * 
 * Usage:
 * const s3 = require('./path/to/this/file');
 * 
 * Example:
 * const { ListBucketsCommand } = require("@aws-sdk/client-s3");
 * const data = await s3.send(new ListBucketsCommand({}));
 * console.log(data);
 */
// backend/config/aws.js
// backend/config/aws.js

const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3;
