import { db, Users, eq, sql } from "astro:db";

const adjectives = [
  "swift",
  "brave",
  "clever",
  "bright",
  "calm",
  "daring",
  "eager",
  "fierce",
  "gentle",
  "happy",
  "jolly",
  "kind",
  "lively",
  "mighty",
  "noble",
  "proud",
  "quick",
  "radiant",
  "smart",
  "tender",
  "warm",
  "zealous",
  "adventurous",
  "creative",
  "energetic",
  "friendly",
  "generous",
  "honest",
  "inspiring",
  "joyful",
  "knowledgeable",
  "loving",
  "mysterious",
  "optimistic",
  "peaceful",
];

const nouns = [
  "tiger",
  "eagle",
  "wolf",
  "bear",
  "lion",
  "fox",
  "owl",
  "hawk",
  "dragon",
  "phoenix",
  "unicorn",
  "griffin",
  "panther",
  "falcon",
  "raven",
  "swan",
  "dolphin",
  "whale",
  "shark",
  "turtle",
  "butterfly",
  "bee",
  "ant",
  "spider",
  "scorpion",
  "snake",
  "lizard",
  "frog",
  "toad",
  "fish",
  "bird",
  "cat",
  "dog",
  "horse",
  "cow",
  "sheep",
  "goat",
  "pig",
  "chicken",
  "duck",
  "goose",
];

export async function generateRandomUsername(): Promise<string> {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");

  return `${adjective}${noun}-${number}`;
}

export async function generateUniqueUsername(
  githubUsername: string
): Promise<string> {
  // clean github username
  const baseUsername = githubUsername
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);

  if (!baseUsername) {
    // fallback if username is empty after cleaning
    return await generateRandomUsername();
  }

  // check if the base username is available
  const existingUser = await db
    .select()
    .from(Users)
    .where(eq(Users.publicUsername, baseUsername))
    .get();

  if (!existingUser) {
    return baseUsername;
  }

  // if taken, try with numbers
  let counter = 1;
  while (counter < 1000) {
    const candidateUsername = `${baseUsername}${counter}`;
    const existingUser = await db
      .select()
      .from(Users)
      .where(eq(Users.publicUsername, candidateUsername))
      .get();

    if (!existingUser) {
      return candidateUsername;
    }
    counter++;
  }

  // fallback if all attempts fail
  return await generateRandomUsername();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existingUser = await db
    .select()
    .from(Users)
    .where(eq(Users.publicUsername, username))
    .get();

  return !existingUser;
}

export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 20) {
    return { valid: false, error: "Username must be 20 characters or less" };
  }

  if (!/^[a-z0-9-]+$/.test(username)) {
    return {
      valid: false,
      error:
        "Username can only contain lowercase letters, numbers, and hyphens",
    };
  }

  if (username.startsWith("-") || username.endsWith("-")) {
    return {
      valid: false,
      error: "Username cannot start or end with a hyphen",
    };
  }

  if (username.includes("--")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive hyphens",
    };
  }

  return { valid: true };
}
