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

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

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

