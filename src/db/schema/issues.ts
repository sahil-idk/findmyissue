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
  boolean,
} from "drizzle-orm/pg-core";
import { repositories } from "./repositories";

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").references(() => repositories.id, {
    onDelete: "cascade",
  }),
  githubId: bigint("github_id", { mode: "number" }).unique().notNull(),
  number: integer("number").notNull(),
  title: varchar("title", { length: 1000 }).notNull(),
  body: text("body"),
  htmlUrl: varchar("html_url", { length: 1000 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(), // "open", "closed"

  // Issue metadata
  labels: jsonb("labels")
    .$type<Array<{ name: string; color: string }>>()
    .default([]),
  assignees: jsonb("assignees").$type<string[]>().default([]),
  authorLogin: varchar("author_login", { length: 255 }),
  authorAvatarUrl: varchar("author_avatar_url", { length: 1000 }),

  // Engagement metrics
  commentsCount: integer("comments_count").default(0),
  reactionsCount: integer("reactions_count").default(0),

  // Jam Factor analysis
  assignmentRequests: integer("assignment_requests").default(0),
  jamFactor: decimal("jam_factor", { precision: 4, scale: 2 }), // 0-10 (higher = more competition)

  // Time-based metrics
  createdAtGithub: timestamp("created_at_github", { withTimezone: true }),
  updatedAtGithub: timestamp("updated_at_github", { withTimezone: true }),
  freshnessScore: decimal("freshness_score", { precision: 4, scale: 2 }), // 0-10

  // Final composite score
  opportunityScore: decimal("opportunity_score", { precision: 4, scale: 2 }), // 0-10

  // Categorization
  difficulty: varchar("difficulty", { length: 50 }), // "beginner", "intermediate", "advanced"
  hasBeginnerLabel: boolean("has_beginner_label").default(false),
  hasGsocLabel: boolean("has_gsoc_label").default(false),
  hasHelpWantedLabel: boolean("has_help_wanted_label").default(false),

  // Metadata
  lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;

// Issue comments for jam factor analysis
export const issueComments = pgTable("issue_comments", {
  id: serial("id").primaryKey(),
  issueId: integer("issue_id").references(() => issues.id, {
    onDelete: "cascade",
  }),
  githubId: bigint("github_id", { mode: "number" }).unique().notNull(),
  authorLogin: varchar("author_login", { length: 255 }),
  body: text("body"),
  isAssignmentRequest: boolean("is_assignment_request").default(false),
  isMaintainerResponse: boolean("is_maintainer_response").default(false),
  createdAtGithub: timestamp("created_at_github", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type IssueComment = typeof issueComments.$inferSelect;
export type NewIssueComment = typeof issueComments.$inferInsert;
