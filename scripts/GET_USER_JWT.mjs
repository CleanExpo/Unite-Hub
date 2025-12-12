#!/usr/bin/env node
/**
 * GET_USER_JWT
 *
 * Usage:
 *   node scripts/GET_USER_JWT.mjs user@example.com
 *
 * Loads `.env.local`, generates a Supabase magiclink via service role, then
 * obtains and prints ONLY the access token (JWT) to stdout.
 */

import fs from "fs";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = new URL("../.env.local", import.meta.url);
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let value = t.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const email = process.argv[2];
if (!email) fail("Missing email argument (argv[2])");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) fail("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) fail("Missing env: SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureUserExists(emailAddress) {
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id,email")
    .eq("email", emailAddress)
    .maybeSingle();

  if (profileError) {
    fail(`Failed querying user_profiles: ${profileError.message}`);
  }

  if (profile?.id) return profile.id;

  const password = `${crypto.randomUUID()}Aa1!`;
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email: emailAddress,
      password,
      email_confirm: true,
      user_metadata: { full_name: emailAddress },
    });

  if (createError || !created?.user?.id) {
    fail(
      `createUser failed: ${
        createError?.message || "no user returned"
      }`
    );
  }

  return created.user.id;
}

async function ensureWorkspace3MembershipAndPermissions(userId) {
  // IMPORTANT: keep this query aligned with EXECUTION_CONTEXT_PROOF_RUNNER.mjs
  // so "workspace #3" resolves identically.
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id,name,org_id")
    .limit(20);

  if (wsError) fail(`Failed loading workspaces: ${wsError.message}`);
  if (!workspaces || workspaces.length < 3) {
    fail("Need at least 3 workspaces to satisfy proof runner selection");
  }

  const ws3 = workspaces[2];

  // Membership boundary for requireExecutionContext(): user_organizations by org_id
  const { error: memberInsertError } = await supabase
    .from("user_organizations")
    .upsert(
      { user_id: userId, org_id: ws3.org_id, role: "owner", is_active: true },
      { onConflict: "user_id,org_id" }
    );

  if (memberInsertError) {
    fail(`Failed upserting user_organizations: ${memberInsertError.message}`);
  }

  // Permission boundary for /api/admin/audit-events: RPC has_permission(userId, tenantId=workspaceId, settings.read)
  // Ensure default roles exist for this tenant/workspace, then assign owner/admin.
  let { data: roles, error: rolesError } = await supabase
    .from("roles_v2")
    .select("id,name")
    .eq("tenant_id", ws3.id)
    .in("name", ["owner", "admin"]);

  if (rolesError) {
    fail(`Failed querying roles_v2: ${rolesError.message}`);
  }

  if (!roles?.length) {
    const { error: initError } = await supabase.rpc("init_default_roles", {
      p_tenant_id: ws3.id,
    });
    if (initError) {
      fail(`init_default_roles failed: ${initError.message}`);
    }

    const r2 = await supabase
      .from("roles_v2")
      .select("id,name")
      .eq("tenant_id", ws3.id)
      .in("name", ["owner", "admin"]);

    roles = r2.data || null;
    rolesError = r2.error || null;
    if (rolesError) fail(`Failed re-querying roles_v2: ${rolesError.message}`);
  }

  const ownerRole = roles?.find((r) => r.name === "owner") || roles?.[0];
  if (!ownerRole?.id) fail("Could not resolve an owner/admin role for workspace #3");

  const { error: userRoleError } = await supabase
    .from("user_roles_v2")
    .upsert(
      { user_id: userId, tenant_id: ws3.id, role_id: ownerRole.id, assigned_by: null },
      { onConflict: "user_id,tenant_id,role_id" }
    );

  if (userRoleError) {
    fail(`Failed upserting user_roles_v2: ${userRoleError.message}`);
  }
}

function extractAccessTokenFromUrl(url) {
  try {
    const u = new URL(url);
    const hash = (u.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

async function main() {
  const userId = await ensureUserExists(email);
  await ensureWorkspace3MembershipAndPermissions(userId);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) fail(`generateLink failed: ${error.message}`);
  if (!data?.properties) fail("generateLink returned no properties");

  // Preferred: verify directly and get session.access_token.
  const tokenHash =
    data.properties.hashed_token || data.properties.hashedToken || null;

  if (tokenHash) {
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: tokenHash,
      });

    if (!verifyError && verifyData?.session?.access_token) {
      process.stdout.write(`${verifyData.session.access_token}\n`);
      return;
    }
  }

  // Fallback: hit action_link and parse the redirect URL fragment.
  const actionLink = data.properties.action_link || data.properties.actionLink;
  if (!actionLink) {
    fail(
      "Could not obtain access token: missing properties.action_link and verifyOtp did not return a session"
    );
  }

  const res = await fetch(actionLink, { redirect: "manual" });
  const location = res.headers.get("location") || res.headers.get("Location");

  if (!location) {
    fail(
      `Could not obtain access token: expected redirect from action_link, got HTTP ${res.status}`
    );
  }

  const redirected = new URL(location, actionLink).toString();
  const token = extractAccessTokenFromUrl(redirected);
  if (!token) {
    fail("Could not extract access_token from redirect URL");
  }

  process.stdout.write(`${token}\n`);
}

await main().catch((err) => fail(String(err?.stack || err)));
