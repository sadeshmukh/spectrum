import type { APIRoute } from "astro";
import { db, Users, UserGuesses, Items, count, eq, sql, desc } from "astro:db";

export const GET: APIRoute = async ({ url }) => {
  try {
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Username parameter required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await db
      .select()
      .from(Users)
      .where(eq(Users.publicUsername, username))
      .get();

    if (!user || !user.isPublic) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found or not public",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const totalGuesses = await db
      .select({ count: count() })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, user.email));

    const bestAccuracy = await db
      .select({ max: sql<number>`MAX(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, user.email));

    const averageAccuracy = await db
      .select({ avg: sql<number>`AVG(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.userId, user.email));

    const recentGuesses = await db
      .select({
        id: UserGuesses.id,
        guess: UserGuesses.guess,
        accuracy: UserGuesses.accuracy,
        submittedAt: UserGuesses.submittedAt,
        itemId: UserGuesses.itemId,
        itemTitle: Items.title,
      })
      .from(UserGuesses)
      .leftJoin(Items, eq(UserGuesses.itemId, Items.id))
      .where(eq(UserGuesses.userId, user.email))
      .orderBy(desc(UserGuesses.submittedAt))
      .limit(10);

    const stats = {
      username: user.publicUsername,
      totalGuesses: totalGuesses[0]?.count || 0,
      bestAccuracy: bestAccuracy[0]?.max || 0,
      averageAccuracy: averageAccuracy[0]?.avg || 0,
      recentGuesses: recentGuesses.map((guess) => ({
        id: guess.id,
        guess: guess.guess,
        accuracy: guess.accuracy || 0,
        submittedAt: guess.submittedAt.toISOString(),
        itemTitle: guess.itemTitle || "Amazon Item",
      })),
    };

    return new Response(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Public Stats API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
