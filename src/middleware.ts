import { sequence } from "astro:middleware";
import { defineMiddleware } from "astro:middleware";
import { getSession } from "auth-astro/server";

declare module "astro" {
  interface Locals {
    session: any;
  }
}

const auth = defineMiddleware(async (context, next) => {
  const session = await getSession(context.request);
  context.locals.session = session;
  return next();
});

export const onRequest = auth;
