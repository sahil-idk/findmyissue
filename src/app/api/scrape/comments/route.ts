import { NextResponse } from "next/server";
import { db } from "@/db";
import { issues, issueComments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGitHubClient } from "@/lib/github/client";
import { analyzeCommentsForJamFactor } from "@/workers/src/analyzers/jam-factor";

export async function POST() {
  try {
    const octokit = createGitHubClient();

    // Fetch all open issues from database
    const openIssues = await db.query.issues.findMany({
      where: eq(issues.state, "open"),
      with: {
        repository: true,
      },
    });

    if (openIssues.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No issues found. Please run issues scraper first.",
      }, { status: 400 });
    }

    let totalComments = 0;
    let assignmentRequests = 0;
    let issuesAnalyzed = 0;
    const errors: string[] = [];

    console.log(`Analyzing ${openIssues.length} issues for comments...`);

    // Process each issue
    for (const issue of openIssues) {
      try {
        if (!issue.repository) continue;

        const [owner, repoName] = issue.repository.fullName.split("/");
        if (!owner || !repoName) continue;

        // Skip if issue has no comments
        if (issue.commentsCount === 0) {
          console.log(`Skipping ${issue.repository.fullName}#${issue.number} - no comments`);
          continue;
        }

        console.log(`Fetching comments for ${issue.repository.fullName}#${issue.number}...`);

        // Fetch comments from GitHub API
        const { data: commentsList } = await octokit.rest.issues.listComments({
          owner,
          repo: repoName,
          issue_number: issue.number,
          per_page: 100,
        });

        // Store comments and analyze for assignment requests
        const commentsForAnalysis: Array<{ body: string | null; authorLogin: string | null }> = [];

        for (const comment of commentsList) {
          // Check if comment already exists
          const existing = await db.query.issueComments.findFirst({
            where: eq(issueComments.githubId, comment.id),
          });

          const commentBody = comment.body || "";
          commentsForAnalysis.push({
            body: commentBody,
            authorLogin: comment.user?.login || null,
          });

          if (!existing) {
            await db.insert(issueComments).values({
              issueId: issue.id,
              githubId: comment.id,
              authorLogin: comment.user?.login || null,
              body: commentBody,
              createdAtGithub: comment.created_at ? new Date(comment.created_at) : new Date(),
              createdAt: new Date(),
            });
          }

          totalComments++;
        }

        // Analyze comments for jam factor
        const jamAnalysis = analyzeCommentsForJamFactor(commentsForAnalysis);
        assignmentRequests += jamAnalysis.assignmentRequests;

        // Update issue with jam factor
        await db
          .update(issues)
          .set({
            assignmentRequests: jamAnalysis.assignmentRequests,
            jamFactor: jamAnalysis.jamFactor.toString(),
            lastAnalyzedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(issues.id, issue.id));

        issuesAnalyzed++;

        console.log(
          `${issue.repository.fullName}#${issue.number}: ${jamAnalysis.assignmentRequests} requests, jam factor: ${jamAnalysis.jamFactor}`
        );

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMsg = `Error processing issue #${issue.number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Analyzed ${issuesAnalyzed} issues with ${totalComments} total comments. Found ${assignmentRequests} assignment requests.`,
      stats: {
        issuesAnalyzed,
        totalComments,
        assignmentRequests,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });

  } catch (error) {
    console.error("Comments scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
