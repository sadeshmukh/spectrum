import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Challenges, Users, eq } from "astro:db";

function generateChallengeId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { itemId, guess, accuracy, maxPrice } = await request.json();

    if (!itemId || !guess || accuracy === undefined || !maxPrice) {
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

    if (typeof accuracy !== "number" || accuracy < 0 || accuracy > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Accuracy must be between 0 and 100",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof maxPrice !== "number" || maxPrice <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Max price must be a positive number",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // check for existing
    const user = await db
      .select()
      .from(Users)
      .where(eq(Users.email, session.user.email))
      .get();

    if (!user || !user.isPublic || !user.publicUsername) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "You need a public profile to create challenges. Go to your dashboard to make your profile public.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const challengeId = generateChallengeId();

    await db.insert(Challenges).values({
      id: challengeId,
      itemId,
      originalGuess: guess,
      originalAccuracy: accuracy,
      originalUsername: user.publicUsername,
      maxPrice: maxPrice,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          challengeId,
          challengeUrl: `${
            new URL(request.url).origin
          }/challenge/${challengeId}`,
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
