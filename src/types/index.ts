import type {
  Organization,
  Repository,
  Issue,
  User,
  Bookmark,
  Contribution,
} from "@/db/schema";

// Jam factor levels
export type JamFactorLevel = "low" | "moderate" | "high" | "very_high";

// Difficulty levels
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// Longevity badges
export type LongevityBadge = "newcomer" | "experienced" | "veteran";

// Bookmark status
export type BookmarkStatus = "saved" | "interested" | "working" | "abandoned";

// Issue with full context (org + repo info)
export interface IssueWithContext extends Issue {
  repository: Repository;
  organization: Organization;
}

// Organization with stats
export interface OrganizationWithStats extends Organization {
  repositories?: Repository[];
  recentIssues?: Issue[];
  stats?: {
    totalRepos: number;
    totalOpenIssues: number;
    avgIssueScore: number;
    topLanguages: string[];
  };
}

// Bookmark with issue context
export interface BookmarkWithIssue extends Bookmark {
  issue: IssueWithContext;
}

// Contribution with context
export interface ContributionWithContext extends Contribution {
  organization?: Organization;
  repository?: Repository;
  issue?: Issue;
}

// User stats
export interface UserStats {
  bookmarksCount: number;
  contributionsCount: number;
  prsSubmitted: number;
  prsMerged: number;
  organizationsContributed: number;
}

// API response types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  error?: string;
}

// Filter types
export interface OrganizationFilters {
  search?: string;
  technologies?: string[];
  categories?: string[];
  longevityBadge?: LongevityBadge;
  minFriendlinessScore?: number;
  sortBy?: "longevity" | "friendliness" | "name" | "recentActivity";
  sortOrder?: "asc" | "desc";
}

export interface IssueFilters {
  organizationSlug?: string;
  technologies?: string[];
  labels?: string[];
  minOpportunityScore?: number;
  maxJamFactor?: number;
  difficulty?: DifficultyLevel;
  createdAfter?: string;
  hasBeginnerLabel?: boolean;
  sortBy?: "score" | "jamFactor" | "freshness" | "comments" | "created";
  sortOrder?: "asc" | "desc";
}

// Jam factor result from analysis
export interface JamFactorResult {
  assignmentRequests: number;
  uniqueRequesters: number;
  jamFactor: number;
  competitionLevel: JamFactorLevel;
}

// Opportunity score factors
export interface OpportunityScoreFactors {
  jamFactor: number;
  freshnessScore: number;
  repoActivityScore: number;
  orgLongevity: number;
  maintainerResponseTime: number;
  hasBeginnerLabel: boolean;
}

// Proposal generation request
export interface ProposalGenerateRequest {
  format: "markdown" | "text" | "html";
  sections: ("contributions" | "timeline" | "stats")[];
  organizationFilter?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Re-export DB types
export type {
  Organization,
  Repository,
  Issue,
  User,
  Bookmark,
  Contribution,
} from "@/db/schema";
