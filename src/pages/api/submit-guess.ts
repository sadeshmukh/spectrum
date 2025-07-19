import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserGuesses, eq } from "astro:db";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);
    const userId = session?.user?.email || "anonymous@spectrum.local";

    const body = await request.json();
    const { itemId, guess } = body;

    if (!itemId || !guess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const item = await db
      .select()
      .from(Items)
      .where(eq(Items.id, itemId))
      .get();

    if (!item || !item.actualPrice) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Item not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const accuracy = Math.max(
      0,
      Math.round(
        (1 - Math.abs(guess - item.actualPrice) / item.actualPrice) * 100
      )
    );

    await db.insert(UserGuesses).values({
      userId: userId,
      itemId: itemId,
      guess: guess,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userGuess: guess,
          actualPrice: item.actualPrice,
          accuracy: accuracy,
          itemId: itemId,
        },
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
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
