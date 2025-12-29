import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LongevityBadge } from "@/components/shared/longevity-badge";
import { TechnologyBadge } from "@/components/shared/technology-badge";
import type { Organization } from "@/db/schema";

interface OrganizationCardProps {
  organization: Organization;
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const technologies = (organization.technologies as string[]) || [];
  const yearsParticipated = (organization.yearsParticipated as number[]) || [];

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg">
      <CardHeader className="flex-row gap-4 space-y-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={organization.logoUrl || undefined} alt={organization.name} />
          <AvatarFallback>
            {organization.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="line-clamp-1 text-lg">
            {organization.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {organization.longevityBadge && (
              <LongevityBadge
                badge={organization.longevityBadge}
                years={organization.longevityYears || undefined}
                size="sm"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <CardDescription className="line-clamp-3">
          {organization.description || "No description available"}
        </CardDescription>

        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {technologies.slice(0, 5).map((tech) => (
              <TechnologyBadge key={tech} technology={tech} size="sm" />
            ))}
            {technologies.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{technologies.length - 5} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {yearsParticipated.length > 0
              ? `${yearsParticipated.length} years in GSoC`
              : "GSoC Participant"}
          </span>
          {organization.totalOpenIssues !== null &&
            organization.totalOpenIssues > 0 && (
              <span className="font-medium text-green-600">
                {organization.totalOpenIssues} open issues
              </span>
            )}
        </div>

        <div className="flex gap-2">
          <Link href={`/organizations/${organization.slug}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {organization.githubUrl && (
            <a
              href={organization.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
