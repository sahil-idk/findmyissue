import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";

const ThrottledOctokit = Octokit.plugin(throttling, retry);

export function createGitHubClient(token?: string) {
  return new ThrottledOctokit({
    auth: token || process.env.GITHUB_TOKEN,
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Rate limit hit for ${(options as { url: string }).url}`
        );
        if (retryCount < 3) {
          octokit.log.info(`Retrying after ${retryAfter} seconds`);
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `Secondary rate limit for ${(options as { url: string }).url}`
        );
        return true;
      },
    },
  });
}

// Target labels for GSoC-friendly issues
export const TARGET_LABELS = [
  "good first issue",
  "good-first-issue",
  "help wanted",
  "help-wanted",
  "beginner",
  "beginner-friendly",
  "easy",
  "starter",
  "gsoc",
  "hacktoberfest",
  "first-timers-only",
  "up-for-grabs",
];

// Fetch all open issues with target labels from a repo
export async function fetchRepoIssues(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  const issues = [];

  for await (const response of octokit.paginate.iterator(
    octokit.rest.issues.listForRepo,
    {
      owner,
      repo,
      state: "open",
      per_page: 100,
    }
  )) {
    // Filter for issues with target labels (not PRs)
    const filteredIssues = response.data.filter((issue) => {
      if ("pull_request" in issue && issue.pull_request) return false;
      const issueLabels = issue.labels.map((l) =>
        typeof l === "string" ? l.toLowerCase() : l.name?.toLowerCase() || ""
      );
      return TARGET_LABELS.some((targetLabel) =>
        issueLabels.some((label) => label.includes(targetLabel.toLowerCase()))
      );
    });
    issues.push(...filteredIssues);
  }

  return issues;
}

// Fetch comments for an issue
export async function fetchIssueComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
) {
  const comments = [];

  for await (const response of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    {
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
    }
  )) {
    comments.push(...response.data);
  }

  return comments;
}

// Fetch all repos from an org
export async function fetchOrgRepos(octokit: Octokit, org: string) {
  const repos = [];

  for await (const response of octokit.paginate.iterator(
    octokit.rest.repos.listForOrg,
    {
      org,
      type: "public",
      per_page: 100,
    }
  )) {
    // Filter out archived and disabled repos
    const activeRepos = response.data.filter(
      (repo) => !repo.archived && !repo.disabled
    );
    repos.push(...activeRepos);
  }

  return repos;
}
