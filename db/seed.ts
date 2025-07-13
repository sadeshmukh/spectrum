import { db, Users, Items, UserGuesses } from "astro:db";

export default async function seed() {
  await db.insert(Users).values([
    {
      id: "abc123",
      email: "john@example.com",
      name: "John Doe",
      image: "https://example.com/john.jpg",
      isAdmin: false,
    },
    {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      image: "https://example.com/admin.jpg",
      isAdmin: true,
    },
  ]);

  await db.insert(Items).values([
    {
      link: "https://amazon.com/example-item-1",
      photoUrl: "https://example.com/image1.jpg",
      title: "Example Amazon Item 1",
      actualPrice: 29.99,
    },
  ]);
  // will fix seeded db eventually
  await db.insert(UserGuesses).values([
    {
      userId: "abc123",
      itemId: 1,
      guess: 25.0,
      accuracy: 83.5,
    },
    {
      userId: "admin-1",
      itemId: 1,
      guess: 35.0,
      accuracy: 84.5,
    },
  ]);
}
