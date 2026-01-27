/**
 * Update a Linear issue state
 * Usage: LINEAR_API_KEY=xxx node scripts/update-linear-issue.mjs <identifier> <state>
 * Example: node scripts/update-linear-issue.mjs UNI-145 done
 */
import { LinearClient } from '@linear/sdk';

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) { console.error('LINEAR_API_KEY required'); process.exit(1); }

const [identifier, targetState] = process.argv.slice(2);
if (!identifier || !targetState) {
  console.error('Usage: node update-linear-issue.mjs <identifier> <state>');
  process.exit(1);
}

const client = new LinearClient({ apiKey: API_KEY });

async function main() {
  // Find team and workflow states
  const teams = await client.teams();
  const team = teams.nodes.find(t => t.name === 'Unite-Hub');
  if (!team) { console.error('Team not found'); process.exit(1); }

  const states = await team.states();
  const stateMap = {};
  for (const s of states.nodes) {
    stateMap[s.name.toLowerCase()] = s.id;
  }

  const stateId = stateMap[targetState.toLowerCase()];
  if (!stateId) {
    console.error(`State "${targetState}" not found. Available:`, Object.keys(stateMap).join(', '));
    process.exit(1);
  }

  // Find issue by identifier
  const issues = await client.issues({ filter: { number: { eq: parseInt(identifier.split('-')[1]) } } });
  const issue = issues.nodes.find(i => i.identifier === identifier);
  if (!issue) {
    console.error(`Issue ${identifier} not found`);
    process.exit(1);
  }

  // Update state
  const result = await client.updateIssue(issue.id, { stateId });
  console.log(`${identifier} → ${targetState} (success=${result.success})`);
}

main().catch(e => { console.error(e); process.exit(1); });
