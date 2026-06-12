import { describe, it, expect } from 'vitest'
import { getXeroHealth, getXeroHealthForBusiness, type XeroTenantKey } from '../health'

const FIXED_NOW = new Date('2026-06-12T00:00:00Z')

describe('getXeroHealth', () => {
  it('reports both tenants unconfigured when no env vars are set', () => {
    // NOTE: do not assert on the specific tenant keys, only that the
    // shape is right; this test runs against a real env and the wizard
    // doesn't always set Xero keys.
    const originalXero = process.env.XERO_CLIENT_ID
    const originalXeroSecret = process.env.XERO_CLIENT_SECRET
    const originalDr = process.env.DR_CLIENT_ID
    const originalDrSecret = process.env.DR_CLIENT_SECRET
    const originalWebhook = process.env.XERO_WEBHOOK_KEY
    delete process.env.XERO_CLIENT_ID
    delete process.env.XERO_CLIENT_SECRET
    delete process.env.DR_CLIENT_ID
    delete process.env.DR_CLIENT_SECRET
    delete process.env.XERO_WEBHOOK_KEY

    try {
      const h = getXeroHealth(() => FIXED_NOW)
      expect(h.any_configured).toBe(false)
      expect(h.tenants.carsi.configured).toBe(false)
      expect(h.tenants.dr.configured).toBe(false)
      expect(h.tenants.carsi.missing).toBeDefined()
      expect(h.tenants.carsi.missing).toContain('client_id')
      expect(h.tenants.carsi.missing).toContain('client_secret')
      expect(h.checked_at).toBe(FIXED_NOW.toISOString())
    } finally {
      if (originalXero !== undefined) process.env.XERO_CLIENT_ID = originalXero
      if (originalXeroSecret !== undefined) process.env.XERO_CLIENT_SECRET = originalXeroSecret
      if (originalDr !== undefined) process.env.DR_CLIENT_ID = originalDr
      if (originalDrSecret !== undefined) process.env.DR_CLIENT_SECRET = originalDrSecret
      if (originalWebhook !== undefined) process.env.XERO_WEBHOOK_KEY = originalWebhook
    }
  })

  it('reports CARSI configured when both CARSI env vars are set', () => {
    const originalXero = process.env.XERO_CLIENT_ID
    const originalXeroSecret = process.env.XERO_CLIENT_SECRET
    process.env.XERO_CLIENT_ID = 'carsi-id'
    process.env.XERO_CLIENT_SECRET = 'carsi-secret'

    try {
      const h = getXeroHealth(() => FIXED_NOW)
      expect(h.tenants.carsi.configured).toBe(true)
      expect(h.tenants.carsi.missing).toBeUndefined()
      expect(h.any_configured).toBe(true)
    } finally {
      if (originalXero !== undefined) process.env.XERO_CLIENT_ID = originalXero
      else delete process.env.XERO_CLIENT_ID
      if (originalXeroSecret !== undefined) process.env.XERO_CLIENT_SECRET = originalXeroSecret
      else delete process.env.XERO_CLIENT_SECRET
    }
  })

  it('reports DR configured when both DR env vars are set', () => {
    const originalDr = process.env.DR_CLIENT_ID
    const originalDrSecret = process.env.DR_CLIENT_SECRET
    process.env.DR_CLIENT_ID = 'dr-id'
    process.env.DR_CLIENT_SECRET = 'dr-secret'

    try {
      const h = getXeroHealth(() => FIXED_NOW)
      expect(h.tenants.dr.configured).toBe(true)
      expect(h.any_configured).toBe(true)
    } finally {
      if (originalDr !== undefined) process.env.DR_CLIENT_ID = originalDr
      else delete process.env.DR_CLIENT_ID
      if (originalDrSecret !== undefined) process.env.DR_CLIENT_SECRET = originalDrSecret
      else delete process.env.DR_CLIENT_SECRET
    }
  })

  it('reports webhook_configured only when XERO_WEBHOOK_KEY is set', () => {
    const originalWebhook = process.env.XERO_WEBHOOK_KEY
    process.env.XERO_CLIENT_ID = 'carsi-id'
    process.env.XERO_CLIENT_SECRET = 'carsi-secret'
    process.env.XERO_WEBHOOK_KEY = 'webhook-key'
    try {
      const h = getXeroHealth(() => FIXED_NOW)
      expect(h.tenants.carsi.webhook_configured).toBe(true)
    } finally {
      if (originalWebhook !== undefined) process.env.XERO_WEBHOOK_KEY = originalWebhook
      else delete process.env.XERO_WEBHOOK_KEY
    }
  })
})

describe('getXeroHealthForBusiness', () => {
  it('routes "dr" to the DR tenant', () => {
    const originalDr = process.env.DR_CLIENT_ID
    const originalDrSecret = process.env.DR_CLIENT_SECRET
    process.env.DR_CLIENT_ID = 'dr-id'
    process.env.DR_CLIENT_SECRET = 'dr-secret'
    try {
      const h = getXeroHealthForBusiness('dr')
      expect(h.tenant).toBe<XeroTenantKey>('dr')
      expect(h.configured).toBe(true)
    } finally {
      if (originalDr !== undefined) process.env.DR_CLIENT_ID = originalDr
      else delete process.env.DR_CLIENT_ID
      if (originalDrSecret !== undefined) process.env.DR_CLIENT_SECRET = originalDrSecret
      else delete process.env.DR_CLIENT_SECRET
    }
  })

  it('routes "nrpg" to the DR tenant', () => {
    const originalDr = process.env.DR_CLIENT_ID
    const originalDrSecret = process.env.DR_CLIENT_SECRET
    process.env.DR_CLIENT_ID = 'dr-id'
    process.env.DR_CLIENT_SECRET = 'dr-secret'
    try {
      const h = getXeroHealthForBusiness('nrpg')
      expect(h.tenant).toBe<XeroTenantKey>('dr')
    } finally {
      if (originalDr !== undefined) process.env.DR_CLIENT_ID = originalDr
      else delete process.env.DR_CLIENT_ID
      if (originalDrSecret !== undefined) process.env.DR_CLIENT_SECRET = originalDrSecret
      else delete process.env.DR_CLIENT_SECRET
    }
  })

  it('routes everything else to the CARSI tenant', () => {
    const originalXero = process.env.XERO_CLIENT_ID
    const originalXeroSecret = process.env.XERO_CLIENT_SECRET
    process.env.XERO_CLIENT_ID = 'carsi-id'
    process.env.XERO_CLIENT_SECRET = 'carsi-secret'
    try {
      for (const bk of ['default', 'carsi', 'restoreassist', 'ccw', 'unite-hub']) {
        const h = getXeroHealthForBusiness(bk)
        expect(h.tenant).toBe<XeroTenantKey>('carsi')
      }
    } finally {
      if (originalXero !== undefined) process.env.XERO_CLIENT_ID = originalXero
      else delete process.env.XERO_CLIENT_ID
      if (originalXeroSecret !== undefined) process.env.XERO_CLIENT_SECRET = originalXeroSecret
      else delete process.env.XERO_CLIENT_SECRET
    }
  })
})
