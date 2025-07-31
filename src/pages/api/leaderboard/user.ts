// user position + stats for timeframe
// valid timeframes (see db file): today, week, month, all-time

import type { APIRoute } from "astro";
import { eq, gte, and, db, Users, UserGuesses, Items } from "astro:db";
import { getSession } from "auth-astro/server";
import { calculateScore } from "../../../lib/score";
import { isValidEmail } from "../../../lib/input-sanitization.js";

export const GET: APIRoute = async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe");

    if (!timeframe) {
      return new Response(
        JSON.stringify({ success: false, error: "Timeframe is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validTimeframes = ["today", "week", "month", "all-time"] as const;
    if (!validTimeframes.includes(timeframe as any)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid timeframe" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(session.user.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.email;

    // date filter for timeframe
    let startDate: Date | null = null;
    switch (timeframe) {
      case "today": {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case "week": {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case "month": {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      }
      case "all-time":
      default:
        startDate = null;
    }

    const userGuesses = await db
      .select()
      .from(UserGuesses)
      .where(
        startDate
          ? and(
              eq(UserGuesses.userId, userId),
              gte(UserGuesses.submittedAt, startDate)
            )
          : eq(UserGuesses.userId, userId)
      );

    let userScore = 0;
    const baseScore = Number(import.meta.env.BASE_SCORE) || 1000;

    for (const guess of userGuesses) {
      const item = await db
        .select()
        .from(Items)
        .where(eq(Items.id, guess.itemId))
        .limit(1)
        .get();

      // no inbuilt avgaccuracy, so have to calc on the fly.
      // conditions are hopefully in right order to minimize overhead
      if (!item) continue;

      const itemGuesses = await db
        .select()
        .from(UserGuesses)
        .where(eq(UserGuesses.itemId, guess.itemId));

      // TODO: some sort of in-mem cache?
      const averageAccuracy =
        itemGuesses.reduce((acc, g) => acc + (g.accuracy ?? 0), 0) /
        itemGuesses.length;

      userScore += calculateScore(
        averageAccuracy || 0,
        itemGuesses.length,
        guess.accuracy ?? 0,
        baseScore
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { userScore } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Leaderboard User API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
