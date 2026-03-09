// src/lib/integrations/linear.ts
// Linear GraphQL client — personal API key auth (no Bearer prefix)

const LINEAR_API = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY ?? ''

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

// Linear team key → business key
const TEAM_TO_BUSINESS: Record<string, string> = {
  SYN: 'synthex',
  DR:  'dr',
  GP:  'carsi',
  RA:  'restore',
  UNI: 'ccw',
}

export function teamKeyToBusiness(teamKey: string): string {
  return TEAM_TO_BUSINESS[teamKey] ?? 'ccw'
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function fetchIssues(): Promise<LinearIssue[]> {
  const data = await gql<{ issues: { nodes: LinearIssue[] } }>(`{
    issues(
      first: 100
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
    }
  }`)
  return data.issues.nodes
}

export async function fetchTeamStates(): Promise<LinearTeamStates[]> {
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
  await gql(`
    mutation UpdateIssue($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
      }
    }
  `, { id: issueId, stateId })
}
