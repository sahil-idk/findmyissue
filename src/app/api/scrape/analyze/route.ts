import { NextResponse } from "next/server";
import { db } from "@/db";
import { issues } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateOpportunityScore,
  calculateFreshnessScore,
  calculateRepoActivityScore,
} from "@/workers/src/analyzers/opportunity-score";

export async function POST() {
  try {
    // Fetch all open issues with their repositories and organizations
    const openIssues = await db.query.issues.findMany({
      where: eq(issues.state, "open"),
      with: {
        repository: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (openIssues.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No issues found. Please run issues scraper first.",
      }, { status: 400 });
    }

    let analyzed = 0;
    const errors: string[] = [];

    console.log(`Analyzing ${openIssues.length} issues for opportunity scores...`);

    // Process each issue
    for (const issue of openIssues) {
      try {
        if (!issue.repository || !issue.repository.organization) {
          console.log(`Skipping issue #${issue.number} - missing repo or org data`);
          continue;
        }

        const repo = issue.repository;
        const org = issue.repository.organization;

        // Calculate freshness score (based on creation date)
        const freshnessScore = calculateFreshnessScore(issue.createdAtGithub || new Date());

        // Calculate repo activity score
        const repoActivityScore = calculateRepoActivityScore(
          repo.lastPushAt,
          repo.commitsLastMonth || 0,
          repo.starsCount || 0
        );

        // Get jam factor (already calculated from comments, default to 0 if not set)
        const jamFactor = parseFloat(issue.jamFactor || "0");

        // Calculate opportunity score
        const opportunityScore = calculateOpportunityScore({
          jamFactor,
          freshnessScore,
          repoActivityScore,
          orgLongevityYears: org.longevityYears || 0,
          maintainerResponseHours: parseFloat(org.avgMaintainerResponseHours || "24"),
          hasBeginnerLabel: issue.hasBeginnerLabel || false,
        });

        // Determine difficulty based on labels and issue characteristics
        let difficulty: "beginner" | "intermediate" | "advanced" = "intermediate";
        if (issue.hasBeginnerLabel) {
          difficulty = "beginner";
        } else if (issue.commentsCount > 10 || (issue.body?.length || 0) > 1000) {
          difficulty = "advanced";
        }

        // Update issue with scores
        await db
          .update(issues)
          .set({
            freshnessScore: freshnessScore.toString(),
            opportunityScore: opportunityScore.toString(),
            difficulty,
            lastAnalyzedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(issues.id, issue.id));

        analyzed++;

        if (analyzed % 100 === 0) {
          console.log(`Analyzed ${analyzed}/${openIssues.length} issues...`);
        }

      } catch (error) {
        const errorMsg = `Error analyzing issue #${issue.number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Calculate average scores for summary
    const allScores = await db.query.issues.findMany({
      where: eq(issues.state, "open"),
      columns: {
        opportunityScore: true,
        jamFactor: true,
        freshnessScore: true,
      },
    });

    const avgOpportunity = allScores.reduce((sum, i) => sum + parseFloat(i.opportunityScore || "0"), 0) / allScores.length;
    const avgJam = allScores.reduce((sum, i) => sum + parseFloat(i.jamFactor || "0"), 0) / allScores.length;
    const avgFreshness = allScores.reduce((sum, i) => sum + parseFloat(i.freshnessScore || "0"), 0) / allScores.length;

    return NextResponse.json({
      success: true,
      message: `Analyzed ${analyzed} issues successfully.`,
      stats: {
        total: openIssues.length,
        analyzed,
        errors: errors.length,
        averages: {
          opportunityScore: Math.round(avgOpportunity * 100) / 100,
          jamFactor: Math.round(avgJam * 100) / 100,
          freshnessScore: Math.round(avgFreshness * 100) / 100,
        },
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
