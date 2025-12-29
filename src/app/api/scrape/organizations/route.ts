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
    }> = [];

    // Parse organization cards - selectors may need adjustment based on actual site structure
    $(".card, .org-card, [data-org], .organization, .ui.card").each((_, element) => {
      const card = $(element);
      const name = card.find(".header, .title, .org-name, h3, h4, .content .header").first().text().trim();

      if (!name || name.length < 2) return;

      const description = card.find(".description, .content, .org-description, .meta, p").first().text().trim();

      const links: string[] = [];
      card.find("a").each((_, a) => {
        const href = $(a).attr("href");
        if (href) links.push(href);
      });

      const technologies: string[] = [];
      card.find(".tech, .technology, .tag, .label, .ui.label").each((_, tag) => {
        const tech = $(tag).text().trim();
        if (tech && tech.length < 30 && tech.length > 1) technologies.push(tech);
      });

      const yearsText = card.text();
      const years = parseYears(yearsText);

      const githubUrl = links.find((l) => l.includes("github.com"));
      const websiteUrl = links.find((l) => !l.includes("github.com") && l.startsWith("http"));

      orgs.push({
        name,
        slug: generateSlug(name),
        description: description.slice(0, 1000),
        githubUrl,
        websiteUrl,
        technologies: technologies.slice(0, 20),
        yearsParticipated: years,
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
            githubUrl: org.githubUrl,
            websiteUrl: org.websiteUrl,
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
          githubUrl: org.githubUrl,
          websiteUrl: org.websiteUrl,
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
