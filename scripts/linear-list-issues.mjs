/**
 * Fetch all open Linear issues sorted by priority (urgent → high → normal → low).
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-list-issues.mjs
 */

import { linearGql } from './linear-update.mjs';

const data = await linearGql(`{
  issues(
    first: 50
    filter: { state: { type: { nin: ["completed", "canceled"] } } }
    orderBy: updatedAt
  ) {
    nodes {
      identifier
      title
      priority
      state { name type }
      team { key name }
      description
    }
  }
}`);

const PRIORITY_LABEL = ['⚪ NONE', '🔴 URGENT', '🟠 HIGH', '🟡 NORMAL', '🔵 LOW', '⚪ NONE'];

const issues = data.issues.nodes.sort((a, b) => {
  const pa = a.priority === 0 ? 5 : a.priority;
  const pb = b.priority === 0 ? 5 : b.priority;
  return pa - pb;
});

console.log(`\n=== Open Linear Issues (${issues.length} total) ===\n`);
for (const issue of issues) {
  const label = PRIORITY_LABEL[issue.priority] ?? '⚪ NONE';
  console.log(`${label} [${issue.identifier}] ${issue.title}`);
  console.log(`   Team: ${issue.team.name} | State: ${issue.state.name}`);
  if (issue.description) {
    console.log(`   ${issue.description.slice(0, 100).replace(/\n/g, ' ')}...`);
  }
  console.log('');
}
