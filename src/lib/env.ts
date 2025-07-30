import { config } from "dotenv";

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV as "development" | "production",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST!,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN!,
  CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
  CLOUDFLARE_R2_PUBLIC_DOMAIN: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_REGION: process.env.AWS_REGION!,
  ASTRO_DB_REMOTE_URL: process.env.ASTRO_DB_REMOTE_URL,
  ASTRO_DB_APP_TOKEN: process.env.ASTRO_DB_APP_TOKEN,
} as const;
