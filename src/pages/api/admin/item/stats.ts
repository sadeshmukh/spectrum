import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Items, UserGuesses, count, eq, sql, gte, desc } from "astro:db";

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const itemId = url.searchParams.get("itemId");

    if (!itemId) {
      return new Response(
        JSON.stringify({ success: false, error: "Item ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const item = await db
      .select()
      .from(Items)
      .where(eq(Items.id, parseInt(itemId)))
      .get();

    if (!item) {
      return new Response(
        JSON.stringify({ success: false, error: "Item not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const totalGuesses = await db
      .select({ count: count() })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId)));

    const averageGuess = await db
      .select({ avg: sql<number>`AVG(${UserGuesses.guess})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId)));

    const averageAccuracy = await db
      .select({ avg: sql<number>`AVG(${UserGuesses.accuracy})` })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId)));

    const guessDistribution = await db
      .select({
        range: sql<string>`CASE 
          WHEN ${UserGuesses.guess} < ${
          item.actualPrice! * 0.5
        } THEN 'Under 50%'
          WHEN ${UserGuesses.guess} < ${item.actualPrice! * 0.8} THEN '50-80%'
          WHEN ${UserGuesses.guess} < ${item.actualPrice! * 1.2} THEN '80-120%'
          WHEN ${UserGuesses.guess} < ${item.actualPrice! * 1.5} THEN '120-150%'
          ELSE 'Over 150%'
        END`,
        count: count(),
      })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId))).groupBy(sql`CASE 
        WHEN ${UserGuesses.guess} < ${item.actualPrice! * 0.5} THEN 'Under 50%'
        WHEN ${UserGuesses.guess} < ${item.actualPrice! * 0.8} THEN '50-80%'
        WHEN ${UserGuesses.guess} < ${item.actualPrice! * 1.2} THEN '80-120%'
        WHEN ${UserGuesses.guess} < ${item.actualPrice! * 1.5} THEN '120-150%'
        ELSE 'Over 150%'
      END`);

    const recentGuesses = await db
      .select({
        userId: UserGuesses.userId,
        guess: UserGuesses.guess,
        accuracy: UserGuesses.accuracy,
        submittedAt: UserGuesses.submittedAt,
      })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId)))
      .orderBy(desc(UserGuesses.submittedAt))
      .limit(20);

    const accuracyRanges = await db
      .select({
        range: sql<string>`CASE 
          WHEN ${UserGuesses.accuracy} >= 90 THEN '90-100%'
          WHEN ${UserGuesses.accuracy} >= 80 THEN '80-89%'
          WHEN ${UserGuesses.accuracy} >= 70 THEN '70-79%'
          WHEN ${UserGuesses.accuracy} >= 60 THEN '60-69%'
          WHEN ${UserGuesses.accuracy} >= 50 THEN '50-59%'
          ELSE 'Under 50%'
        END`,
        count: count(),
      })
      .from(UserGuesses)
      .where(eq(UserGuesses.itemId, parseInt(itemId))).groupBy(sql`CASE 
        WHEN ${UserGuesses.accuracy} >= 90 THEN '90-100%'
        WHEN ${UserGuesses.accuracy} >= 80 THEN '80-89%'
        WHEN ${UserGuesses.accuracy} >= 70 THEN '70-79%'
        WHEN ${UserGuesses.accuracy} >= 60 THEN '60-69%'
        WHEN ${UserGuesses.accuracy} >= 50 THEN '50-59%'
        ELSE 'Under 50%'
      END`);

    const stats = {
      item: {
        id: item.id,
        title: item.title,
        link: item.link,
        photoUrl: item.photoUrl,
        actualPrice: item.actualPrice,
        createdAt: item.createdAt.toISOString(),
      },
      overview: {
        totalGuesses: totalGuesses[0]?.count || 0,
        averageGuess: averageGuess[0]?.avg || 0,
        averageAccuracy: averageAccuracy[0]?.avg || 0,
        actualPrice: item.actualPrice,
      },
      guessDistribution: guessDistribution.map((d) => ({
        range: d.range,
        count: d.count,
        percentage: totalGuesses[0]?.count
          ? Math.round((d.count / totalGuesses[0].count) * 100)
          : 0,
      })),
      accuracyRanges: accuracyRanges.map((a) => ({
        range: a.range,
        count: a.count,
        percentage: totalGuesses[0]?.count
          ? Math.round((a.count / totalGuesses[0].count) * 100)
          : 0,
      })),
      recentGuesses: recentGuesses.map((g) => ({
        userId: g.userId,
        guess: g.guess,
        accuracy: g.accuracy || 0,
        submittedAt: g.submittedAt.toISOString(),
      })),
    } as const;

    return new Response(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Item Stats API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
