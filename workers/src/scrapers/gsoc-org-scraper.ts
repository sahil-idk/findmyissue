import * as cheerio from "cheerio";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateLongevityBadge } from "../analyzers/opportunity-score";

const GSOC_ORG_URL = "https://www.gsocorganizations.dev/";

interface ParsedOrganization {
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  ideasPageUrl?: string;
  technologies: string[];
  categories: string[];
  yearsParticipated: number[];
  topicTags: string[];
}

/**
 * Generate a URL-friendly slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse year string like "2020, 2021, 2022" or "2020-2022"
 */
function parseYears(yearText: string): number[] {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();

  // Match individual years
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

/**
 * Extract GitHub org URL from various link formats
 */
function extractGitHubUrl(links: string[]): string | undefined {
  for (const link of links) {
    const match = link.match(/github\.com\/([^\/]+)/i);
    if (match) {
      return `https://github.com/${match[1]}`;
    }
  }
  return undefined;
}

/**
 * Scrape organizations from gsocorganizations.dev
 */
export async function scrapeGsocOrganizations(): Promise<ParsedOrganization[]> {
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
  const orgs: ParsedOrganization[] = [];

  // Parse organization cards - adjust selectors based on actual site structure
  // This is a template - actual selectors need to be adjusted after inspecting the site
  $(".card, .org-card, [data-org], .organization").each((_, element) => {
    const card = $(element);

    const name = card.find(".header, .title, .org-name, h3, h4").first().text().trim();
    if (!name) return;

    const description = card
      .find(".description, .content, .org-description, p")
      .first()
      .text()
      .trim();

    // Get all links
    const links: string[] = [];
    card.find("a").each((_, a) => {
      const href = $(a).attr("href");
      if (href) links.push(href);
    });

    // Get technologies
    const technologies: string[] = [];
    card.find(".tech, .technology, .tag, .label").each((_, tag) => {
      const tech = $(tag).text().trim();
      if (tech && tech.length < 30) technologies.push(tech);
    });

    // Get years
    const yearsText = card.find(".years, .year, .participated").text();
    const years = parseYears(yearsText);

    orgs.push({
      name,
      slug: generateSlug(name),
      description: description.slice(0, 1000),
      githubUrl: extractGitHubUrl(links),
      websiteUrl: links.find(
        (l) => !l.includes("github.com") && l.startsWith("http")
      ),
      technologies: technologies.slice(0, 20),
      categories: [],
      yearsParticipated: years,
      topicTags: [],
    });
  });

  return orgs;
}

/**
 * Upsert organizations into the database
 */
export async function upsertOrganizations(
  orgs: ParsedOrganization[]
): Promise<{ added: number; updated: number }> {
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
          websiteUrl: org.websiteUrl,
          githubUrl: org.githubUrl,
          ideasPageUrl: org.ideasPageUrl,
          technologies: org.technologies,
          categories: org.categories,
          yearsParticipated: org.yearsParticipated,
          topicTags: org.topicTags,
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
        websiteUrl: org.websiteUrl,
        githubUrl: org.githubUrl,
        ideasPageUrl: org.ideasPageUrl,
        technologies: org.technologies,
        categories: org.categories,
        yearsParticipated: org.yearsParticipated,
        topicTags: org.topicTags,
        longevityYears,
        longevityBadge,
        lastScrapedAt: new Date(),
      });
      added++;
    }
  }

  return { added, updated };
}

/**
 * Main scrape function
 */
export async function runOrganizationScrape(): Promise<{
  success: boolean;
  added: number;
  updated: number;
  error?: string;
}> {
  try {
    console.log("Starting GSoC organization scrape...");
    const orgs = await scrapeGsocOrganizations();
    console.log(`Found ${orgs.length} organizations`);

    const result = await upsertOrganizations(orgs);
    console.log(`Added: ${result.added}, Updated: ${result.updated}`);

    return { success: true, ...result };
  } catch (error) {
    console.error("Scrape failed:", error);
    return {
      success: false,
      added: 0,
      updated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
