import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserGuesses, Users, count, sql, gte, eq } from "astro:db";

export const GET: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.isAdmin) {
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

    const totalItems = await db.select({ count: count() }).from(Items);
    const totalGuesses = await db.select({ count: count() }).from(UserGuesses);
    const totalUsers = await db.select({ count: count() }).from(Users);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const guessesToday = await db
      .select({ count: count() })
      .from(UserGuesses)
      .where(gte(UserGuesses.submittedAt, today));

    const averageAccuracy = await db
      .select({ avg: sql<number>`AVG(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(sql`${UserGuesses.accuracy} IS NOT NULL`);

    const activeUsers = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${UserGuesses.userId})` })
      .from(UserGuesses)
      .where(
        gte(
          UserGuesses.submittedAt,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
      );

    const recentGuesses = await db
      .select({
        id: UserGuesses.id,
        userId: UserGuesses.userId,
        guess: UserGuesses.guess,
        accuracy: UserGuesses.accuracy,
        submittedAt: UserGuesses.submittedAt,
        itemId: UserGuesses.itemId,
        itemTitle: Items.title,
      })
      .from(UserGuesses)
      .leftJoin(Items, eq(UserGuesses.itemId, Items.id))
      .orderBy(sql`${UserGuesses.submittedAt} DESC`)
      .limit(5);

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalGuesses: totalGuesses[0]?.count || 0,
      totalItems: totalItems[0]?.count || 0,
      averageAccuracy: averageAccuracy[0]?.avg || 0,
      guessesToday: guessesToday[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      recentGuesses: recentGuesses.map((guess) => ({
        id: guess.id,
        userId: guess.userId,
        guess: guess.guess,
        accuracy: guess.accuracy,
        submittedAt: guess.submittedAt.toISOString(),
        itemId: guess.itemId,
        itemTitle: guess.itemTitle,
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
    console.error("Admin Stats API Error:", error);
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
