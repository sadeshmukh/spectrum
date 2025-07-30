/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: "development" | "production";
  readonly GITHUB_CLIENT_ID: string;
  readonly GITHUB_CLIENT_SECRET: string;
  readonly ADMIN_EMAIL: string;
  readonly AUTH_SECRET: string;
  readonly AUTH_TRUST_HOST: string;
  readonly CLOUDFLARE_ACCOUNT_ID: string;
  readonly CLOUDFLARE_API_TOKEN: string;
  readonly CLOUDFLARE_R2_BUCKET_NAME: string;
  readonly CLOUDFLARE_R2_PUBLIC_DOMAIN?: string;
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly AWS_REGION: string;
  readonly ASTRO_DB_REMOTE_URL?: string;
  readonly ASTRO_DB_APP_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
