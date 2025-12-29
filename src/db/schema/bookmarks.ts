import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { issues } from "./issues";

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    issueId: integer("issue_id")
      .references(() => issues.id, { onDelete: "cascade" })
      .notNull(),
    notes: text("notes"),
    status: varchar("status", { length: 50 }).default("saved"), // "saved", "interested", "working", "abandoned"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.userId, table.issueId)]
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
