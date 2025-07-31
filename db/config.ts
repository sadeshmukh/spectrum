import { defineDb, defineTable, column, NOW } from "astro:db";

const Users = defineTable({
  columns: {
    email: column.text({ primaryKey: true }),
    name: column.text(),
    image: column.text({ optional: true }),
    isAdmin: column.boolean({ default: false }),
    isPublic: column.boolean({ default: false }),
    publicUsername: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

const Items = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    link: column.text(),
    photoUrl: column.text({ optional: true }),
    title: column.text({ optional: true }),
    actualPrice: column.number({ optional: true }),
    // averageAccuracyCache: column.number({ optional: true }),
    // calculate on the fly? ^^ from userguesses sql query
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

const UserGuesses = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.text({ references: () => Users.columns.email }),
    itemId: column.number({ references: () => Items.columns.id }),
    guess: column.number(),
    accuracy: column.number({ optional: true }),
    submittedAt: column.date({ default: NOW }),
  },
});

const UserSessions = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.text({ references: () => Users.columns.email }),
    currentItemId: column.number({ references: () => Items.columns.id }),
    maxPrice: column.number(),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export default defineDb({
  tables: { Users, Items, UserGuesses, UserSessions },
});
