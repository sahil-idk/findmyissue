import { Suspense } from "react";
import { db } from "@/db";
import { issues, repositories, organizations } from "@/db/schema";
import { desc, eq, sql, and, lte, gte } from "drizzle-orm";
import { IssueCard } from "@/components/issues/issue-card";
import { IssueFilters } from "@/components/issues/issue-filters";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  search?: string;
  organization?: string;
  maxJamFactor?: string;
  minScore?: string;
  difficulty?: string;
  hasBeginnerLabel?: string;
  page?: string;
}

async function getIssues(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Build conditions array
  const conditions = [eq(issues.state, "open")];

  // Filter by max jam factor
  if (searchParams.maxJamFactor) {
    conditions.push(
      lte(issues.jamFactor, searchParams.maxJamFactor)
    );
  }

  // Filter by min opportunity score
  if (searchParams.minScore) {
    conditions.push(
      gte(issues.opportunityScore, searchParams.minScore)
    );
  }

  // Filter by difficulty
  if (searchParams.difficulty) {
    conditions.push(eq(issues.difficulty, searchParams.difficulty));
  }

  // Filter by beginner label
  if (searchParams.hasBeginnerLabel === "true") {
    conditions.push(eq(issues.hasBeginnerLabel, true));
  }

  // Query issues with repository and organization info
  const issuesList = await db
    .select({
      issue: issues,
      repository: repositories,
      organization: organizations,
    })
    .from(issues)
    .leftJoin(repositories, eq(issues.repositoryId, repositories.id))
    .leftJoin(organizations, eq(repositories.organizationId, organizations.id))
    .where(and(...conditions))
    .orderBy(desc(issues.opportunityScore), desc(issues.createdAtGithub))
    .limit(limit)
    .offset(offset);

  return issuesList;
}

async function getFilterOptions() {
  // Get unique organizations
  const orgs = await db
    .select({ slug: organizations.slug, name: organizations.name })
    .from(organizations)
    .orderBy(organizations.name);

  return { organizations: orgs };
}

function IssuesLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-lg" />
      ))}
    </div>
  );
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [issuesList, filterOptions] = await Promise.all([
    getIssues(params),
    getFilterOptions(),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Issues</h1>
        <p className="text-muted-foreground">
          Discover beginner-friendly issues with low competition across GSoC
          organizations
        </p>
      </div>

      <div className="mb-8">
        <IssueFilters organizations={filterOptions.organizations} />
      </div>

      <Suspense fallback={<IssuesLoading />}>
        {issuesList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              No issues found matching your criteria.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or check back later for new issues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {issuesList.map(({ issue, repository, organization }) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                repository={repository}
                organization={organization}
              />
            ))}
          </div>
        )}
      </Suspense>

      {issuesList.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {issuesList.length} issues
        </div>
      )}
    </div>
  );
}
