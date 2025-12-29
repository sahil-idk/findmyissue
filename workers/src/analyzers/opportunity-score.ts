export interface OpportunityScoreFactors {
  jamFactor: number; // 0-10 (lower is better for opportunity)
  freshnessScore: number; // 0-10 (how recent)
  repoActivityScore: number; // 0-10 (active repo)
  orgLongevityYears: number; // years in GSoC
  maintainerResponseHours: number; // avg hours to first response
  hasBeginnerLabel: boolean;
}

// Weights for each factor (must sum to 1.0)
const WEIGHTS = {
  jamFactor: 0.25, // 25%
  freshness: 0.15, // 15%
  repoActivity: 0.15, // 15%
  orgLongevity: 0.2, // 20%
  maintainerResponse: 0.15, // 15%
  beginnerLabel: 0.1, // 10%
};

/**
 * Calculate the opportunity score for an issue
 * Higher score = better opportunity
 */
export function calculateOpportunityScore(
  factors: OpportunityScoreFactors
): number {
  // Invert jam factor (lower jam = higher opportunity)
  const jamScore = 10 - factors.jamFactor;

  // Normalize longevity (cap at 10 years)
  const longevityScore = Math.min(10, factors.orgLongevityYears);

  // Invert response time (faster = better)
  const responseScore = calculateResponseScore(factors.maintainerResponseHours);

  // Beginner label bonus
  const beginnerBonus = factors.hasBeginnerLabel ? 10 : 5;

  const score =
    jamScore * WEIGHTS.jamFactor +
    factors.freshnessScore * WEIGHTS.freshness +
    factors.repoActivityScore * WEIGHTS.repoActivity +
    longevityScore * WEIGHTS.orgLongevity +
    responseScore * WEIGHTS.maintainerResponse +
    beginnerBonus * WEIGHTS.beginnerLabel;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate freshness score based on issue creation date
 */
export function calculateFreshnessScore(createdAt: Date): number {
  const daysSinceCreation =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceCreation <= 7) return 10;
  if (daysSinceCreation <= 14) return 9;
  if (daysSinceCreation <= 30) return 8;
  if (daysSinceCreation <= 60) return 6;
  if (daysSinceCreation <= 90) return 4;
  if (daysSinceCreation <= 180) return 2;
  return 1;
}

/**
 * Calculate repo activity score
 */
export function calculateRepoActivityScore(
  lastPushAt: Date | null,
  commitsLastMonth: number,
  starsCount: number
): number {
  let score = 0;

  // Recent activity (last push)
  if (lastPushAt) {
    const daysSinceLastPush =
      (Date.now() - lastPushAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPush <= 7) score += 4;
    else if (daysSinceLastPush <= 30) score += 3;
    else if (daysSinceLastPush <= 90) score += 2;
    else score += 1;
  }

  // Commits last month
  if (commitsLastMonth >= 50) score += 3;
  else if (commitsLastMonth >= 20) score += 2;
  else if (commitsLastMonth >= 5) score += 1;

  // Stars (popularity indicator)
  if (starsCount >= 1000) score += 3;
  else if (starsCount >= 100) score += 2;
  else if (starsCount >= 10) score += 1;

  return Math.min(10, score);
}

/**
 * Calculate maintainer response score
 */
function calculateResponseScore(avgResponseHours: number): number {
  if (avgResponseHours <= 4) return 10;
  if (avgResponseHours <= 12) return 9;
  if (avgResponseHours <= 24) return 8;
  if (avgResponseHours <= 48) return 6;
  if (avgResponseHours <= 72) return 4;
  if (avgResponseHours <= 168) return 2; // 1 week
  return 1;
}

/**
 * Get display information for opportunity score
 */
export function getOpportunityScoreDisplay(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 8) {
    return {
      label: "Excellent",
      color: "green",
      description: "Highly recommended opportunity",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      color: "blue",
      description: "Solid opportunity worth considering",
    };
  }
  if (score >= 4) {
    return {
      label: "Fair",
      color: "yellow",
      description: "Decent opportunity, some concerns",
    };
  }
  return {
    label: "Low",
    color: "gray",
    description: "Consider looking for better options",
  };
}

/**
 * Calculate longevity badge based on years participated
 */
export function calculateLongevityBadge(
  years: number
): "newcomer" | "experienced" | "veteran" {
  if (years >= 7) return "veteran";
  if (years >= 3) return "experienced";
  return "newcomer";
}
