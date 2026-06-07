import { existsSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'
import { qualifyLead } from '../src/lib/crm/qualify-lead'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false })

const AUTHED_JOURNEY_PATHS = [
  '/api/contacts',
  '/api/integrations/status',
  '/api/files',
  '/api/email/campaigns',
  '/api/email/threads',
]

function missingAdminProvisioningEnv() {
  return ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    .filter((name) => !process.env[name]?.trim())
}

test.describe('core journey verification guard', () => {
  test('real-user journeys have admin provisioning available', async () => {
    const missing = missingAdminProvisioningEnv()
    expect(
      missing,
      `Core journey e2e cannot provision tagged throwaway auth users without: ${missing.join(', ')}`
    ).toEqual([])
  })

  test('protected journey endpoints fail closed before authentication', async ({ request }) => {
    for (const path of AUTHED_JOURNEY_PATHS) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(
        [307, 401],
        `${path} should redirect to login or return 401 before auth; got ${response.status()}`
      ).toContain(response.status())
    }
  })

  test('lead scoring rule is deterministic for a known high-signal lead', async () => {
    const result = qualifyLead({
      email: 'ops@acmeindustrial.com.au',
      phone: '+61 400 000 000',
      company: 'Acme Industrial',
      jobTitle: 'Operations Director',
      message:
        'We need a CRM automation implementation and sales pipeline migration rollout for a multi-site operation.',
      interests: ['crm automation', 'sales pipeline'],
      marketingConsent: true,
      referralSource: 'partner',
      source: 'website',
    })

    expect(result).toMatchObject({
      score: 100,
      band: 'qualified',
      recommendationOnly: true,
    })
    expect(result.reasons).toContain('Has company and direct contact path')
    expect(result.reasons).toContain('Marketing consent provided')
    expect(result.reasons).toContain('Business need appears relevant')
  })

  test('Google OAuth consent boundary is explicit', async ({ request }) => {
    const authorize = await request.get('/api/auth/google/authorize', { maxRedirects: 0 })
    expect(authorize.status()).toBe(401)

    const callback = await request.get('/api/auth/google/callback', { maxRedirects: 0 })
    expect([302, 307, 308]).toContain(callback.status())
    expect(callback.headers().location ?? '').toContain('/auth/login')
  })
})
