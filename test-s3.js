const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();

const region = process.env.AWS_REGION || "us-east-2";
const bucketName = process.env.AWS_S3_BUCKET_NAME || "flybeth";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function testS3() {
  try {
    console.log("Testing S3 ListObjectsV2Command...");
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "flight-booking/",
    });
    const result = await s3Client.send(command);
    console.log("Success! Found", result.Contents ? result.Contents.length : 0, "items.");
  } catch (error) {
    console.error("S3 List failed:", error.message);
    console.error(error);
  }
}

testS3();
