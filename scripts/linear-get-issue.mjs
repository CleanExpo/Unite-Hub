/**
 * Fetch full details of a specific Linear issue.
 * Run: LINEAR_API_KEY=lin_api_xxx node scripts/linear-get-issue.mjs UNI-1513
 */

import { linearGql } from './linear-update.mjs';

const identifier = process.argv[2];
if (!identifier) { console.error('Usage: node linear-get-issue.mjs <IDENTIFIER>'); process.exit(1); }

const data = await linearGql(`{
  issue(id: "${identifier}") {
    id
    identifier
    title
    priority
    description
    state { id name type }
    team { key name states { nodes { id name type } } }
    children { nodes { identifier title state { name } } }
  }
}`);

const i = data.issue;
console.log(`\n=== ${i.identifier}: ${i.title} ===`);
console.log(`State: ${i.state.name} | Team: ${i.team.name}`);
console.log(`\nDescription:\n${i.description || '(none)'}`);
if (i.children?.nodes?.length) {
  console.log(`\nSub-issues:`);
  i.children.nodes.forEach(c => console.log(`  [${c.identifier}] ${c.title} — ${c.state.name}`));
}
