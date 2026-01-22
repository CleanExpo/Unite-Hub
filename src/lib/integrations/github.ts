/**
 * GitHub Integration Client
 *
 * Provides GitHub App authentication and API access for repository management.
 * Supports connecting all user repos for unified management.
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// ============================================================================
// Types
// ============================================================================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  html_url: string;
  clone_url: string;
  language: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface GitHubPullRequest extends GitHubIssue {
  merged_at: string | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  draft: boolean;
  mergeable: boolean | null;
}

export interface RepoStats {
  commits_count: number;
  prs_open: number;
  prs_merged: number;
  issues_open: number;
  issues_closed: number;
  contributors_active: number;
}

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_APP_PRIVATE_KEY = process.env.GITHUB_APP_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// ============================================================================
// GitHub App Client
// ============================================================================

/**
 * Create authenticated Octokit client for GitHub App installation
 *
 * @param installationId - GitHub App installation ID
 * @returns Authenticated Octokit instance
 */
export function createGitHubAppClient(installationId: number): Octokit {
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new Error(
      "GitHub App credentials not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY."
    );
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: GITHUB_APP_ID,
      privateKey: GITHUB_APP_PRIVATE_KEY,
      installationId,
    },
  });
}

/**
 * Create Octokit client with personal access token
 *
 * @param accessToken - GitHub personal access token or OAuth token
 * @returns Authenticated Octokit instance
 */
export function createGitHubOAuthClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

// ============================================================================
// OAuth Flow Helpers
// ============================================================================

/**
 * Get GitHub OAuth authorization URL
 *
 * @param state - State parameter for CSRF protection
 * @param redirectUri - Callback URL after authorization
 * @returns Authorization URL
 */
export function getOAuthAuthorizationUrl(
  state: string,
  redirectUri: string
): string {
  if (!GITHUB_CLIENT_ID) {
    throw new Error("GITHUB_CLIENT_ID not configured");
  }

  const scopes = ["repo", "read:user", "read:org"].join(" ");

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 *
 * @param code - Authorization code from callback
 * @returns Access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    throw new Error("GitHub OAuth credentials not configured");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description}`);
  }

  return data.access_token;
}

// ============================================================================
// Repository Operations
// ============================================================================

/**
 * List all repositories accessible to the authenticated user
 *
 * @param octokit - Authenticated Octokit client
 * @returns Array of repositories
 */
export async function listUserRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];

  // Paginate through all repos
  for await (const response of octokit.paginate.iterator(
    octokit.rest.repos.listForAuthenticatedUser,
    {
      per_page: 100,
      sort: "updated",
      direction: "desc",
    }
  )) {
    repos.push(...(response.data as GitHubRepo[]));
  }

  return repos;
}

/**
 * Get repository details
 *
 * @param octokit - Authenticated Octokit client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Repository details
 */
export async function getRepo(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const response = await octokit.rest.repos.get({ owner, repo });
  return response.data as GitHubRepo;
}

/**
 * List repository issues
 *
 * @param octokit - Authenticated Octokit client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - Issue state filter
 * @returns Array of issues
 */
export async function listRepoIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];

  for await (const response of octokit.paginate.iterator(
    octokit.rest.issues.listForRepo,
    {
      owner,
      repo,
      state,
      per_page: 100,
    }
  )) {
    // Filter out pull requests (they appear in issues endpoint)
    const filteredIssues = response.data.filter(
      (issue: any) => !issue.pull_request
    );
    issues.push(...(filteredIssues as GitHubIssue[]));
  }

  return issues;
}

/**
 * List repository pull requests
 *
 * @param octokit - Authenticated Octokit client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - PR state filter
 * @returns Array of pull requests
 */
export async function listRepoPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubPullRequest[]> {
  const prs: GitHubPullRequest[] = [];

  for await (const response of octokit.paginate.iterator(
    octokit.rest.pulls.list,
    {
      owner,
      repo,
      state,
      per_page: 100,
    }
  )) {
    prs.push(...(response.data as GitHubPullRequest[]));
  }

  return prs;
}

/**
 * Get repository statistics for a date range
 *
 * @param octokit - Authenticated Octokit client
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param since - Start date (ISO string)
 * @returns Repository statistics
 */
export async function getRepoStats(
  octokit: Octokit,
  owner: string,
  repo: string,
  since?: string
): Promise<RepoStats> {
  const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get commits count
  const commits = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since: sinceDate,
    per_page: 1,
  });
  const commitsCount = parseInt(
    commits.headers.link?.match(/page=(\d+)>; rel="last"/)?.[1] || "0"
  );

  // Get open PRs
  const openPRs = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: 1,
  });
  const prsOpen = parseInt(
    openPRs.headers.link?.match(/page=(\d+)>; rel="last"/)?.[1] || String(openPRs.data.length)
  );

  // Get merged PRs
  const closedPRs = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "closed",
    per_page: 100,
  });
  const prsMerged = closedPRs.data.filter((pr: any) => pr.merged_at).length;

  // Get open issues
  const openIssues = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 1,
  });
  const issuesOpen = parseInt(
    openIssues.headers.link?.match(/page=(\d+)>; rel="last"/)?.[1] || String(openIssues.data.length)
  );

  // Get closed issues
  const closedIssues = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "closed",
    since: sinceDate,
    per_page: 1,
  });
  const issuesClosed = parseInt(
    closedIssues.headers.link?.match(/page=(\d+)>; rel="last"/)?.[1] || String(closedIssues.data.length)
  );

  // Get contributors
  const contributors = await octokit.rest.repos.listContributors({
    owner,
    repo,
    per_page: 100,
  });

  return {
    commits_count: commitsCount,
    prs_open: prsOpen,
    prs_merged: prsMerged,
    issues_open: issuesOpen,
    issues_closed: issuesClosed,
    contributors_active: contributors.data.length,
  };
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify GitHub webhook signature
 *
 * @param payload - Raw webhook payload
 * @param signature - X-Hub-Signature-256 header
 * @param secret - Webhook secret
 * @returns True if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const crypto = await import("crypto");

  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
