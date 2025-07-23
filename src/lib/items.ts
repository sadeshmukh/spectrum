import { db, Items, UserSessions, eq, sql } from "astro:db";
import { calculatePriceCap } from "./pricing";

export async function assignRandomItemToUser(userId: string) {
  const availableItems = await db
    .select()
    .from(Items)
    .where(sql`${Items.actualPrice} IS NOT NULL`);

  if (availableItems.length === 0) return null;

  const selectedItem =
    availableItems[Math.floor(Math.random() * availableItems.length)];
  const maxPrice = calculatePriceCap(selectedItem.actualPrice!);

  await db.delete(UserSessions).where(eq(UserSessions.userId, userId));

  await db.insert(UserSessions).values({
    userId,
    currentItemId: selectedItem.id,
    maxPrice,
  });

  return {
    id: selectedItem.id,
    title: selectedItem.title,
    photoUrl: selectedItem.photoUrl,
    link: selectedItem.link,
    maxPrice,
  } as const;
}
