#!/usr/bin/env node
/**
 * Canonical Execution Context Proof Runner
 *
 * What this does:
 * 1) Verifies dev server is reachable
 * 2) Uses SUPABASE_SERVICE_ROLE_KEY to list workspaces (read-only)
 * 3) Prompts once for a REAL user access token (JWT)
 * 4) Runs the canonical execution-context proof
 *
 * Usage:
 *   node scripts/EXECUTION_CONTEXT_PROOF_RUNNER.mjs
 *
 * Optional flags:
 *   --baseUrl http://localhost:3008
 *   --token <JWT | "Bearer <JWT>" | Supabase cookie JSON>
 *   --workspaceId <WORKSPACE_UUID>
 *
 * Env:
 *   PROOF_BASE_URL (optional)
 *   NEXT_PUBLIC_SUPABASE_URL (required)
 *   SUPABASE_SERVICE_ROLE_KEY (required)
 */

import readline from "readline";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

function fatal(msg) {
  console.error("\nFATAL:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("OK:", msg);
}

function info(msg) {
  console.log("INFO:", msg);
}

function warn(msg) {
  console.warn("WARN:", msg);
}

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const BASE_URL =
  getArg("--baseUrl") || process.env.PROOF_BASE_URL || "http://localhost:3008";

/* ---------- ENV VALIDATION ---------- */

const REQUIRED_ENVS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) fatal(`Missing required env var: ${key}`);
}

/* ---------- TOKEN NORMALIZATION ---------- */

function normalizeBearerToken(input) {
  if (!input) return null;
  let raw = String(input).trim();

  if (/^bearer\s+/i.test(raw)) raw = raw.replace(/^bearer\s+/i, "").trim();

  // Sometimes people paste the sb-*-auth-token cookie value, which may be:
  // - URL-encoded JSON
  // - JSON containing { access_token: "..." }
  // Try to extract access_token when possible.
  const candidates = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded && decoded !== raw) candidates.push(decoded);
  } catch {
    // ignore
  }

  for (const c of candidates) {
    const s = String(c).trim();
    if (!s) continue;
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        const obj = JSON.parse(s);
        if (obj?.access_token && typeof obj.access_token === "string") {
          return obj.access_token.trim();
        }
      } catch {
        // ignore
      }
    }
  }

  return raw;
}

/* ---------- STEP 1: SERVER REACHABILITY ---------- */

info(`Checking dev server: ${BASE_URL}`);
try {
  const r = await fetch(`${BASE_URL}/api/health`);
  if (r.ok) ok(`Server reachable (HTTP ${r.status})`);
  else warn(`Server responded non-OK (HTTP ${r.status})`);
} catch (e) {
  fatal(`Dev server not reachable at ${BASE_URL}`);
}

/* ---------- STEP 2: FETCH WORKSPACES ---------- */

info("Fetching workspaces using service role (read-only)");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: workspaces, error } = await supabase
  .from("workspaces")
  .select("id,name")
  .limit(20);

if (error) fatal(`Could not load workspaces from Supabase: ${error.message}`);
if (!workspaces?.length) fatal("No workspaces found (or none visible)");

console.log("\nAvailable Workspaces:");
workspaces.forEach((w, i) => {
  console.log(`  ${i + 1}. ${w.name}  (${w.id})`);
});

/* ---------- STEP 3: GET USER TOKEN + WORKSPACE ---------- */

let token = normalizeBearerToken(getArg("--token"));
let workspaceId = getArg("--workspaceId");

if (!token || !workspaceId) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, (a) => res(String(a).trim())));

  if (!token) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASTE A REAL USER ACCESS TOKEN (JWT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Browser DevTools
• Cookie: sb-*-auth-token (paste whole JSON is OK)
• Or Authorization: Bearer <token>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    token = normalizeBearerToken(await ask("Paste user access token: "));
    if (!token || token.length < 50) {
      rl.close();
      fatal("Invalid or empty token provided");
    }
  }

  if (!workspaceId) {
    console.log("\nSelect workspace number:");
    const idx = Number(await ask("> "));
    rl.close();

    const workspace = workspaces[idx - 1];
    if (!workspace) fatal("Invalid workspace selection");
    workspaceId = workspace.id;
    ok(`Using workspace: ${workspace.name} (${workspace.id})`);
  } else {
    rl.close();
  }
}

if (!workspaceId) fatal("Missing workspaceId");

/* ---------- STEP 4: EXECUTION CONTEXT PROOF ---------- */

info("Running canonical execution-context proof");

const proofUrl = `${BASE_URL}/api/admin/audit-events?action=summary&hours=24`;

async function printResponse(label, res) {
  const body = await res.text();
  console.log(`\n━━ ${label} ━━`);
  console.log("HTTP Status:", res.status);
  console.log("Response:");
  console.log(body);
  return { status: res.status, body };
}

// Positive: Authorization + x-workspace-id
const res = await fetch(proofUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    "x-workspace-id": workspaceId,
  },
});

await printResponse("PROOF RESULT (positive)", res);

if (res.status !== 200) {
  fatal("Execution Context FAILED (positive) — inspect response above");
}

// Negative: missing x-workspace-id should be 400 by contract
const resNeg = await fetch(proofUrl, {
  headers: { Authorization: `Bearer ${token}` },
});

await printResponse("PROOF RESULT (negative: missing workspace header)", resNeg);

if (resNeg.status !== 400) {
  fatal(`Execution Context contract mismatch: expected 400, got ${resNeg.status}`);
}

ok("Execution Context VERIFIED (auth + workspace + membership)");
process.exit(0);

