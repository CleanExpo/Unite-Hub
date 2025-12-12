#!/usr/bin/env node

/**
 * Proof script for canonical execution context.
 *
 * Runs two calls against the proof anchor route:
 *  1) Positive: includes Authorization + x-workspace-id
 *  2) Negative: missing x-workspace-id -> should 400
 *
 * Usage:
 *  node scripts/prove-execution-context.mjs \
 *    --baseUrl http://localhost:3008 \
 *    --token <SUPABASE_ACCESS_TOKEN> \
 *    --workspaceId <WORKSPACE_UUID>
 */

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const baseUrl = getArg('--baseUrl') || 'http://localhost:3008';
const token = getArg('--token');
const workspaceId = getArg('--workspaceId');

if (!token) {
  console.error('Missing --token');
  process.exit(1);
}
if (!workspaceId) {
  console.error('Missing --workspaceId');
  process.exit(1);
}

const url = `${baseUrl}/api/admin/audit-events?action=summary&hours=24`;

async function run() {
  // Positive
  {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'x-workspace-id': workspaceId,
      },
    });

    const text = await res.text();
    console.log('POSITIVE status:', res.status);
    console.log('POSITIVE body:', text.slice(0, 500));
  }

  // Negative (no workspace)
  {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    console.log('NEGATIVE status:', res.status);
    console.log('NEGATIVE body:', text.slice(0, 500));
  }
}

run().catch((err) => {
  console.error('Proof script failed:', err);
  process.exit(1);
});
