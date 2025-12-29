import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 1000 }),
  websiteUrl: varchar("website_url", { length: 1000 }),
  githubUrl: varchar("github_url", { length: 1000 }),
  ideasPageUrl: varchar("ideas_page_url", { length: 1000 }),

  // Arrays stored as JSONB
  technologies: jsonb("technologies").$type<string[]>().default([]),
  categories: jsonb("categories").$type<string[]>().default([]),
  yearsParticipated: jsonb("years_participated").$type<number[]>().default([]),
  communicationChannels: jsonb("communication_channels")
    .$type<Record<string, string>>()
    .default({}),
  topicTags: jsonb("topic_tags").$type<string[]>().default([]),

  // Calculated metrics
  longevityYears: integer("longevity_years").default(0),
  longevityBadge: varchar("longevity_badge", { length: 50 }), // "veteran", "experienced", "newcomer"
  beginnerFriendlinessScore: decimal("beginner_friendliness_score", {
    precision: 4,
    scale: 2,
  }),
  avgMaintainerResponseHours: decimal("avg_maintainer_response_hours", {
    precision: 10,
    scale: 2,
  }),
  totalRepos: integer("total_repos").default(0),
  totalOpenIssues: integer("total_open_issues").default(0),

  // Metadata
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
