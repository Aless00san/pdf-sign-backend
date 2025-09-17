import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  createdAt: text("created_at").default(new Date().toISOString()),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").default("pending"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});
