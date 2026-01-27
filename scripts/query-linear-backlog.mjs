import { LinearClient } from '@linear/sdk';

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) { console.error('LINEAR_API_KEY required'); process.exit(1); }

const client = new LinearClient({ apiKey: API_KEY });

async function main() {
  const projects = await client.projects();
  const allOpen = [];

  for (const p of projects.nodes) {
    const issues = await p.issues();
    for (const i of issues.nodes) {
      const state = await i.state;
      if (!state) continue;
      const closedStates = ['Done', 'Canceled', 'Duplicate'];
      if (closedStates.includes(state.name)) continue;
      allOpen.push({
        id: i.identifier,
        title: i.title,
        priority: i.priority,
        priorityLabel: i.priorityLabel,
        state: state.name,
        project: p.name,
      });
    }
  }

  // Sort: priority 1 (Urgent) first, then 2 (High), etc.
  allOpen.sort((a, b) => a.priority - b.priority);

  console.log(`\n=== OPEN LINEAR ISSUES (${allOpen.length} total) ===\n`);

  let currentPriority = null;
  for (const issue of allOpen) {
    if (issue.priorityLabel !== currentPriority) {
      currentPriority = issue.priorityLabel;
      console.log(`\n--- ${currentPriority} ---`);
    }
    console.log(`  ${issue.id} | ${issue.state.padEnd(12)} | [${issue.project}] ${issue.title}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
