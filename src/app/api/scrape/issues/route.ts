import { NextResponse } from "next/server";
import { db } from "@/db";
import { repositories, issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGitHubClient, TARGET_LABELS } from "@/lib/github/client";

export async function POST() {
  try {
    const octokit = createGitHubClient();

    // Fetch all repositories from database
    const repos = await db.query.repositories.findMany({
      with: {
        organization: true,
      },
    });

    if (repos.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No repositories found. Please run repository scraper first.",
      }, { status: 400 });
    }

    let totalIssues = 0;
    let added = 0;
    let updated = 0;
    let closed = 0;
    const errors: string[] = [];

    console.log(`Processing ${repos.length} repositories...`);

    // Process each repository
    for (const repo of repos) {
      try {
        // Extract owner and repo name from full_name (e.g., "apache/kafka")
        const [owner, repoName] = repo.fullName.split("/");

        if (!owner || !repoName) {
          console.log(`Skipping invalid repo name: ${repo.fullName}`);
          continue;
        }

        console.log(`Fetching issues for ${repo.fullName}...`);

        // Fetch open issues from GitHub API
        const { data: issuesList } = await octokit.rest.issues.listForRepo({
          owner,
          repo: repoName,
          state: "open",
          per_page: 100,
          sort: "updated",
          direction: "desc",
        });

        // Filter issues (not PRs) with target labels
        const targetIssues = issuesList.filter(issue => {
          // Skip pull requests
          if ("pull_request" in issue && issue.pull_request) return false;

          // Check if issue has any target labels
          const issueLabels = issue.labels.map(l =>
            typeof l === "string" ? l.toLowerCase() : l.name?.toLowerCase() || ""
          );

          return TARGET_LABELS.some(targetLabel =>
            issueLabels.some(label => label.includes(targetLabel.toLowerCase()))
          );
        });

        console.log(`Found ${targetIssues.length} target issues for ${repo.fullName}`);

        // Upsert each issue
        for (const issue of targetIssues) {
          const existing = await db.query.issues.findFirst({
            where: eq(issues.githubId, issue.id),
          });

          // Extract labels
          const labels = issue.labels.map(l => ({
            name: typeof l === "string" ? l : l.name || "",
            color: typeof l === "string" ? "" : l.color || "",
          }));

          // Detect beginner-friendly labels
          const labelNames = labels.map(l => l.name.toLowerCase());
          const hasBeginnerLabel = TARGET_LABELS.some(target =>
            target.includes("good") || target.includes("first") || target.includes("beginner")
              ? labelNames.some(name => name.includes(target.toLowerCase()))
              : false
          );

          const hasHelpWantedLabel = labelNames.some(name =>
            name.includes("help") && name.includes("wanted")
          );

          const hasGsocLabel = labelNames.some(name =>
            name.includes("gsoc") || name.includes("google summer of code")
          );

          const issueData = {
            repositoryId: repo.id,
            githubId: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body || "",
            htmlUrl: issue.html_url,
            state: issue.state,
            labels,
            assignees: issue.assignees?.map(a => a.login) || [],
            authorLogin: issue.user?.login || null,
            authorAvatarUrl: issue.user?.avatar_url || null,
            commentsCount: issue.comments || 0,
            reactionsCount: issue.reactions?.total_count || 0,
            createdAtGithub: issue.created_at ? new Date(issue.created_at) : new Date(),
            updatedAtGithub: issue.updated_at ? new Date(issue.updated_at) : new Date(),
            hasBeginnerLabel,
            hasHelpWantedLabel,
            hasGsocLabel,
            updatedAt: new Date(),
          };

          if (existing) {
            // Update existing issue
            await db
              .update(issues)
              .set(issueData)
              .where(eq(issues.id, existing.id));
            updated++;
          } else {
            // Insert new issue
            await db.insert(issues).values({
              ...issueData,
              createdAt: new Date(),
            });
            added++;
          }
        }

        totalIssues += targetIssues.length;

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMsg = `Error processing ${repo.fullName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Mark closed issues that are no longer open
    // (This would require a more sophisticated approach - skipping for now)

    return NextResponse.json({
      success: true,
      message: `Scraped ${totalIssues} issues from ${repos.length} repositories. Added: ${added}, Updated: ${updated}`,
      stats: {
        repositories: repos.length,
        totalIssues,
        added,
        updated,
        closed,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });

  } catch (error) {
    console.error("Issues scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
