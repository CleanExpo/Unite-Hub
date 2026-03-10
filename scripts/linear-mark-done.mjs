/**
 * Mark a Linear issue as Done by its identifier (e.g. UNI-1515).
 * Finds the "completed" state from the issue's team and applies it.
 *
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-mark-done.mjs UNI-1515
 */

import { linearGql, linearSetState } from './linear-update.mjs';

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: node scripts/linear-mark-done.mjs <IDENTIFIER>');
  process.exit(1);
}

console.log(`Fetching issue ${identifier}...`);

// Fetch issue UUID + team states in one query
const data = await linearGql(`{
  issue(id: "${identifier}") {
    id
    identifier
    title
    state { name type }
    team {
      key
      states { nodes { id name type } }
    }
  }
}`);

const issue = data.issue;
if (!issue) {
  console.error(`❌ Issue ${identifier} not found`);
  process.exit(1);
}

console.log(`Found: [${issue.identifier}] ${issue.title} — currently: ${issue.state.name}`);

// Find the "completed" (Done) state for this team
const doneState = issue.team.states.nodes.find(s => s.type === 'completed');
if (!doneState) {
  console.error(`❌ No 'completed' state found for team ${issue.team.key}`);
  console.log('Available states:', issue.team.states.nodes.map(s => `${s.name} (${s.type})`).join(', '));
  process.exit(1);
}

console.log(`Marking as Done (state: ${doneState.name})...`);

const result = await linearSetState(issue.id, doneState.id);

if (result.success) {
  console.log(`✅ ${result.issue.identifier} → ${result.issue.state.name}: ${result.issue.title}`);
} else {
  console.error(`❌ Failed to update ${identifier}`);
  process.exit(1);
}
