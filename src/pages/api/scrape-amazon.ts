import type { APIRoute } from "astro";
import { scrapeAmazonPrice } from "../../lib/amazon-scraper";

export const POST: APIRoute = async ({ request }) => {
  try {
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
