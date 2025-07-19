import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { scrapeAmazonPrice } from "../../lib/amazon-scraper";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Admin access required",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (typeof url !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL must be a string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid URL format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = await scrapeAmazonPrice(url);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
