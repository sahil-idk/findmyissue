import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JamFactorBadge } from "@/components/shared/jam-factor-badge";
import { OpportunityScoreBadge } from "@/components/shared/opportunity-score-badge";
import { TechnologyBadge } from "@/components/shared/technology-badge";
import type { Issue, Repository, Organization } from "@/db/schema";

interface IssueCardProps {
  issue: Issue;
  repository: Repository | null;
  organization: Organization | null;
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

export function IssueCard({ issue, repository, organization }: IssueCardProps) {
  const labels = (issue.labels as Array<{ name: string; color: string }>) || [];

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">
              <a
                href={issue.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                {issue.title}
              </a>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {organization && (
                <Link
                  href={`/organizations/${organization.slug}`}
                  className="hover:underline"
                >
                  {organization.name}
                </Link>
              )}
              {repository && (
                <>
                  <span>/</span>
                  <a
                    href={repository.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {repository.name}
                  </a>
                </>
              )}
              <span className="text-muted-foreground">
                #{issue.number}
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {issue.opportunityScore && (
              <OpportunityScoreBadge
                score={parseFloat(issue.opportunityScore)}
              />
            )}
            {issue.jamFactor && (
              <JamFactorBadge jamFactor={parseFloat(issue.jamFactor)} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {issue.body && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {issue.body.slice(0, 200)}
            {issue.body.length > 200 && "..."}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 6).map((label) => (
            <Badge
              key={label.name}
              variant="outline"
              style={{
                backgroundColor: `#${label.color}20`,
                borderColor: `#${label.color}`,
                color: `#${label.color}`,
              }}
              className="text-xs"
            >
              {label.name}
            </Badge>
          ))}
          {labels.length > 6 && (
            <span className="text-xs text-muted-foreground">
              +{labels.length - 6} more
            </span>
          )}
        </div>

        {repository?.primaryLanguage && (
          <div className="flex items-center gap-2">
            <TechnologyBadge technology={repository.primaryLanguage} size="sm" />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {issue.commentsCount || 0} comments
            </span>
            {issue.assignmentRequests !== null && issue.assignmentRequests > 0 && (
              <span className="text-orange-600">
                {issue.assignmentRequests} assignment requests
              </span>
            )}
          </div>
          <span>
            Created {formatTimeAgo(issue.createdAtGithub)}
          </span>
        </div>

        <div className="flex gap-2">
          <a
            href={issue.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button className="w-full">Open in GitHub</Button>
          </a>
          <Button variant="outline" size="icon">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
