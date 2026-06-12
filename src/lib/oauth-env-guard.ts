// src/lib/oauth-env-guard.ts
//
// Lane #1 follow-on — bounded fail-loud patch for the OAuth routes.
//
// Today, the LinkedIn and TikTok authorize routes silently fail by
// redirecting to the OAuth provider with the literal string 'undefined'
// as the client_id / client_key. This helper provides a single guard
// that returns a structured 503 JSON response when required env vars
// are missing. Used by the 3 AMBER OAuth providers (Meta, LinkedIn,
// TikTok) to convert the silent failure into a loud one.
//
// This is the bounded work item that complements the docs/env-vars.md
// gap analysis and the docs/oauth-routes.md reference.

import { NextResponse } from 'next/server'

export interface OAuthEnvCheck {
  /** A short identifier for the env-var check (e.g. "linkedin_authorize"). */
  check: string
  /** The names of the env vars that must be present and non-empty. */
  required: string[]
  /**
   * Optional: the values as already read by the caller. If omitted, the
   * helper reads from process.env itself. This is provided for callers
   * that already have the values (e.g. injected for tests) and want to
   * avoid the helper touching process.env.
   */
  values?: Record<string, string | undefined>
}

export interface OAuthEnvCheckResult {
  ok: boolean
  missing: string[]
  /** Pre-built NextResponse (503 if !ok, null if ok) — caller should return this. */
  response: NextResponse | null
}

/**
 * Check that all required env vars are present and non-empty.
 * Returns a result with `ok: false` + a pre-built 503 NextResponse if not.
 * The caller should `return result.response` immediately when `!result.ok`.
 *
 * Pattern:
 *   const check = requireOAuthEnv({
 *     check: 'linkedin_authorize',
 *     required: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
 *   })
 *   if (!check.ok) return check.response
 */
export function requireOAuthEnv(check: OAuthEnvCheck): OAuthEnvCheckResult {
  const values: Record<string, string | undefined> = check.values ?? {}
  for (const name of check.required) {
    if (!(name in values)) values[name] = process.env[name]
  }
  const missing = check.required.filter(
    (n) => !values[n] || values[n]!.trim() === '' || values[n] === 'undefined',
  )
  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      response: NextResponse.json(
        {
          error: 'OAuth provider not configured',
          check: check.check,
          missing_env_vars: missing,
          remediation:
            'Add the missing env vars to Vercel production (vercel env add <NAME> production). ' +
            'Until then, this provider\'s Connect button will return 503 instead of silently ' +
            'redirecting to the OAuth provider with an undefined client_id.',
        },
        { status: 503 },
      ),
    }
  }
  return { ok: true, missing: [], response: null }
}
