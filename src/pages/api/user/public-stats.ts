import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import { db, Users, eq, sql } from "astro:db";
import {
  generateRandomUsername,
  isUsernameAvailable,
  validateUsername,
} from "../../../lib/username.js";

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = await getSession(request);

    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { isPublic, username } = await request.json();

    if (typeof isPublic !== "boolean") {
      return new Response(
        JSON.stringify({ success: false, error: "isPublic must be a boolean" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // get current user data
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

    // handle username generation/validation when enabling public profile
    if (isPublic && !publicUsername) {
      if (username) {
        const validation = validateUsername(username);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ success: false, error: validation.error }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // check available
        const available = await isUsernameAvailable(username);
        if (!available) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Username is already taken",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        publicUsername = username;
      } else {
        publicUsername = await generateRandomUsername();

        // ensure uniqueness
        while (!(await isUsernameAvailable(publicUsername))) {
          publicUsername = await generateRandomUsername();
        }
      }
    }

    // update user's public stats setting
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
