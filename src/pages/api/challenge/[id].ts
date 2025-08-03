import type { APIRoute } from "astro";
import { db, Challenges, Items, eq } from "astro:db";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Challenge ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const challenge = await db
      .select()
      .from(Challenges)
      .where(eq(Challenges.id, id))
      .get();

    if (!challenge) {
      return new Response(
        JSON.stringify({ success: false, error: "Challenge not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const item = await db
      .select()
      .from(Items)
      .where(eq(Items.id, challenge.itemId))
      .get();

    if (!item) {
      return new Response(
        JSON.stringify({ success: false, error: "Item not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          challenge: {
            id: challenge.id,
            originalGuess: challenge.originalGuess,
            originalAccuracy: challenge.originalAccuracy,
            originalUsername: challenge.originalUsername,
            maxPrice: challenge.maxPrice,
            createdAt: challenge.createdAt,
          },
          item: {
            id: item.id,
            title: item.title,
            photoUrl: item.photoUrl,
            link: item.link,
            actualPrice: item.actualPrice,
          },
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
