import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "crypto";
import { config } from "dotenv";
import { USER_AGENT } from "./constants";

config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToCloudflareR2(
  imageUrl: string,
  bucketName: string = process.env.CLOUDFLARE_R2_BUCKET_NAME!
): Promise<string> {
  try {
    const cleanUrl = imageUrl.split("?")[0];
    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // hash to dedupe
    const hash = createHash("sha256").update(imageBuffer).digest("hex");
    const extension = getExtensionFromContentType(contentType);
    const fileName = `products/${hash}.${extension}`;

    // check if it exists
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        })
      );

      // hash is identical, return existing URL
      return `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`;
    } catch (error: any) {
      if (error.name !== "NotFound") {
        throw error;
      }

      // hash is different, upload it
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: imageBuffer,
        ContentType: contentType,
      });

      await s3Client.send(command);

      return `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`;
    }
  } catch (error) {
    console.error("Cloudflare R2 upload error:", error);
    throw error;
  }
}

function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}
