import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  bigint,
  decimal,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  githubId: bigint("github_id", { mode: "number" }).unique().notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  fullName: varchar("full_name", { length: 500 }).notNull(), // "org/repo"
  description: text("description"),
  htmlUrl: varchar("html_url", { length: 1000 }).notNull(),

  // Repository stats
  starsCount: integer("stars_count").default(0),
  forksCount: integer("forks_count").default(0),
  openIssuesCount: integer("open_issues_count").default(0),
  watchersCount: integer("watchers_count").default(0),

  // Languages/Topics
  primaryLanguage: varchar("primary_language", { length: 100 }),
  languages: jsonb("languages").$type<Record<string, number>>().default({}),
  topics: jsonb("topics").$type<string[]>().default([]),

  // Activity metrics
  lastPushAt: timestamp("last_push_at", { withTimezone: true }),
  lastCommitAt: timestamp("last_commit_at", { withTimezone: true }),
  commitsLastMonth: integer("commits_last_month").default(0),
  contributorsCount: integer("contributors_count").default(0),

  // Calculated scores
  activityScore: decimal("activity_score", { precision: 4, scale: 2 }),

  // Metadata
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
