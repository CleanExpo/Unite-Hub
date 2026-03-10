// src/instrumentation.ts
// Next.js instrumentation hook — runs once at server startup
// Validates critical environment variables before accepting requests

export async function register() {
  const isProduction = process.env.NODE_ENV === 'production'

  // ─── Required (always) ─────────────────────────────────────────────────────
  const requiredAlways = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ] as const

  // ─── Required (production only) ────────────────────────────────────────────
  const requiredProduction = [
    'VAULT_ENCRYPTION_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
  ] as const

  // ─── Optional (warned when missing) ────────────────────────────────────────
  const optionalIntegrations = [
    { name: 'Xero',   vars: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'] },
    { name: 'Google',  vars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
    { name: 'Linear',  vars: ['LINEAR_API_KEY'] },
    { name: 'Stripe',  vars: ['STRIPE_SECRET_KEY_SYNTHEX', 'STRIPE_SECRET_KEY_DR'] },
    { name: 'Sentry',  vars: ['SENTRY_AUTH_TOKEN'] },
  ] as const

  // ─── Check required (always) ───────────────────────────────────────────────
  const missingAlways = requiredAlways.filter(v => !process.env[v])
  if (missingAlways.length > 0) {
    const msg = `Missing required env vars: ${missingAlways.join(', ')}`
    if (isProduction) throw new Error(msg)
    console.warn(`\u26A0\uFE0F  ${msg}`)
  }

  // ─── Check required (production) ───────────────────────────────────────────
  if (isProduction) {
    const missingProd = requiredProduction.filter(v => !process.env[v])
    if (missingProd.length > 0) {
      throw new Error(
        `Missing production env vars: ${missingProd.join(', ')}. ` +
        'These are required for secure operation in production.'
      )
    }
  }

  // ─── Warn about missing FOUNDER_USER_ID (CRON-only, not app startup) ───────
  if (isProduction && !process.env.FOUNDER_USER_ID) {
    console.warn('⚠️  FOUNDER_USER_ID not set — bookkeeper CRON will be disabled until configured.')
  }

  // ─── Check optional integrations ───────────────────────────────────────────
  const configured: string[] = []
  const unconfigured: string[] = []

  for (const integration of optionalIntegrations) {
    const hasAll = integration.vars.every(v => process.env[v])
    if (hasAll) {
      configured.push(integration.name)
    } else {
      unconfigured.push(integration.name)
    }
  }

  // ─── Startup summary (no secret values — only status) ─────────────────────
  console.log(
    `\n` +
    `\u250C\u2500 Nexus 2.0 Startup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n` +
    `\u2502 env:           ${isProduction ? 'production' : process.env.NODE_ENV ?? 'development'}\n` +
    `\u2502 integrations:  ${configured.length > 0 ? configured.join(', ') : 'none'}\n` +
    (unconfigured.length > 0
      ? `\u2502 unconfigured:  ${unconfigured.join(', ')}\n`
      : '') +
    `\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`
  )
}
