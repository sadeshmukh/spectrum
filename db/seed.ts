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
    });
  }

  const anonUser = await db
    .select()
    .from(Users)
    .where(eq(Users.email, "anonymous@sahil.ink"))
    .get();

  if (!anonUser) {
    await db.insert(Users).values({
      email: "anonymous@sahil.ink",
      name: "Anonymous User",
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
