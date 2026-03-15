// src/lib/integrations/github.ts

const GITHUB_API = 'https://api.github.com'

function headers(): Record<string, string> {
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
