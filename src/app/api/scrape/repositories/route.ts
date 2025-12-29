import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, repositories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGitHubClient } from "@/lib/github/client";

export async function POST() {
  try {
    const octokit = createGitHubClient();

    // Fetch all organizations from database
    const orgs = await db.query.organizations.findMany();

    if (orgs.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No organizations found. Please run organization scraper first.",
      }, { status: 400 });
    }

    let totalRepos = 0;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each organization
    for (const org of orgs) {
      try {
        // Extract GitHub org name from URL
        // URLs can be like: https://github.com/apache or github.com/apache
        if (!org.githubUrl) {
          console.log(`Skipping ${org.name} - no GitHub URL`);
          skipped++;
          continue;
        }

        const githubOrgMatch = org.githubUrl.match(/github\.com\/([^\/\s]+)/i);
        if (!githubOrgMatch) {
          console.log(`Skipping ${org.name} - invalid GitHub URL: ${org.githubUrl}`);
          skipped++;
          continue;
        }

        const githubOrgName = githubOrgMatch[1];
        console.log(`Fetching repos for ${org.name} (${githubOrgName})...`);

        // Fetch repos from GitHub API
        const { data: reposList } = await octokit.rest.repos.listForOrg({
          org: githubOrgName,
          type: "public",
          per_page: 100,
          sort: "updated",
        });

        // Filter active repos (not archived, pushed in last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const activeRepos = reposList.filter(repo => {
          if (repo.archived || repo.disabled) return false;
          if (!repo.pushed_at) return false;

          const lastPush = new Date(repo.pushed_at);
          return lastPush >= sixMonthsAgo;
        });

        console.log(`Found ${activeRepos.length} active repos for ${org.name}`);

        // Upsert each repository
        for (const repo of activeRepos) {
          const existing = await db.query.repositories.findFirst({
            where: eq(repositories.githubId, repo.id),
          });

          const repoData = {
            organizationId: org.id,
            githubId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description || "",
            htmlUrl: repo.html_url,
            starsCount: repo.stargazers_count || 0,
            forksCount: repo.forks_count || 0,
            openIssuesCount: repo.open_issues_count || 0,
            watchersCount: repo.watchers_count || 0,
            primaryLanguage: repo.language || null,
            topics: repo.topics || [],
            lastPushAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          };

          if (existing) {
            await db
              .update(repositories)
              .set(repoData)
              .where(eq(repositories.id, existing.id));
            updated++;
          } else {
            await db.insert(repositories).values({
              ...repoData,
              createdAt: new Date(),
            });
            added++;
          }
        }

        totalRepos += activeRepos.length;

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMsg = `Error processing ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${totalRepos} repositories from ${orgs.length} organizations. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`,
      stats: {
        organizations: orgs.length,
        totalRepos,
        added,
        updated,
        skipped,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Repository scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
