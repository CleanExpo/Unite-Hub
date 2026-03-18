#!/usr/bin/env node

/**
 * Nexus 2.0 — Environment Variable Validation
 *
 * Validates all required environment variables before starting/deploying.
 * Groups vars by tier: CRITICAL (blocks boot), REQUIRED (blocks features), INTEGRATION (optional).
 *
 * Usage:
 *   node scripts/validate-env.mjs           # Check local .env.local
 *   node scripts/validate-env.mjs --ci      # Check process.env (CI/Vercel)
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

const isCI = process.argv.includes('--ci')

// Load .env.local if not in CI mode
if (!isCI) {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    config({ path: envPath })
    console.log('  Loaded .env.local\n')
  } else {
    console.warn('  .env.local not found — using system environment variables\n')
  }
}

// ─── Tier Definitions ───────────────────────────────────────────────────────

const CRITICAL = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', hint: 'Supabase project URL (https://xxx.supabase.co)' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', hint: 'Supabase anon/public key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', hint: 'Supabase service role key (server-side only)' },
]

const REQUIRED = [
  { name: 'ANTHROPIC_API_KEY', hint: 'Anthropic API key (sk-ant-xxx)' },
  { name: 'VAULT_ENCRYPTION_KEY', hint: 'AES-256 key — openssl rand -hex 32' },
  { name: 'CRON_SECRET', hint: 'Secret for cron route auth' },
  { name: 'FOUNDER_USER_ID', hint: 'Supabase auth.users UUID for the founder' },
]

const INTEGRATION = [
  // Linear
  { name: 'LINEAR_API_KEY', hint: 'Linear personal API key', group: 'Linear' },
  // Xero — CARSI account
  { name: 'XERO_CLIENT_ID', hint: 'Xero OAuth client ID (CARSI account)', group: 'Xero' },
  { name: 'XERO_CLIENT_SECRET', hint: 'Xero OAuth client secret (CARSI account)', group: 'Xero' },
  // Xero — DR account (code reads DR_CLIENT_ID / DR_CLIENT_SECRET — see xero/client.ts)
  { name: 'DR_CLIENT_ID', hint: 'Xero OAuth client ID (DR account)', group: 'Xero DR' },
  { name: 'DR_CLIENT_SECRET', hint: 'Xero OAuth client secret (DR account)', group: 'Xero DR' },
  // Google
  { name: 'GOOGLE_CLIENT_ID', hint: 'Google OAuth client ID', group: 'Google' },
  { name: 'GOOGLE_CLIENT_SECRET', hint: 'Google OAuth client secret', group: 'Google' },
  // Social
  { name: 'FACEBOOK_APP_ID', hint: 'Facebook app ID', group: 'Social' },
  { name: 'LINKEDIN_CLIENT_ID', hint: 'LinkedIn client ID', group: 'Social' },
  { name: 'TIKTOK_CLIENT_KEY', hint: 'TikTok client key', group: 'Social' },
  // Slack
  { name: 'SLACK_WEBHOOK_URL', hint: 'Slack incoming webhook URL', group: 'Slack' },
  // Monitoring
  { name: 'SENTRY_AUTH_TOKEN', hint: 'Sentry auth token', group: 'Monitoring' },
  // App
  { name: 'NEXT_PUBLIC_APP_URL', hint: 'App URL for OAuth callbacks (http://localhost:3000)', group: 'App' },
]

// ─── Validation ─────────────────────────────────────────────────────────────

function checkVars(vars, tierName) {
  const missing = []
  const present = []

  for (const v of vars) {
    const value = process.env[v.name]
    if (!value || value.trim() === '') {
      missing.push(v)
    } else {
      present.push(v)
    }
  }

  return { tierName, missing, present, total: vars.length }
}

// ─── Output ─────────────────────────────────────────────────────────────────

console.log('┌─ Nexus 2.0 Environment Validation ──────────────────────')
console.log('│')

const criticalResult = checkVars(CRITICAL, 'CRITICAL')
const requiredResult = checkVars(REQUIRED, 'REQUIRED')
const integrationResult = checkVars(INTEGRATION, 'INTEGRATION')

let hasBlockers = false

for (const result of [criticalResult, requiredResult, integrationResult]) {
  const icon = result.missing.length === 0 ? '\u2705' : result.tierName === 'INTEGRATION' ? '\u26A0\uFE0F' : '\u274C'
  console.log(`\u2502 ${icon} ${result.tierName}: ${result.present.length}/${result.total} set`)

  if (result.missing.length > 0) {
    for (const v of result.missing) {
      console.log(`\u2502   \u2514 ${v.name} — ${v.hint}`)
    }
    if (result.tierName !== 'INTEGRATION') {
      hasBlockers = true
    }
  }
}

console.log('│')

// Check for stale/legacy vars that should be removed from Vercel
const STALE_VARS = [
  'NEXTAUTH_URL', 'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_TOKEN', 'STRIPE_RESTRICTED_KEY_TEST', 'STRIPE_RESTRICTED_KEY_LIVE',
  'STRIPE_PRICE_ID_STARTER',
  'CONVEX_URL', 'CONVEX_DEPLOYMENT',
  'ABACUS_API_KEY', 'ABACUS_CLI_KEY',
  'DATADOG_API_KEY', 'DATADOG_SITE',
  'DIGITALOCEAN_API_TOKEN',
  'ELEVENLABS_API_KEY',
  'OPENROUTER_API_KEY',
  'REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET',
  'FIELD_ENCRYPTION_KEY',
  'META_APP_ID', 'META_APP_SECRET',
  'OPENAI_API_KEY',
]

const foundStale = STALE_VARS.filter(name => process.env[name])
if (foundStale.length > 0) {
  console.log(`\u2502 \u26A0\uFE0F  ${foundStale.length} STALE vars detected (old SaaS — safe to remove):`)
  for (const name of foundStale) {
    console.log(`\u2502   \u2514 ${name}`)
  }
  console.log('│')
}

// Check for incorrectly-named DR Xero vars (old wrong names that were never in the codebase)
if (process.env.DR_XERO_CLIENT_ID && !process.env.DR_CLIENT_ID) {
  console.log('\u2502 \u26A0\uFE0F  NAMING MISMATCH: DR_XERO_CLIENT_ID found but code expects DR_CLIENT_ID')
  console.log('\u2502   Rename in Vercel: DR_XERO_CLIENT_ID \u2192 DR_CLIENT_ID')
}
if (process.env.DR_XERO_CLIENT_SECRET && !process.env.DR_CLIENT_SECRET) {
  console.log('\u2502 \u26A0\uFE0F  NAMING MISMATCH: DR_XERO_CLIENT_SECRET found but code expects DR_CLIENT_SECRET')
  console.log('\u2502   Rename in Vercel: DR_XERO_CLIENT_SECRET \u2192 DR_CLIENT_SECRET')
}

console.log('└─────────────────────────────────────────────────────────')
console.log('')

if (hasBlockers) {
  console.error('\u274C VALIDATION FAILED — missing CRITICAL or REQUIRED env vars')
  console.error('')
  console.error('To fix:')
  console.error('  1. Copy .env.example to .env.local')
  console.error('  2. Fill in the missing values')
  console.error('  3. For Vercel: vercel env add <NAME>')
  console.error('')
  process.exit(1)
}

console.log('\u2705 VALIDATION PASSED — all critical + required vars present')
process.exit(0)
