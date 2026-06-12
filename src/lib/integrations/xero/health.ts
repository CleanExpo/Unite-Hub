// src/lib/integrations/xero/health.ts
//
// Lane X (Xero EOFY sprint, Phase B) — Xero health surface.
//
// Read-only helper that returns a structured "is Xero live?" status for
// each known business account (CARSI, DR). The existing isXeroConfigured()
// function only checks the global (shared) Xero env vars; this module
// adds per-tenant granularity so the founder UI can show "configured for
// CARSI: yes; configured for DR: no" rather than the binary "no".
//
// Pure function library. No DB, no secrets, no env vars required at
// runtime (env vars are for runtime config; the function checks presence
// and reports the result, never reads the values themselves).

import { getXeroCredentials } from './client'

export type XeroTenantKey = 'carsi' | 'dr'

export interface XeroTenantHealth {
  /** Tenant key the check applies to. */
  tenant: XeroTenantKey
  /** True iff both the clientId and clientSecret env vars are present and non-empty. */
  configured: boolean
  /** True if a webhook key is also configured. */
  webhook_configured: boolean
  /** If false, a human-readable reason. */
  missing?: string[]
}

/** Map our business-key to which Xero OAuth client pair the lib routes to. */
function businessToTenant(businessKey: string): XeroTenantKey {
  // Same membership as client.ts (DR_BUSINESS_KEYS).
  if (businessKey === 'dr' || businessKey === 'nrpg') return 'dr'
  return 'carsi'
}

function checkTenant(tenant: XeroTenantKey): XeroTenantHealth {
  const creds = getXeroCredentials(tenant === 'dr' ? 'dr' : 'default')
  const missing: string[] = []
  if (!creds.clientId) missing.push('client_id')
  if (!creds.clientSecret) missing.push('client_secret')
  const webhook =
    (tenant === 'carsi' ? process.env.XERO_WEBHOOK_KEY : null) ?? null
  return {
    tenant,
    configured: missing.length === 0,
    webhook_configured: !!webhook,
    missing: missing.length > 0 ? missing : undefined,
  }
}

export interface XeroHealth {
  /** Top-level: is ANY tenant configured? */
  any_configured: boolean
  /** Per-tenant breakdown. */
  tenants: Record<XeroTenantKey, XeroTenantHealth>
  /** ISO timestamp the check ran. */
  checked_at: string
}

export function getXeroHealth(now: () => Date = () => new Date()): XeroHealth {
  const carsi = checkTenant('carsi')
  const dr = checkTenant('dr')
  return {
    any_configured: carsi.configured || dr.configured,
    tenants: { carsi, dr },
    checked_at: now().toISOString(),
  }
}

/**
 * Convenience: for a given businessKey, return the Xero tenant health that
 * applies to it. Useful for route handlers that know the business but not
 * the tenant.
 */
export function getXeroHealthForBusiness(businessKey: string): XeroTenantHealth {
  return checkTenant(businessToTenant(businessKey))
}
