// thanks chatgpt
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";

config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testR2Connection() {
  try {
    console.log("Testing Cloudflare R2 connection...");
    console.log("Account ID:", process.env.CLOUDFLARE_ACCOUNT_ID);
    console.log("Bucket:", process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log("Public Domain:", process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN);

    // Test 1: List buckets (should work if credentials are correct)
    console.log("\n1. Testing bucket listing...");
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResult = await s3Client.send(listBucketsCommand);
    console.log(
      "✅ Buckets listed successfully:",
      bucketsResult.Buckets?.map((b) => b.Name)
    );

    // Test 2: List objects in specific bucket
    console.log("\n2. Testing bucket access...");
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      MaxKeys: 5,
    });
    const objectsResult = await s3Client.send(listObjectsCommand);
    console.log("✅ Bucket access successful");
    console.log("Objects found:", objectsResult.Contents?.length || 0);

    console.log("\n✅ All tests passed! R2 connection is working.");
  } catch (error) {
    console.error("❌ R2 connection test failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.$metadata?.httpStatusCode);

    if (error.$metadata?.httpStatusCode === 403) {
      console.error("\n🔧 403 Error - Possible solutions:");
      console.error("1. Check if your API token has R2 permissions");
      console.error("2. Verify the bucket name exists");
      console.error(
        "3. Ensure the API token has 'Object Read & Write' permissions"
      );
      console.error("4. Check if the bucket is in the correct account");
    }
  }
}

testR2Connection();
