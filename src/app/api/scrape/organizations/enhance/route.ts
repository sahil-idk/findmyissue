import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://www.gsocorganizations.dev";

/**
 * Enhance organizations with GitHub/Website URLs by visiting individual org pages
 * Run this after the initial organization scrape
 */
export async function POST() {
  try {
    // Fetch all organizations without GitHub URLs
    const orgs = await db.query.organizations.findMany();

    if (orgs.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No organizations found. Please run organization scraper first.",
      }, { status: 400 });
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const org of orgs) {
      try {
        // Visit organization detail page
        const orgUrl = `${BASE_URL}/organization/${org.slug}/`;
        console.log(`Fetching details for ${org.name} from ${orgUrl}`);

        const response = await fetch(orgUrl, {
          headers: {
            "User-Agent": "GSoC-Finder-Bot/1.0 (Educational Purpose)",
          },
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${org.name}: ${response.status}`);
          failed++;
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract GitHub URL and Website URL from links
        let githubUrl: string | null = null;
        let websiteUrl: string | null = null;
        let ideasPageUrl: string | null = null;

        $("a[href]").each((_, element) => {
          const href = $(element).attr("href");
          if (!href) return;

          if (href.includes("github.com") && !githubUrl) {
            githubUrl = href.startsWith("http") ? href : `https://${href}`;
          } else if (href.includes("gsocorganizations.dev/ideas") && !ideasPageUrl) {
            ideasPageUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          } else if (
            href.startsWith("http") &&
            !href.includes("github.com") &&
            !href.includes("gsocorganizations.dev") &&
            !href.includes("google.com") &&
            !websiteUrl
          ) {
            websiteUrl = href;
          }
        });

        // Update organization with URLs
        if (githubUrl || websiteUrl || ideasPageUrl) {
          await db
            .update(organizations)
            .set({
              githubUrl: githubUrl || org.githubUrl,
              websiteUrl: websiteUrl || org.websiteUrl,
              ideasPageUrl: ideasPageUrl || org.ideasPageUrl,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, org.id));

          console.log(`Updated ${org.name}: GitHub=${githubUrl}, Website=${websiteUrl}`);
          updated++;
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMsg = `Error processing ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enhanced ${updated} organizations with URLs. Failed: ${failed}`,
      stats: {
        total: orgs.length,
        updated,
        failed,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });

  } catch (error) {
    console.error("Enhance scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
