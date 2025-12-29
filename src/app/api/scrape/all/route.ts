import { NextResponse } from "next/server";

/**
 * Master scraper that runs the entire pipeline in sequence
 * WARNING: This can take several hours to complete!
 */
export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: Record<string, any> = {};
  const startTime = Date.now();

  try {
    console.log("🚀 Starting full scraping pipeline...");

    // Step 1: Scrape organizations (if not already done)
    console.log("\n📋 Step 1/6: Scraping organizations...");
    const orgResponse = await fetch(`${baseUrl}/api/scrape/organizations`, {
      method: "POST",
    });
    results.organizations = await orgResponse.json();
    console.log(`✅ Organizations: ${JSON.stringify(results.organizations.stats)}`);

    // Step 2: Enhance organizations with GitHub URLs
    console.log("\n🔗 Step 2/6: Enhancing organizations with GitHub URLs...");
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    const enhanceResponse = await fetch(`${baseUrl}/api/scrape/organizations/enhance`, {
      method: "POST",
    });
    results.enhance = await enhanceResponse.json();
    console.log(`✅ Enhanced: ${JSON.stringify(results.enhance.stats)}`);

    // Step 3: Scrape repositories
    console.log("\n📦 Step 3/6: Scraping repositories from GitHub...");
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    const reposResponse = await fetch(`${baseUrl}/api/scrape/repositories`, {
      method: "POST",
    });
    results.repositories = await reposResponse.json();
    console.log(`✅ Repositories: ${JSON.stringify(results.repositories.stats)}`);

    // Step 4: Scrape issues
    console.log("\n🐛 Step 4/6: Scraping issues from repositories...");
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    const issuesResponse = await fetch(`${baseUrl}/api/scrape/issues`, {
      method: "POST",
    });
    results.issues = await issuesResponse.json();
    console.log(`✅ Issues: ${JSON.stringify(results.issues.stats)}`);

    // Step 5: Scrape comments (OPTIONAL - can be skipped for faster testing)
    console.log("\n💬 Step 5/6: Analyzing comments for jam factor...");
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    const commentsResponse = await fetch(`${baseUrl}/api/scrape/comments`, {
      method: "POST",
    });
    results.comments = await commentsResponse.json();
    console.log(`✅ Comments: ${JSON.stringify(results.comments.stats)}`);

    // Step 6: Calculate opportunity scores
    console.log("\n📊 Step 6/6: Calculating opportunity scores...");
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
    const analyzeResponse = await fetch(`${baseUrl}/api/scrape/analyze`, {
      method: "POST",
    });
    results.analyze = await analyzeResponse.json();
    console.log(`✅ Analysis: ${JSON.stringify(results.analyze.stats)}`);

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✨ Pipeline completed in ${totalTime} seconds!`);

    return NextResponse.json({
      success: true,
      message: `Full scraping pipeline completed successfully in ${totalTime} seconds`,
      duration: totalTime,
      results,
    });

  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        partialResults: results,
      },
      { status: 500 }
    );
  }
}
