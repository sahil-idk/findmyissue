import {
  pgTable,
  serial,
  varchar,
  text,
  bigint,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: bigint("github_id", { mode: "number" }).unique().notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 500 }),
  avatarUrl: varchar("avatar_url", { length: 1000 }),
  githubAccessToken: text("github_access_token"), // Encrypted in production

  // Preferences
  preferredTechnologies: jsonb("preferred_technologies")
    .$type<string[]>()
    .default([]),
  preferredCategories: jsonb("preferred_categories")
    .$type<string[]>()
    .default([]),

  // Metadata
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
