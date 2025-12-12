/**
 * Execution Proof Script: Workspace Context Resolution
 *
 * This script produces observable proof that we can resolve:
 * - userId (via Supabase auth)
 * - orgId (via user_organizations)
 * - workspaceId (via workspaces)
 *
 * It is intentionally strict:
 * - No placeholders
 * - Fails loudly if required env vars are missing or invalid
 *
 * Required env vars:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - PROOF_USER_EMAIL
 * - PROOF_USER_PASSWORD
 */

import { createClient } from '@supabase/supabase-js';

function requireEnv(name) {
  const v = process.env[name];
  if (!v || String(v).includes('placeholder')) {
    throw new Error(`[prove-workspace-context] Missing/invalid env: ${name}`);
  }
  return v;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const email = requireEnv('PROOF_USER_EMAIL');
  const password = requireEnv('PROOF_USER_PASSWORD');

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    throw new Error(`[prove-workspace-context] Sign-in failed: ${signInError?.message || 'no user returned'}`);
  }

  const userId = signInData.user.id;

  // 1) Resolve orgId
  const { data: orgRow, error: orgError } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (orgError || !orgRow?.org_id) {
    throw new Error(`[prove-workspace-context] Failed resolving orgId for user ${userId}: ${orgError?.message || 'no org row'}`);
  }

  const orgId = orgRow.org_id;

  // 2) Resolve workspaceId
  const { data: wsRow, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle();

  if (wsError || !wsRow?.id) {
    throw new Error(`[prove-workspace-context] Failed resolving workspaceId for org ${orgId}: ${wsError?.message || 'no workspace row'}`);
  }

  const workspaceId = wsRow.id;

  // Observable proof output
  console.log(JSON.stringify({
    ok: true,
    resolved: { userId, orgId, workspaceId },
    evidence: {
      caller: 'scripts/prove-workspace-context.mjs',
      auth: 'service_role + signInWithPassword',
    },
  }, null, 2));
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
