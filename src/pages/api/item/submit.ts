import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserGuesses, eq } from "astro:db";
import { assignRandomItemToUser } from "../../../lib/items";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.email;
    const { itemId, guess } = await request.json();

    if (!itemId || !guess) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof itemId !== "number" || itemId <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid item ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof guess !== "number" || guess < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Guess must be a positive number",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const item = await db
      .select()
      .from(Items)
      .where(eq(Items.id, itemId))
      .get();

    if (!item || !item.actualPrice) {
      return new Response(
        JSON.stringify({ success: false, error: "Item not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const accuracy = Math.max(
      0,
      Math.round(
        (1 - Math.abs(guess - item.actualPrice) / item.actualPrice) * 100
      )
    );

    // @ts-expect-error - ignore type evolution for now
    await db.insert(UserGuesses).values({
      userId,
      itemId,
      guess,
      accuracy,
    });

    const nextItem = await assignRandomItemToUser(userId);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userGuess: guess,
          actualPrice: item.actualPrice,
          accuracy,
          itemId,
          nextItem,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
