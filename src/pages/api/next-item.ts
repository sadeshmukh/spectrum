import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserSessions, eq, sql } from "astro:db";

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

    const availableItems = await db
      .select()
      .from(Items)
      .where(sql`${Items.actualPrice} IS NOT NULL`);

    if (availableItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No items available",
          message: "No items have been added to the system yet.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const randomIndex = Math.floor(Math.random() * availableItems.length);
    const selectedItem = availableItems[randomIndex];
    const maxPrice = calculatePriceCap(selectedItem.actualPrice!);

    await db.delete(UserSessions).where(eq(UserSessions.userId, userId));

    await db.insert(UserSessions).values({
      userId: userId,
      currentItemId: selectedItem.id,
      maxPrice: maxPrice,
    });

    const itemForUser = {
      id: selectedItem.id,
      title: selectedItem.title,
      photoUrl: selectedItem.photoUrl,
      link: selectedItem.link,
      maxPrice: maxPrice,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: itemForUser,
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
