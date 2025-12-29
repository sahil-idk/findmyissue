import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issues, repositories, organizations } from "@/db/schema";
import { desc, eq, and, lte, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationSlug = searchParams.get("organization");
    const maxJamFactor = searchParams.get("maxJamFactor");
    const minScore = searchParams.get("minScore");
    const difficulty = searchParams.get("difficulty");
    const hasBeginnerLabel = searchParams.get("hasBeginnerLabel");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(issues.state, "open")];

    if (maxJamFactor) {
      conditions.push(lte(issues.jamFactor, maxJamFactor));
    }

    if (minScore) {
      conditions.push(gte(issues.opportunityScore, minScore));
    }

    if (difficulty) {
      conditions.push(eq(issues.difficulty, difficulty));
    }

    if (hasBeginnerLabel === "true") {
      conditions.push(eq(issues.hasBeginnerLabel, true));
    }

    // Add organization filter to conditions if specified
    if (organizationSlug) {
      conditions.push(eq(organizations.slug, organizationSlug));
    }

    // Query with joins
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

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(issues)
      .where(and(...conditions));
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      data: issuesList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
