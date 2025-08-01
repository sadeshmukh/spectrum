import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { getCurrentUserItem, assignRandomItemToUser } from "../../../lib/items";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let item = await getCurrentUserItem(session.user.email);

    if (!item) {
      item = await assignRandomItemToUser(session.user.email);
    }

    if (!item) {
      // assign random to user fails silently in this case with no items available
      return new Response(
        JSON.stringify({ success: false, error: "No items available" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: item }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const GET = POST;
