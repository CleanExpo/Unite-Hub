import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync } from 'node:fs'
import { test, expect, type Browser, type Page } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { qualifyLead } from '../src/lib/crm/qualify-lead'
import { hasSupabaseAdminProvisioning, loadSupabaseAdminConfig } from './support/supabase-admin-config'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false })

const AUTHED_JOURNEY_PATHS = [
  '/api/contacts',
  '/api/integrations/status',
  '/api/files',
  '/api/email/campaigns',
  '/api/email/threads',
]

type CoreState = {
  marker: string
  user?: { id: string; email: string; password: string }
  campaignIds: string[]
  cacheKeys: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.CORE_JOURNEYS_APPEND_EVIDENCE !== '1') return
  appendFileSync('EVIDENCE.md', `${line}\n`)
}

function makeAdminClient() {
  const cfg = loadSupabaseAdminConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function provisionUser(admin: SupabaseClient, state: CoreState) {
  const email = `playwright+crud+${safeMarker(state.marker)}+core@unite-hub.test`
  const password = randomPassword()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-contact-crud-verification',
      label: 'core',
    },
  })

  if (error) throw new Error(`core journey createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('core journey createUser did not return an id')

  state.user = { id: data.user.id, email, password }
  appendEvidence(`  - created core journey auth user: ${data.user.id}`)
}

async function signIn(page: Page, state: CoreState) {
  if (!state.user) throw new Error('core journey user was not provisioned')
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(state.user.email)
  await page.locator('input[type="password"]').fill(state.user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(
    (url) => ['/founder/contacts', '/founder/dashboard'].includes(url.pathname),
    { timeout: 15000 }
  )
}

async function cleanup(admin: SupabaseClient, state: CoreState) {
  if (state.campaignIds.length > 0) {
    const { error } = await admin.from('email_campaigns').delete().in('id', state.campaignIds)
    if (error) throw new Error(`core campaign cleanup failed: ${error.message}`)
  }

  if (state.user && state.cacheKeys.length > 0) {
    const { error } = await admin
      .from('ai_file_cache')
      .delete()
      .eq('founder_id', state.user.id)
      .in('cache_key', state.cacheKeys)
    if (error && !error.message.includes("Could not find the table 'public.ai_file_cache'")) {
      throw new Error(`core file-cache cleanup failed: ${error.message}`)
    }
  }

  if (state.user) {
    const { error } = await admin.auth.admin.deleteUser(state.user.id)
    if (error) throw new Error(`core auth-user cleanup failed: ${error.message}`)
    const { data, error: getError } = await admin.auth.admin.getUserById(state.user.id)
    if (getError && !getError.message.toLowerCase().includes('user not found')) {
      throw new Error(`core auth-user cleanup re-query failed: ${getError.message}`)
    }
    if (data.user) throw new Error(`core auth-user cleanup re-query found ${state.user.id}`)
  }

  appendEvidence(`  - cleanup verified for core journey marker ${state.marker}`)
}

test.describe('core journey verification guard', () => {
  test('real-user journeys have admin provisioning available', async () => {
    const { ok, missing } = hasSupabaseAdminProvisioning()
    expect(
      missing,
      `Core journey e2e cannot provision tagged throwaway auth users: ${missing.join(', ')}`
    ).toEqual([])
    expect(ok).toBe(true)
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

  test('authenticated integrations, email campaign, and file boundaries are exercised with a throwaway user', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const state: CoreState = { marker, campaignIds: [], cacheKeys: [] }
    const admin = makeAdminClient()

    appendEvidence(`\n### Core authenticated journey run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated password was kept in memory only and was not logged.')

    try {
      await provisionUser(admin, state)
      const context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state)

      const integrations = await page.request.get('/api/integrations/status')
      const integrationsBody = await integrations.json()
      expect(integrations.status(), JSON.stringify({ step: 'integrations-status', body: integrationsBody })).toBe(200)
      expect(Array.isArray(integrationsBody.providers)).toBe(true)
      expect(integrationsBody.summary).toMatchObject({ total: integrationsBody.providers.length })
      expect(integrationsBody.providers.map((provider: { id: string }) => provider.id)).toEqual(
        expect.arrayContaining(['gmail', 'xero', 'linear', 'sendgrid'])
      )
      appendEvidence(`  - integrations status returned 200 with ${integrationsBody.providers.length} providers`)

      const campaignName = `__PW_TEST__${marker}`
      const createCampaign = await page.request.post('/api/email/campaigns', {
        data: {
          businessKey: 'playwright',
          name: campaignName,
          subject: `__PW_TEST__${marker}`,
          bodyHtml: '<p>Playwright verification only.</p>',
          bodyText: 'Playwright verification only.',
          recipientList: [],
          categories: ['__PW_TEST__'],
        },
      })
      const createCampaignBody = await createCampaign.json()
      expect(createCampaign.status(), JSON.stringify({ step: 'email-campaign-create', body: createCampaignBody })).toBe(201)
      const campaignId = createCampaignBody.campaign?.id as string | undefined
      expect(campaignId).toBeTruthy()
      state.campaignIds.push(campaignId!)
      appendEvidence(`  - created tagged email campaign: ${campaignId}`)

      const listCampaigns = await page.request.get('/api/email/campaigns?business=playwright')
      const listCampaignsBody = await listCampaigns.json()
      expect(listCampaigns.status(), JSON.stringify({ step: 'email-campaign-list', body: listCampaignsBody })).toBe(200)
      expect((listCampaignsBody.campaigns as Array<{ id: string }>).some((campaign) => campaign.id === campaignId)).toBe(true)

      const sendCampaign = await page.request.post(`/api/email/campaigns/${campaignId}/send`)
      const sendCampaignBody = await sendCampaign.json()
      expect(sendCampaign.status(), JSON.stringify({ step: 'email-campaign-send-empty-list', body: sendCampaignBody })).toBe(400)
      expect(sendCampaignBody.error).toBe('Campaign has no recipients')
      appendEvidence(`  - campaign send path blocked without recipients before any provider send: ${campaignId}`)

      const filesList = await page.request.get('/api/files')
      const filesListBody = await filesList.json()
      expect(filesList.status(), JSON.stringify({ step: 'files-list', body: filesListBody })).toBe(200)
      expect(Array.isArray(filesListBody.files)).toBe(true)
      appendEvidence(`  - files list returned 200 with ${filesListBody.files.length} cached files`)

      const cacheKey = `__PW_TEST__${safeMarker(marker)}`
      state.cacheKeys.push(cacheKey)
      const upload = await page.request.post('/api/files', {
        multipart: {
          cacheKey,
          ttlDays: '1',
          file: {
            name: `__PW_TEST__${safeMarker(marker)}.txt`,
            mimeType: 'text/plain',
            buffer: Buffer.from('Playwright verification file.'),
          },
        },
      })
      const uploadBody = await upload.json()
      expect([201, 500], JSON.stringify({ step: 'file-upload', status: upload.status(), body: uploadBody })).toContain(upload.status())
      if (upload.status() === 201) {
        expect(uploadBody).toMatchObject({ cacheKey, filename: `__PW_TEST__${safeMarker(marker)}.txt`, sizeBytes: 29 })
        appendEvidence(`  - tiny file upload returned 201 with cacheKey ${cacheKey}`)
      } else {
        expect(String(uploadBody.error ?? '')).toContain('ANTHROPIC_API_KEY')
        appendEvidence('  - tiny file upload returned 500 with ANTHROPIC_API_KEY credential blocker; transcription remains UNKNOWN')
      }

      await context.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
