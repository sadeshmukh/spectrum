import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items } from "astro:db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!session.user?.isAdmin) {
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
    const { url, title, price, currency, image, availability } = body;

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

    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Price must be a positive number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const itemData = {
      link: url,
      photoUrl: image || null,
      title: title || null,
      actualPrice: price || null,
    };

    const result = await db.insert(Items).values(itemData).returning();

    return new Response(
      JSON.stringify({
        success: true,
        data: result[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
