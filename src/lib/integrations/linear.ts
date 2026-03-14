// src/lib/integrations/linear.ts
// Linear GraphQL client — personal API key auth (no Bearer prefix)

const LINEAR_API = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY ?? ''

function isLinearConfigured(): boolean {
  return API_KEY.length > 0
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Linear API error: ${res.status}`)
  const json = await res.json() as { data: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LinearState {
  id: string
  name: string
  type: 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
}

export interface LinearIssue {
  id: string
  identifier: string
  title: string
  priority: number      // 0=none 1=urgent 2=high 3=normal 4=low
  team: { id: string; key: string; name: string }
  state: LinearState
}

export interface LinearTeamStates {
  id: string
  key: string
  states: { nodes: LinearState[] }
}

// ─── Column mapping ───────────────────────────────────────────────────────────

// Kanban column → Linear state name (used when updating issue on drag)
export const COLUMN_TO_STATE_NAME: Record<string, string> = {
  today:    'In Progress',
  hot:      'In Review',
  pipeline: 'Todo',
  someday:  'Backlog',
  done:     'Done',
}

// Linear state → Kanban column
export function stateToColumn(state: LinearState): string {
  if (state.type === 'completed') return 'done'
  if (state.type === 'canceled') return 'done'
  if (state.type === 'backlog') return 'someday'
  if (state.type === 'unstarted') return 'pipeline'
  // started — distinguish by name
  if (state.name === 'In Review') return 'hot'
  return 'today'
}

// Linear team key → primary business key (for display on Kanban cards)
const TEAM_TO_BUSINESS: Record<string, string> = {
  SYN: 'synthex',
  DR:  'dr',       // DR-NRPG team covers dr, dr_qld, nrpg
  GP:  'carsi',    // G-Pilot
  RA:  'restore',
  UNI: 'ccw',      // Unite-Group covers ccw + ato
}

// Business key → Linear team key (for issue creation)
export const BUSINESS_TO_TEAM: Record<string, string> = {
  synthex:  'SYN',
  dr:       'DR',
  dr_qld:   'DR',
  nrpg:     'DR',
  carsi:    'GP',
  restore:  'RA',
  ccw:      'UNI',
  ato:      'UNI',
}

export function teamKeyToBusiness(teamKey: string): string {
  return TEAM_TO_BUSINESS[teamKey] ?? 'ccw'
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchIssues(): Promise<LinearIssue[]> {
  if (!isLinearConfigured()) {
    console.warn('LINEAR_API_KEY is not configured — returning empty issues')
    return []
  }

  const allIssues: LinearIssue[] = []
  let cursor: string | null = null
  const MAX_PAGES = 5 // Cap at 500 issues (5 × 100)

  interface IssuesResponse {
    issues: {
      nodes: LinearIssue[]
      pageInfo: { hasNextPage: boolean; endCursor: string }
    }
  }

  for (let page = 0; page < MAX_PAGES; page++) {
    const afterClause: string = cursor ? `after: "${cursor}"` : ''
    const data: IssuesResponse = await gql<IssuesResponse>(`{
      issues(
        first: 100
        ${afterClause}
        filter: { state: { type: { nin: ["canceled"] } } }
        orderBy: updatedAt
      ) {
        nodes {
          id
          identifier
          title
          priority
          team { id key name }
          state { id name type }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`)

    allIssues.push(...data.issues.nodes)

    if (!data.issues.pageInfo.hasNextPage) break
    cursor = data.issues.pageInfo.endCursor
  }

  return allIssues
}

// ─── Single issue detail ──────────────────────────────────────────────────────

export interface LinearIssueDetail extends LinearIssue {
  description: string | null
  url: string
  createdAt: string
  updatedAt: string
  labels: { nodes: { id: string; name: string; color: string }[] }
}

export async function fetchIssue(id: string): Promise<LinearIssueDetail> {
  if (!isLinearConfigured()) {
    throw new Error('LINEAR_API_KEY is not configured — cannot fetch issue')
  }
  const data = await gql<{ issue: LinearIssueDetail }>(`
    query GetIssue($id: String!) {
      issue(id: $id) {
        id
        identifier
        title
        description
        priority
        url
        createdAt
        updatedAt
        team { id key name }
        state { id name type }
        labels { nodes { id name color } }
      }
    }
  `, { id })
  return data.issue
}

export async function fetchTeamStates(): Promise<LinearTeamStates[]> {
  if (!isLinearConfigured()) {
    console.warn('LINEAR_API_KEY is not configured — returning empty team states')
    return []
  }
  const data = await gql<{ teams: { nodes: LinearTeamStates[] } }>(`{
    teams {
      nodes {
        id
        key
        states { nodes { id name type } }
      }
    }
  }`)
  return data.teams.nodes
}

export async function updateIssueState(issueId: string, stateId: string): Promise<void> {
  if (!isLinearConfigured()) {
    console.warn('LINEAR_API_KEY is not configured — skipping issue state update')
    return
  }
  await gql(`
    mutation UpdateIssue($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
      }
    }
  `, { id: issueId, stateId })
}

// ─── Issue creation ───────────────────────────────────────────────────────────

export interface CreateIssueInput {
  title: string
  description?: string
  teamKey: string       // e.g. 'SYN', 'DR', 'GP'
  priority?: number     // 0=no priority, 1=urgent, 2=high, 3=medium, 4=low
  labelNames?: string[] // Linear label names (best-effort — skip if label not found)
  // TODO: wire labelNames into the GraphQL mutation once Linear label lookup is implemented
}

export async function resolveTeamId(teamKey: string): Promise<string> {
  if (!isLinearConfigured()) {
    throw new Error('LINEAR_API_KEY is not configured — cannot resolve team ID')
  }
  const teams = await fetchTeamStates()
  const team = teams.find(t => t.key === teamKey)
  if (!team) throw new Error(`Linear team not found: ${teamKey}`)
  return team.id
}

export async function createIssue(input: CreateIssueInput): Promise<{ id: string; url?: string }> {
  if (!isLinearConfigured()) {
    throw new Error('LINEAR_API_KEY is not configured — cannot create issue')
  }
  const teamId = await resolveTeamId(input.teamKey)

  const data = await gql<{ issueCreate: { issue: { id: string; identifier: string; url: string } } }>(`
    mutation CreateIssue($teamId: String!, $title: String!, $description: String, $priority: Int) {
      issueCreate(input: {
        teamId: $teamId
        title: $title
        description: $description
        priority: $priority
      }) {
        issue { id identifier url }
      }
    }
  `, {
    teamId,
    title: input.title,
    description: input.description,
    priority: input.priority,
  })

  return { id: data.issueCreate.issue.identifier, url: data.issueCreate.issue.url }
}

export async function fetchIssueCountByBusiness(): Promise<Record<string, number>> {
  if (!isLinearConfigured()) {
    console.warn('LINEAR_API_KEY is not configured — returning empty issue counts')
    return {}
  }
  const issues = await fetchIssues()
  const counts: Record<string, number> = {}
  for (const issue of issues) {
    const bizKey = teamKeyToBusiness(issue.team.key)
    counts[bizKey] = (counts[bizKey] ?? 0) + 1
  }
  return counts
}
