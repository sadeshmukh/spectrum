import { defineDb, defineTable, column, NOW } from "astro:db";

const Users = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    email: column.text({ unique: true }),
    name: column.text(),
    image: column.text({ optional: true }),
    isAdmin: column.boolean({ default: false }),
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
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

const UserGuesses = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.text({ references: () => Users.columns.id }),
    itemId: column.number({ references: () => Items.columns.id }),
    guess: column.number(),
    accuracy: column.number({ optional: true }),
    submittedAt: column.date({ default: NOW }),
  },
});

export default defineDb({
  tables: { Users, Items, UserGuesses },
});
