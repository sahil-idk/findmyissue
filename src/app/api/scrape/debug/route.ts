import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const GSOC_ORG_URL = "https://www.gsocorganizations.dev/";

export async function GET() {
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

    // Debug info
    const debug = {
      url: GSOC_ORG_URL,
      htmlLength: html.length,
      titleTag: $("title").text(),
      bodyClasses: $("body").attr("class"),

      // Try different selectors
      selectors: {
        ".card": $(".card").length,
        ".org-card": $(".org-card").length,
        "[data-org]": $("[data-org]").length,
        ".organization": $(".organization").length,
        ".ui.card": $(".ui.card").length,
        "article": $("article").length,
        "[class*='org']": $("[class*='org']").length,
        "[class*='card']": $("[class*='card']").length,
        "div[class*='grid']": $("div[class*='grid']").length,
      },

      // Sample HTML snippets (first 3 potential org containers)
      samples: [] as string[],

      // All unique classes in body
      allClasses: new Set<string>(),
    };

    // Collect all classes
    $("*").each((_, el) => {
      const classes = $(el).attr("class");
      if (classes) {
        classes.split(" ").forEach(c => debug.allClasses.add(c));
      }
    });

    // Get sample HTML from different selectors
    const sampleSelectors = ["article", "div[class*='org']", "[class*='card']", "main > div", "section > div"];
    sampleSelectors.forEach(selector => {
      $(selector).slice(0, 2).each((_, el) => {
        const html = $.html(el);
        if (html.length > 50 && html.length < 2000) {
          debug.samples.push(html);
        }
      });
    });

    // Get main content area
    const mainContent = $("main, #main, .main, [role='main']").first().html()?.slice(0, 5000);

    return NextResponse.json({
      success: true,
      debug: {
        ...debug,
        allClasses: Array.from(debug.allClasses).sort(),
        mainContentSample: mainContent,
      },
    });
  } catch (error) {
    console.error("Debug scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
