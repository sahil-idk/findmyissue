import { Suspense } from "react";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { OrganizationCard } from "@/components/organizations/org-card";
import { OrganizationFilters } from "@/components/organizations/org-filters";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  search?: string;
  technology?: string;
  category?: string;
  longevity?: string;
  page?: string;
}

async function getOrganizations(searchParams: SearchParams) {
  // Build query with filters
  let query = db.select().from(organizations);

  // Apply search filter
  if (searchParams.search) {
    query = query.where(
      sql`${organizations.name} ILIKE ${`%${searchParams.search}%`} OR ${organizations.description} ILIKE ${`%${searchParams.search}%`}`
    ) as typeof query;
  }

  // Apply technology filter
  if (searchParams.technology) {
    query = query.where(
      sql`${organizations.technologies} @> ${JSON.stringify([searchParams.technology])}`
    ) as typeof query;
  }

  // Apply longevity filter
  if (searchParams.longevity) {
    query = query.where(
      sql`${organizations.longevityBadge} = ${searchParams.longevity}`
    ) as typeof query;
  }

  // Order by longevity and then name
  const orgs = await query
    .orderBy(desc(organizations.longevityYears), organizations.name)
    .limit(50);

  return orgs;
}

async function getTechnologies() {
  // Get unique technologies from all organizations
  const result = await db
    .select({ technologies: organizations.technologies })
    .from(organizations);

  const techSet = new Set<string>();
  result.forEach((row) => {
    if (row.technologies && Array.isArray(row.technologies)) {
      row.technologies.forEach((tech) => techSet.add(tech));
    }
  });

  return Array.from(techSet).sort();
}

function OrganizationsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-lg" />
      ))}
    </div>
  );
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [orgs, technologies] = await Promise.all([
    getOrganizations(params),
    getTechnologies(),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">GSoC Organizations</h1>
        <p className="text-muted-foreground">
          Discover {orgs.length > 0 ? orgs.length : "all"} organizations
          participating in Google Summer of Code
        </p>
      </div>

      <div className="mb-8">
        <OrganizationFilters technologies={technologies} />
      </div>

      <Suspense fallback={<OrganizationsLoading />}>
        {orgs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              No organizations found. Try adjusting your filters.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Or run the scraper to populate the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}
