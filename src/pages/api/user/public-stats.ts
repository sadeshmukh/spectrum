import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Users, eq, sql } from "astro:db";
import {
  generateRandomUsername,
  isUsernameAvailable,
  validateUsername,
} from "../../../lib/username.js";
import {
  isValidEmail,
  sanitizeUsername,
} from "../../../lib/input-sanitization.js";

export const POST: APIRoute = async ({ request }) => {
  try {
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

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { isPublic, username } = requestBody;

    if (typeof isPublic !== "boolean") {
      return new Response(
        JSON.stringify({ success: false, error: "isPublic must be a boolean" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (username !== undefined && typeof username !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Username must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sanitizedUsername = username ? sanitizeUsername(username) : null;

    const currentUser = await db
      .select()
      .from(Users)
      .where(eq(Users.email, session.user.email))
      .get();

    if (!currentUser) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let publicUsername = currentUser.publicUsername;

    if (isPublic && !publicUsername) {
      if (sanitizedUsername) {
        const validation = validateUsername(sanitizedUsername);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: validation.error }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const available = await isUsernameAvailable(sanitizedUsername);
        if (!available) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Username is already taken",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        publicUsername = sanitizedUsername;
      } else {
        publicUsername = await generateRandomUsername();

        let attempts = 0;
        while (!(await isUsernameAvailable(publicUsername)) && attempts < 10) {
          publicUsername = await generateRandomUsername();
          attempts++;
        }

        if (attempts >= 10) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Unable to generate unique username",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    await db.run(sql`
      UPDATE users 
      SET isPublic = ${isPublic}, 
          publicUsername = ${publicUsername || null}, 
          updatedAt = datetime('now')
      WHERE email = ${session.user.email}
    `);

    return new Response(
      JSON.stringify({
        success: true,
        data: { isPublic, publicUsername },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Public Stats API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
