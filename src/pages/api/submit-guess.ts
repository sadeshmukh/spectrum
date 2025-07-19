import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserGuesses, UserSessions, eq, sql } from "astro:db";

function calculatePriceCap(actualPrice: number): number {
  const multiplier = 1 + Math.random() * 2;
  const rawCap = actualPrice * multiplier;

  if (rawCap < 50) {
    return Math.ceil(rawCap / 5) * 5;
  } else if (rawCap < 200) {
    return Math.ceil(rawCap / 10) * 10;
  } else if (rawCap < 1000) {
    return Math.ceil(rawCap / 25) * 25;
  } else if (rawCap < 5000) {
    return Math.ceil(rawCap / 100) * 100;
  } else {
    return Math.ceil(rawCap / 500) * 500;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
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

    const userId = session.user.email;

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

    if (typeof itemId !== "number" || itemId <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid item ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (typeof guess !== "number" || guess < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Guess must be a positive number",
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

    // @ts-expect-error - probably should know when this changes
    await db.insert(UserGuesses).values({
      userId: userId,
      itemId: itemId,
      guess: guess,
      accuracy: accuracy,
    });

    // on submission retrieve next item automatically - probably should move and dedupe this
    const availableItems = await db
      .select()
      .from(Items)
      .where(sql`${Items.actualPrice} IS NOT NULL`);

    let nextItem = null;
    if (availableItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      const selectedItem = availableItems[randomIndex];
      const maxPrice = calculatePriceCap(selectedItem.actualPrice!);

      await db.delete(UserSessions).where(eq(UserSessions.userId, userId));

      await db.insert(UserSessions).values({
        userId: userId,
        currentItemId: selectedItem.id,
        maxPrice: maxPrice,
      });

      nextItem = {
        id: selectedItem.id,
        title: selectedItem.title,
        photoUrl: selectedItem.photoUrl,
        link: selectedItem.link,
        maxPrice: maxPrice,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userGuess: guess,
          actualPrice: item.actualPrice,
          accuracy: accuracy,
          itemId: itemId,
          nextItem: nextItem,
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
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
