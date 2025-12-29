import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

const GSOC_ORG_URL = "https://www.gsocorganizations.dev/";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseYears(yearText: string): number[] {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  const yearMatches = yearText.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    yearMatches.forEach((year) => {
      const y = parseInt(year, 10);
      if (y >= 2005 && y <= currentYear) {
        years.push(y);
      }
    });
  }
  return [...new Set(years)].sort((a, b) => a - b);
}

function calculateLongevityBadge(years: number): "newcomer" | "experienced" | "veteran" {
  if (years >= 7) return "veteran";
  if (years >= 3) return "experienced";
  return "newcomer";
}

export async function POST() {
  try {
    // Fetch the GSoC organizations page
    const response = await fetch(GSOC_ORG_URL, {
      headers: {
        "User-Agent": "GSoC-Finder-Bot/1.0 (Educational Purpose)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const orgs: Array<{
      name: string;
      slug: string;
      description: string;
      githubUrl?: string;
      websiteUrl?: string;
      technologies: string[];
      yearsParticipated: number[];
      category?: string;
      logoUrl?: string;
    }> = [];

    // Parse organization cards using actual class names from gsocorganizations.dev
    $(".org-card-container").each((_, element) => {
      const card = $(element);

      // Extract organization name
      const name = card.find(".org-card-name-container").text().trim();
      if (!name || name.length < 2) return;

      // Extract description
      const description = card.find(".org-card-description-container").text().trim();

      // Extract category
      const category = card.find(".org-card-category-container").text().trim();

      // Extract logo URL from style attribute
      const logoDiv = card.find(".org-card-logo");
      const logoStyle = logoDiv.attr("style") || "";
      const logoMatch = logoStyle.match(/url\(["']?([^"')]+)["']?\)/);
      const logoUrl = logoMatch ? logoMatch[1] : undefined;

      // Extract technologies
      const technologies: string[] = [];
      card.find(".org-card-technology").each((_, tag) => {
        const tech = $(tag).text().trim();
        if (tech && tech.length > 0) {
          technologies.push(tech);
        }
      });

      // Extract years participated
      const years: number[] = [];
      card.find(".org-card-year").each((_, yearSpan) => {
        const yearText = $(yearSpan).text().trim();
        const year = parseInt(yearText, 10);
        if (year >= 2005 && year <= new Date().getFullYear()) {
          years.push(year);
        }
      });

      // Get the organization slug from the parent link
      const parentLink = card.parent("a");
      const orgPath = parentLink.attr("href") || "";
      const slugMatch = orgPath.match(/\/organization\/([^/]+)/);
      const slug = slugMatch ? slugMatch[1] : generateSlug(name);

      // For now, we don't have direct GitHub/Website URLs from the listing page
      // These can be scraped from individual org pages later if needed

      orgs.push({
        name,
        slug,
        description: description.slice(0, 1000),
        technologies,
        yearsParticipated: years,
        category,
        logoUrl,
      });
    });

    // Upsert organizations
    let added = 0;
    let updated = 0;

    for (const org of orgs) {
      const existing = await db.query.organizations.findFirst({
        where: eq(organizations.slug, org.slug),
      });

      const longevityYears = org.yearsParticipated.length;
      const longevityBadge = calculateLongevityBadge(longevityYears);

      if (existing) {
        await db
          .update(organizations)
          .set({
            name: org.name,
            description: org.description,
            logoUrl: org.logoUrl,
            technologies: org.technologies,
            yearsParticipated: org.yearsParticipated,
            longevityYears,
            longevityBadge,
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(organizations.slug, org.slug));
        updated++;
      } else {
        await db.insert(organizations).values({
          slug: org.slug,
          name: org.name,
          description: org.description,
          logoUrl: org.logoUrl,
          technologies: org.technologies,
          yearsParticipated: org.yearsParticipated,
          longevityYears,
          longevityBadge,
          lastScrapedAt: new Date(),
        });
        added++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${orgs.length} organizations. Added: ${added}, Updated: ${updated}`,
      stats: { total: orgs.length, added, updated },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
