import { db, Users, sql } from "astro:db";

export default async function migratePublicStats() {
  console.log("Starting public stats migration...");

  // Set isPublic to false for all existing users who don't have it set
  const result = await db.run(sql`
    UPDATE users 
    SET isPublic = false, updatedAt = datetime('now')
    WHERE isPublic IS NULL
  `);

  console.log("Public stats migration completed!");
  console.log("All existing users have been set to private profiles.");
  console.log(
    "Public usernames will be generated when users first enable their public profiles."
  );
}
