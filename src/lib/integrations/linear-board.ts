// src/lib/integrations/linear-board.ts
// Extended Linear functions for CEO Board Meeting and Gantt chart.
// Separate from linear.ts to avoid breaking hub-sweep.

const LINEAR_API = 'https://api.linear.app/graphql'

function getApiKey(): string {
  return process.env.LINEAR_API_KEY?.trim() ?? ''
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('LINEAR_API_KEY not configured')

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Linear API error: ${res.status}`)
  const json = await res.json() as { data: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LinearIssueWithDue {
  id: string
  identifier: string
  title: string
  priority: number
  dueDate: string       // ISO date string
  createdAt: string
  updatedAt: string
  url: string
  state: { name: string; type: string }
  team: { id: string; key: string; name: string }
  assignee: { name: string } | null
}

export interface LinearCompletedIssue {
  id: string
  identifier: string
  title: string
  completedAt: string
  url: string
  team: { key: string; name: string }
  state: { name: string }
}

export interface LinearInFlightIssue {
  id: string
  identifier: string
  title: string
  priority: number
  url: string
  team: { key: string; name: string }
  state: { name: string }
  assignee: { name: string } | null
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Fetch issues with due dates (for Gantt chart)
// ---------------------------------------------------------------------------

export async function fetchIssuesWithDueDates(): Promise<LinearIssueWithDue[]> {
  if (!getApiKey()) return []

  try {
    const data = await gql<{ issues: { nodes: LinearIssueWithDue[] } }>(`
      query IssuesWithDueDates {
        issues(
          filter: { dueDate: { null: false }, state: { type: { nin: ["cancelled", "completed"] } } }
          orderBy: dueDate
          first: 100
        ) {
          nodes {
            id
            identifier
            title
            priority
            dueDate
            createdAt
            updatedAt
            url
            state { name type }
            team { id key name }
            assignee { name }
          }
        }
      }
    `)
    return data.issues.nodes
  } catch (err) {
    console.error('[Linear Board] fetchIssuesWithDueDates error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Fetch recently completed issues (for board meeting "what shipped")
// ---------------------------------------------------------------------------

export async function fetchRecentlyCompletedIssues(since: Date): Promise<LinearCompletedIssue[]> {
  if (!getApiKey()) return []

  try {
    const data = await gql<{ issues: { nodes: LinearCompletedIssue[] } }>(`
      query RecentlyCompleted($since: DateTimeOrDuration) {
        issues(
          filter: { completedAt: { gte: $since }, state: { type: { eq: "completed" } } }
          orderBy: completedAt
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            completedAt
            url
            team { key name }
            state { name }
          }
        }
      }
    `, { since: since.toISOString() })
    return data.issues.nodes
  } catch (err) {
    console.error('[Linear Board] fetchRecentlyCompletedIssues error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Fetch in-flight issues (for board meeting "in progress")
// ---------------------------------------------------------------------------

export async function fetchInFlightIssues(): Promise<LinearInFlightIssue[]> {
  if (!getApiKey()) return []

  try {
    const data = await gql<{ issues: { nodes: LinearInFlightIssue[] } }>(`
      query InFlight {
        issues(
          filter: { state: { type: { in: ["started"] } } }
          orderBy: updatedAt
          first: 50
        ) {
          nodes {
            id
            identifier
            title
            priority
            url
            updatedAt
            team { key name }
            state { name }
            assignee { name }
          }
        }
      }
    `)
    return data.issues.nodes
  } catch (err) {
    console.error('[Linear Board] fetchInFlightIssues error:', err)
    return []
  }
}
