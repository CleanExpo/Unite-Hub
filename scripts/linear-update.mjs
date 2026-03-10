#!/usr/bin/env node
/**
 * Linear API helper — reliable updates without bash string interpolation issues.
 *
 * ROOT CAUSE OF PREVIOUS FAILURES:
 *   Using `node -e "..."` with multi-line GraphQL bodies containing backtick-quoted
 *   identifiers causes bash command substitution, corrupting the string before Node
 *   ever sees it.
 *
 * THE FIX:
 *   Always write Linear operations to .mjs files. JS template literals handle
 *   backticks natively — bash never touches the string content.
 *
 * Setup:
 *   Add LINEAR_API_KEY to .env
 *   Or pass inline: LINEAR_API_KEY=lin_api_xxx node scripts/linear-update.mjs
 *
 * CLI usage:
 *   node scripts/linear-update.mjs issues
 *   node scripts/linear-update.mjs state <issueId> <stateId>
 *
 * Module usage:
 *   import { linearComment, linearSetState } from './linear-update.mjs';
 */

import https from 'node:https';

function requireApiKey() {
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    throw new Error(
      'LINEAR_API_KEY env var is required.\n' +
      'Add it to .env or pass inline:\n' +
      '  LINEAR_API_KEY=lin_api_xxx node scripts/linear-update.mjs',
    );
  }
  return key;
}

/**
 * Execute a GraphQL operation against the Linear API.
 * Uses variables to avoid any string interpolation issues.
 */
export async function linearGql(query, variables = {}) {
  const body = JSON.stringify({ query, variables });
  const apiKey = requireApiKey();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.linear.app',
        path: '/graphql',
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.errors) {
              reject(
                new Error(`Linear API error:\n${JSON.stringify(parsed.errors, null, 2)}`),
              );
            } else {
              resolve(parsed.data);
            }
          } catch {
            reject(
              new Error(`Failed to parse Linear response: ${data.slice(0, 200)}`),
            );
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** Post a comment to a Linear issue */
export async function linearComment(issueId, body) {
  const data = await linearGql(
    `mutation AddComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
        comment { id }
      }
    }`,
    { issueId, body },
  );
  return data.commentCreate;
}

/** Update a Linear issue's workflow state */
export async function linearSetState(issueId, stateId) {
  const data = await linearGql(
    `mutation SetState($issueId: String!, $stateId: String!) {
      issueUpdate(id: $issueId, input: { stateId: $stateId }) {
        success
        issue { identifier title state { name } }
      }
    }`,
    { issueId, stateId },
  );
  return data.issueUpdate;
}

/** List all UNI team issues with current state */
export async function listIssues() {
  const data = await linearGql(`{
    teams(filter: { key: { eq: "UNI" } }) {
      nodes {
        issues(first: 50, orderBy: number) {
          nodes { id identifier title state { name } }
        }
      }
    }
  }`);
  return data.teams.nodes[0]?.issues.nodes ?? [];
}

// ─── CLI interface ────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

if (command === 'issues') {
  const issues = await listIssues();
  console.log(`\nUNI team — ${issues.length} issues:\n`);
  issues.forEach((i) => {
    const state = i.state.name.padEnd(14);
    console.log(`  ${i.identifier.padEnd(10)} [${state}]  ${i.title}`);
  });
} else if (command === 'state') {
  const [issueId, stateId] = args;
  if (!issueId || !stateId) {
    console.error('Usage: node scripts/linear-update.mjs state <issueId> <stateId>');
    process.exit(1);
  }
  const result = await linearSetState(issueId, stateId);
  if (result.success) {
    console.log(`✅ ${result.issue.identifier} → ${result.issue.state.name}: ${result.issue.title}`);
  } else {
    console.error('❌ State update failed');
    process.exit(1);
  }
} else if (command) {
  console.error(`Unknown command: "${command}"`);
  console.error('Available commands: issues, state <issueId> <stateId>');
  process.exit(1);
}
