// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import auth from "auth-astro";

import node from "@astrojs/node";

import react from "@astrojs/react";

import db from "@astrojs/db";

// https://astro.build/config
export default defineConfig({
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [auth(), react(), db()],

  adapter: node({
    mode: "standalone",
  }),
});