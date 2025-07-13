/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: "development" | "production";
  readonly GITHUB_CLIENT_ID: string;
  readonly GITHUB_CLIENT_SECRET: string;
  readonly ADMIN_EMAIL: string;
  readonly AUTH_SECRET: string;
  readonly AUTH_TRUST_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
