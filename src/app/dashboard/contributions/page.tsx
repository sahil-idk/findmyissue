import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, contributions, organizations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getUserContributions(userId: number) {
  const contributionsList = await db
    .select({
      contribution: contributions,
      organization: organizations,
    })
    .from(contributions)
    .leftJoin(organizations, eq(contributions.organizationId, organizations.id))
    .where(eq(contributions.userId, userId))
    .orderBy(desc(contributions.submittedAt));

  return contributionsList;
}

function formatDate(date: Date | null): string {
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusBadge(state: string | null) {
  switch (state) {
    case "merged":
      return <Badge className="bg-purple-500">Merged</Badge>;
    case "open":
      return <Badge className="bg-green-500">Open</Badge>;
    case "closed":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export default async function ContributionsPage() {
  const session = await auth();

  const sessionWithId = session as unknown as { githubId?: number };
  const githubId = sessionWithId?.githubId;
  if (!githubId) {
    return null;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.githubId, githubId),
  });

  if (!dbUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">User not found</p>
        </CardContent>
      </Card>
    );
  }

  const contributionsList = await getUserContributions(dbUser.id);

  if (contributionsList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
          <CardDescription>
            Track your PRs and contributions to GSoC organizations
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            No contributions tracked yet. Start contributing to GSoC organizations!
          </p>
          <Link href="/issues">
            <Button>Find Issues to Work On</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Group by organization
  const byOrg = contributionsList.reduce(
    (acc, { contribution, organization }) => {
      const orgName = organization?.name || "Unknown Organization";
      if (!acc[orgName]) {
        acc[orgName] = [];
      }
      acc[orgName].push({ contribution, organization });
      return acc;
    },
    {} as Record<
      string,
      Array<{ contribution: typeof contributions.$inferSelect; organization: typeof organizations.$inferSelect | null }>
    >
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Contributions</h2>
        <p className="text-muted-foreground">
          {contributionsList.length} contribution
          {contributionsList.length !== 1 ? "s" : ""} across{" "}
          {Object.keys(byOrg).length} organization
          {Object.keys(byOrg).length !== 1 ? "s" : ""}
        </p>
      </div>

      {Object.entries(byOrg).map(([orgName, orgContributions]) => (
        <Card key={orgName}>
          <CardHeader>
            <CardTitle className="text-lg">{orgName}</CardTitle>
            <CardDescription>
              {orgContributions.length} contribution
              {orgContributions.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orgContributions.map(({ contribution }) => (
                <div
                  key={contribution.id}
                  className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {contribution.prUrl ? (
                        <a
                          href={contribution.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {contribution.prTitle || `PR #${contribution.prNumber}`}
                        </a>
                      ) : (
                        <span className="font-medium">
                          {contribution.prTitle || `PR #${contribution.prNumber}`}
                        </span>
                      )}
                      {getStatusBadge(contribution.prState)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {contribution.contributionType} - Submitted{" "}
                      {formatDate(contribution.submittedAt)}
                      {contribution.mergedAt && (
                        <>, merged {formatDate(contribution.mergedAt)}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
