import {
  pgTable,
  serial,
  integer,
  bigint,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { issues } from "./issues";
import { repositories } from "./repositories";
import { organizations } from "./organizations";

export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  issueId: integer("issue_id").references(() => issues.id), // Optional link to tracked issue
  repositoryId: integer("repository_id").references(() => repositories.id),
  organizationId: integer("organization_id").references(() => organizations.id),

  // PR/Contribution details
  githubPrId: bigint("github_pr_id", { mode: "number" }),
  prNumber: integer("pr_number"),
  prTitle: varchar("pr_title", { length: 1000 }),
  prUrl: varchar("pr_url", { length: 1000 }),
  prState: varchar("pr_state", { length: 50 }), // "open", "merged", "closed"

  // Contribution type
  contributionType: varchar("contribution_type", { length: 50 }), // "pr", "issue", "review", "discussion"

  // Timestamps
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  mergedAt: timestamp("merged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;
