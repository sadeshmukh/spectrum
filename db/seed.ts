import { db, Users, Items, eq } from "astro:db";
import { scrapedItems } from "./scraped-items";

export default async function seed() {
  const adminUser = await db
    .select()
    .from(Users)
    .where(eq(Users.email, "admin@sahil.ink"))
    .get();

  if (!adminUser) {
    await db.insert(Users).values({
      email: "admin@sahil.ink",
      name: "Admin User",
      isAdmin: true,
    });
  }

  if (scrapedItems.length > 0) {
    for (const item of scrapedItems) {
      const existingItem = await db
        .select()
        .from(Items)
        .where(eq(Items.link, item.link))
        .get();
      if (!existingItem) {
        await db.insert(Items).values(item);
      }
    }
  }
}
