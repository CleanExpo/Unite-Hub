#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const envPath = 'D:/Unite-Group/Nexus-Hub/secrets/local.env'
const apiUrl = 'https://api.linear.app/graphql'
const canceledStateId = '91ba795d-6e3d-4b9e-9c2a-bfc05b3720e0'
const duplicateStateId = 'aec545a9-ad2d-4179-a058-b280b414458d'

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
  if (!res.ok || body.errors?.length) throw new Error(`Linear API failed: HTTP ${res.status} ${body.errors?.map(e => e.message).join('; ') ?? ''}`)
  return body.data
}

async function updateIssue(issueId, stateId) {
  const data = await gql(`mutation UpdateIssue($id: String!, $stateId: String!) { issueUpdate(id: $id, input: { stateId: $stateId }) { success issue { identifier state { name type } } } }`, { id: issueId, stateId })
  if (!data.issueUpdate.success) throw new Error(`issueUpdate failed for ${issueId}`)
  return data.issueUpdate.issue
}

const lines = (await readFile('pi-devops-open.jsonl', 'utf8')).trim().split(/\r?\n/).filter(Boolean)
const issues = lines.map(line => JSON.parse(line))
const byId = new Map(issues.map(i => [i.identifier, i]))
const updates = []

// Rule 1: low-value research scout spam: cancel open [SCOUT] tickets with relevance <=3/5.
for (const issue of issues) {
  const isScout = issue.state === 'Backlog' && (issue.labels.includes('scout') || issue.title.startsWith('[SCOUT]'))
  if (!isScout) continue
  const match = issue.description.match(/Relevance Score:\*\*\s*(\d)\/5/)
  const score = match ? Number(match[1]) : null
  if (score !== null && score <= 3) updates.push({ issue, stateId: canceledStateId, reason: `low-relevance scout ${score}/5` })
}

// Rule 2: high-value scout duplicates: keep the newest/highest identifier per exact title, mark older copies duplicate.
const highScoutGroups = new Map()
for (const issue of issues) {
  const isScout = issue.state === 'Backlog' && (issue.labels.includes('scout') || issue.title.startsWith('[SCOUT]'))
  if (!isScout) continue
  const match = issue.description.match(/Relevance Score:\*\*\s*(\d)\/5/)
  const score = match ? Number(match[1]) : 0
  if (score < 4) continue
  const key = issue.title.trim().toLowerCase()
  if (!highScoutGroups.has(key)) highScoutGroups.set(key, [])
  highScoutGroups.get(key).push(issue)
}
for (const group of highScoutGroups.values()) {
  group.sort((a, b) => Number(b.identifier.split('-')[1]) - Number(a.identifier.split('-')[1]))
  for (const issue of group.slice(1)) updates.push({ issue, stateId: duplicateStateId, reason: `duplicate high-value scout; kept ${group[0].identifier}` })
}

// Rule 3: Margot production idea duplicate bursts: keep oldest canonical issue, mark later exact-title copies duplicate.
const margotGroups = new Map()
for (const issue of issues) {
  if (issue.state !== 'Backlog' || !issue.labels.includes('margot-idea')) continue
  const key = issue.title.trim().toLowerCase()
  if (!margotGroups.has(key)) margotGroups.set(key, [])
  margotGroups.get(key).push(issue)
}
for (const group of margotGroups.values()) {
  if (group.length <= 1) continue
  group.sort((a, b) => Number(a.identifier.split('-')[1]) - Number(b.identifier.split('-')[1]))
  for (const issue of group.slice(1)) updates.push({ issue, stateId: duplicateStateId, reason: `duplicate Margot production idea; kept ${group[0].identifier}` })
}

// Rule 4: obvious in-progress duplicate workorder; keep newest RA-2906, mark older RA-2213 duplicate.
if (byId.has('RA-2213')) updates.push({ issue: byId.get('RA-2213'), stateId: duplicateStateId, reason: 'duplicate in-progress CCW workorder; kept RA-2906' })

const seen = new Set()
const deduped = updates.filter(u => {
  if (seen.has(u.issue.id)) return false
  seen.add(u.issue.id)
  return true
})

const dryRun = process.argv.includes('--dry-run')
console.log(JSON.stringify({ dryRun, plannedUpdates: deduped.length, cancel: deduped.filter(u => u.stateId === canceledStateId).length, duplicate: deduped.filter(u => u.stateId === duplicateStateId).length }))
for (const u of deduped) console.log(JSON.stringify({ identifier: u.issue.identifier, from: u.issue.state, to: u.stateId === canceledStateId ? 'Canceled' : 'Duplicate', reason: u.reason, title: u.issue.title }))

if (!dryRun) {
  for (const u of deduped) {
    const updated = await updateIssue(u.issue.id, u.stateId)
    console.error(`updated ${updated.identifier} -> ${updated.state.name}`)
  }
}
