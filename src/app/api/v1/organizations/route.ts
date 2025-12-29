import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { desc, sql, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const technology = searchParams.get("technology");
    const longevity = searchParams.get("longevity");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = db.select().from(organizations);

    // Apply filters
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(organizations.name, `%${search}%`),
          ilike(organizations.description, `%${search}%`)
        )
      );
    }

    if (technology) {
      conditions.push(
        sql`${organizations.technologies} @> ${JSON.stringify([technology])}`
      );
    }

    if (longevity) {
      conditions.push(sql`${organizations.longevityBadge} = ${longevity}`);
    }

    if (conditions.length > 0) {
      query = query.where(sql`${conditions.map(c => sql`(${c})`).reduce((a, b) => sql`${a} AND ${b}`)}`) as typeof query;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations);
    const total = countResult[0]?.count || 0;

    // Get paginated results
    const orgs = await query
      .orderBy(desc(organizations.longevityYears), organizations.name)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: orgs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
