import type { APIRoute } from "astro";
import { getSession } from "auth-astro/server";
import {
  generateRandomUsername,
  isUsernameAvailable,
} from "../../../lib/username.js";
import { isValidEmail } from "../../../lib/input-sanitization.js";

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

    let username = await generateRandomUsername();

    let attempts = 0;
    while (!(await isUsernameAvailable(username)) && attempts < 10) {
      username = await generateRandomUsername();
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

    return new Response(
      JSON.stringify({
        success: true,
        data: { username },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate Username API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
