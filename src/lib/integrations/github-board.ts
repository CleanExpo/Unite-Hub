// src/lib/integrations/github-board.ts
// Extended GitHub functions for the CEO Board Meeting.
// Separate from github.ts to avoid breaking hub-sweep.

const GITHUB_API = 'https://api.github.com'

function getToken(): string | null {
  return process.env.GITHUB_TOKEN?.trim() || null
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export interface GitHubRepoSummary {
  name: string
  full_name: string
  description: string | null
  html_url: string
  default_branch: string
  updated_at: string
}

export interface GitHubCommitSummary {
  sha: string
  message: string
  author: string
  date: string
  url: string
  repo: string
}

export interface GitHubPRSummary {
  number: number
  title: string
  state: string
  user: string
  created_at: string
  html_url: string
  repo: string
  draft: boolean
}

export async function fetchOrgRepos(org: string): Promise<GitHubRepoSummary[]> {
  const token = getToken()
  if (!token) {
    console.warn('[GitHub Board] GITHUB_TOKEN not set — skipping org repos fetch')
    return []
  }

  try {
    const res = await fetch(
      `${GITHUB_API}/orgs/${org}/repos?per_page=50&sort=updated&type=all`,
      { headers: headers(token) }
    )
    if (!res.ok) {
      console.warn(`[GitHub Board] fetchOrgRepos failed: ${res.status}`)
      return []
    }
    const data = await res.json() as GitHubRepoSummary[]
    return data
  } catch (err) {
    console.error('[GitHub Board] fetchOrgRepos error:', err)
    return []
  }
}

export async function fetchRecentCommits(
  owner: string,
  repo: string,
  since: Date
): Promise<GitHubCommitSummary[]> {
  const token = getToken()
  if (!token) return []

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=20&since=${since.toISOString()}`,
      { headers: headers(token) }
    )
    if (!res.ok) return []

    const data = await res.json() as Array<{
      sha: string
      commit: { message: string; author: { name: string; date: string } }
      html_url: string
    }>

    return data.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
      repo: `${owner}/${repo}`,
    }))
  } catch {
    return []
  }
}

export async function fetchOpenPRs(
  owner: string,
  repo: string
): Promise<GitHubPRSummary[]> {
  const token = getToken()
  if (!token) return []

  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=open&per_page=20`,
      { headers: headers(token) }
    )
    if (!res.ok) return []

    const data = await res.json() as Array<{
      number: number
      title: string
      state: string
      draft: boolean
      user: { login: string }
      created_at: string
      html_url: string
    }>

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      user: pr.user.login,
      created_at: pr.created_at,
      html_url: pr.html_url,
      repo: `${owner}/${repo}`,
      draft: pr.draft,
    }))
  } catch {
    return []
  }
}

export function isGitHubBoardConfigured(): boolean {
  const token = getToken()
  return !!token && token.length > 10
}
