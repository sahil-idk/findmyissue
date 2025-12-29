// Patterns that indicate someone is requesting to work on an issue
const ASSIGNMENT_PATTERNS = [
  /can i (work on|take|do|handle|pick|tackle|attempt|try) this/i,
  /i('d| would) like to (work on|take|do|handle|attempt)/i,
  /please assign (this )?(to )?me/i,
  /assign (this )?(to )?me/i,
  /i('ll| will) (work on|take|do|handle) this/i,
  /can (this|it) be assigned to me/i,
  /is this (still )?(available|open|up for grabs)/i,
  /i('m| am) interested (in working on|to work on|in) this/i,
  /let me (work on|take|do|handle) this/i,
  /may i work on this/i,
  /i want to work on this/i,
  /i'd love to (work on|take|tackle) this/i,
  /can i claim this/i,
  /i'm claiming this/i,
  /can i be assigned/i,
  /assign this to me/i,
  /@\w+ (can you )?assign (this )?(to )?me/i,
];

export interface JamFactorResult {
  assignmentRequests: number;
  uniqueRequesters: number;
  jamFactor: number;
  competitionLevel: "low" | "moderate" | "high" | "very_high";
}

export interface CommentForAnalysis {
  body: string | null;
  authorLogin: string | null;
}

/**
 * Analyze issue comments to calculate the jam factor (competition level)
 */
export function analyzeCommentsForJamFactor(
  comments: CommentForAnalysis[]
): JamFactorResult {
  let assignmentRequests = 0;
  const requesters = new Set<string>();

  for (const comment of comments) {
    if (!comment.body) continue;

    const isAssignmentRequest = ASSIGNMENT_PATTERNS.some((pattern) =>
      pattern.test(comment.body!)
    );

    if (isAssignmentRequest) {
      assignmentRequests++;
      if (comment.authorLogin) {
        requesters.add(comment.authorLogin);
      }
    }
  }

  // Calculate jam factor on 0-10 scale
  // More unique requesters = higher competition
  const jamFactor = Math.min(10, requesters.size * 1.5 + assignmentRequests * 0.5);

  return {
    assignmentRequests,
    uniqueRequesters: requesters.size,
    jamFactor: Math.round(jamFactor * 100) / 100,
    competitionLevel: getCompetitionLevel(jamFactor),
  };
}

function getCompetitionLevel(
  jamFactor: number
): "low" | "moderate" | "high" | "very_high" {
  if (jamFactor <= 2) return "low";
  if (jamFactor <= 4) return "moderate";
  if (jamFactor <= 7) return "high";
  return "very_high";
}

/**
 * Get display information for jam factor
 */
export function getJamFactorDisplay(jamFactor: number): {
  emoji: string;
  label: string;
  color: string;
  description: string;
} {
  if (jamFactor <= 2) {
    return {
      emoji: "🟢",
      label: "Low",
      color: "green",
      description: "Great opportunity! Few competitors",
    };
  }
  if (jamFactor <= 4) {
    return {
      emoji: "🟡",
      label: "Moderate",
      color: "yellow",
      description: "Some competition, but manageable",
    };
  }
  if (jamFactor <= 7) {
    return {
      emoji: "🟠",
      label: "High",
      color: "orange",
      description: "Crowded - consider other options",
    };
  }
  return {
    emoji: "🔴",
    label: "Very High",
    color: "red",
    description: "Very crowded - avoid unless highly motivated",
  };
}
