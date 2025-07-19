import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, UserGuesses, Items, count, desc, eq, sql } from "astro:db";

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = session.user.email;

    const userGuesses = await db
      .select({ count: count() })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, userId));

    const bestAccuracy = await db
      .select({ max: sql<number>`MAX(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, userId));

    const averageAccuracy = await db
      .select({ avg: sql<number>`AVG(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, userId));

    const recentGuesses = await db
      .select({
        id: UserGuesses.id,
        guess: UserGuesses.guess,
        accuracy: UserGuesses.accuracy,
        submittedAt: UserGuesses.submittedAt,
        itemId: UserGuesses.itemId,
        itemTitle: Items.title,
        itemLink: Items.link,
      })
      .from(UserGuesses)
      .leftJoin(Items, eq(UserGuesses.itemId, Items.id))
      .where(eq(UserGuesses.userId, userId))
      .orderBy(desc(UserGuesses.submittedAt))
      .limit(5);

    const stats = {
      totalGuesses: userGuesses[0]?.count || 0,
      bestAccuracy: bestAccuracy[0]?.max || 0,
      averageAccuracy: averageAccuracy[0]?.avg || 0,
      recentGuesses: recentGuesses.map((guess) => ({
        id: guess.id,
        guess: guess.guess,
        accuracy: guess.accuracy || 0,
        submittedAt: guess.submittedAt.toISOString(),
        itemId: guess.itemId,
        itemTitle: guess.itemTitle,
        itemLink: guess.itemLink,
      })),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: stats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("User Stats API Error:", error);
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
