// src/lib/integrations/github.ts

const GITHUB_API = 'https://api.github.com'
const DEFAULT_OWNER = process.env.GITHUB_OWNER ?? ''

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export function isGitHubConfigured(): boolean {
  const token = process.env.GITHUB_TOKEN ?? ''
  return token.length > 0 && !token.startsWith('ghp_xxx')
}

// ---------------------------------------------------------------------------
// Hub Sweep — read-only utilities
// ---------------------------------------------------------------------------

export interface GitHubCommitSummary {
  sha: string
  message: string
  authorDate: string
}

/**
 * Parse owner and repo from a GitHub URL or "owner/repo" string.
 * Falls back to GITHUB_OWNER env var for bare repo names.
 */
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  if (!repoUrl) return null
  try {
    const url = new URL(repoUrl)
    if (url.hostname === 'github.com') {
      const parts = url.pathname.replace(/^\//, '').split('/')
      if (parts.length >= 2) return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
    }
  } catch {
    // Not a URL
  }
  const slashIdx = repoUrl.indexOf('/')
  if (slashIdx !== -1) return { owner: repoUrl.slice(0, slashIdx), repo: repoUrl.slice(slashIdx + 1) }
  if (DEFAULT_OWNER) return { owner: DEFAULT_OWNER, repo: repoUrl }
  return null
}

/**
 * Fetch the most recent commit for a repository.
 * Returns null on any failure — hub sweep is non-fatal.
 */
export async function fetchLastCommit(
  owner: string,
  repo: string
): Promise<GitHubCommitSummary | null> {
  if (!isGitHubConfigured()) return null
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=1`, {
      headers: headers(),
    })
    if (!res.ok) {
      console.warn(`[GitHub] Commits fetch failed for ${owner}/${repo}: ${res.status}`)
      return null
    }
    const commits = await res.json() as Array<{
      sha: string
      commit: { message: string; author: { date: string } }
    }>
    if (!commits.length) return null
    return {
      sha: commits[0].sha.slice(0, 7),
      message: commits[0].commit.message.split('\n')[0].slice(0, 100),
      authorDate: commits[0].commit.author.date,
    }
  } catch (err) {
    console.warn(`[GitHub] fetchLastCommit error for ${owner}/${repo}:`, err)
    return null
  }
}

export interface CreatePRInput {
  owner: string   // e.g. 'phill-mcgurk'
  repo: string    // e.g. 'unite-group'
  title: string
  body: string
  head: string    // feature branch name
  base?: string   // default: 'main'
}

export interface GitHubPR {
  id: number
  number: number
  html_url: string
  state: string
}

export async function createPullRequest(input: CreatePRInput): Promise<GitHubPR> {
  const response = await fetch(
    `${GITHUB_API}/repos/${input.owner}/${input.repo}/pulls`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        head: input.head,
        base: input.base ?? 'main',
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      `GitHub create PR failed: ${response.status} — ${JSON.stringify(err)}`
    )
  }

  return response.json() as Promise<GitHubPR>
}

export async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  fromSha: string
): Promise<void> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      `GitHub create branch failed: ${response.status} — ${JSON.stringify(err)}`
    )
  }
}

export async function getDefaultBranchSha(
  owner: string,
  repo: string
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/main`,
    { headers: headers() }
  )
  if (!response.ok)
    throw new Error(`GitHub get SHA failed: ${response.status}`)
  const data = (await response.json()) as { object: { sha: string } }
  return data.object.sha
}
