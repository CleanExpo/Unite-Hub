// src/lib/integrations/github.ts
// GitHub REST API client — used for creating branches and pull requests
// from Paperclip work packages that include createPR: true

const GITHUB_API = 'https://api.github.com'

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export function isGitHubConfigured(): boolean {
  return !!process.env.GITHUB_TOKEN
}

export interface CreatePRInput {
  owner?: string     // defaults to GITHUB_OWNER env var — e.g. 'phill-mcgurk'
  repo: string       // e.g. 'unite-group'
  title: string
  body: string
  head: string       // feature branch name (must exist before calling this)
  base?: string      // target branch — defaults to 'main'
}

export interface GitHubPR {
  id: number
  number: number
  html_url: string
  state: string
}

/**
 * Create a pull request. Throws if GitHub is not configured or the API call fails.
 */
export async function createPullRequest(input: CreatePRInput): Promise<GitHubPR> {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub not configured — GITHUB_TOKEN is missing')
  }

  const owner = input.owner ?? process.env.GITHUB_OWNER
  if (!owner) throw new Error('GitHub owner not configured — set GITHUB_OWNER env var or pass owner in CreatePRInput')

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${input.repo}/pulls`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base ?? 'main',
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(
      `GitHub create PR failed: ${response.status} ${response.statusText} — ${errText}`
    )
  }

  return response.json() as Promise<GitHubPR>
}

/**
 * Get the SHA of the HEAD commit on the default (main) branch.
 * Used as the base SHA when creating a new feature branch.
 */
export async function getDefaultBranchSha(owner: string, repo: string): Promise<string> {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub not configured — GITHUB_TOKEN is missing')
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/main`,
    { headers: authHeaders() }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`GitHub get SHA failed: ${response.status} — ${errText}`)
  }

  const data = await response.json() as { object: { sha: string } }
  return data.object.sha
}

/**
 * Create a new git branch from a given SHA.
 * Call getDefaultBranchSha() first to get the base SHA.
 */
export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromSha: string
): Promise<void> {
  if (!isGitHubConfigured()) {
    throw new Error('GitHub not configured — GITHUB_TOKEN is missing')
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(
      `GitHub create branch failed: ${response.status} ${response.statusText} — ${errText}`
    )
  }
}
