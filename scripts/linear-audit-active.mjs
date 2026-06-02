#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const envPath = process.env.LINEAR_CANONICAL_ENV_PATH ?? 'D:/Unite-Group/Nexus-Hub/secrets/local.env'
const apiUrl = 'https://api.linear.app/graphql'

function parseEnvValue(text, keyName) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [rawKey, ...rawValueParts] = line.split('=')
    if (rawKey.trim() !== keyName) continue
    let value = rawValueParts.join('=').trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1).trim()
    return value
  }
  return ''
}

async function gql(query, variables = {}) {
  const key = parseEnvValue(await readFile(envPath, 'utf8'), 'LINEAR_API_KEY')
  if (!key) throw new Error(`LINEAR_API_KEY missing from ${envPath}`)
  const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: key }, body: JSON.stringify({ query, variables }) })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.errors?.length) throw new Error(`Linear query failed: HTTP ${res.status} ${body.errors?.map(e => e.message).join('; ') ?? ''}`)
  return body.data
}

const query = `
query ActiveIssues($after: String) {
  issues(first: 100, after: $after, filter: { state: { type: { nin: ["completed", "canceled"] } } }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id identifier title description priority estimate url createdAt updatedAt
      state { id name type }
      team { key name }
      project { id name state }
      assignee { name }
      labels { nodes { name } }
    }
  }
}`

let after = null
const issues = []
do {
  const data = await gql(query, { after })
  issues.push(...data.issues.nodes)
  after = data.issues.pageInfo.hasNextPage ? data.issues.pageInfo.endCursor : null
} while (after)

const sorted = issues.sort((a, b) => `${a.state.name}|${a.identifier}`.localeCompare(`${b.state.name}|${b.identifier}`))
for (const issue of sorted) {
  console.log(JSON.stringify({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    state: issue.state.name,
    stateType: issue.state.type,
    team: issue.team?.key,
    project: issue.project?.name ?? null,
    assignee: issue.assignee?.name ?? null,
    labels: issue.labels.nodes.map(l => l.name),
    priority: issue.priority,
    estimate: issue.estimate ?? null,
    updatedAt: issue.updatedAt,
    url: issue.url,
    description: issue.description?.slice(0, 500) ?? ''
  }))
}
console.error(`count=${sorted.length}`)
