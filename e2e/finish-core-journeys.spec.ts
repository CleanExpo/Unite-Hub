import { randomBytes } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadSupabaseAdminConfig } from './support/supabase-admin-config'

type TestState = {
  marker: string
  user?: { id: string; email: string; password: string }
  contacts: string[]
  campaigns: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.FINISH_CORE_APPEND_EVIDENCE !== '1') return
  appendFileSync('EVIDENCE.md', `${line}\n`)
}

function makeAdminClient() {
  const cfg = loadSupabaseAdminConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function provisionUser(admin: SupabaseClient, state: TestState) {
  const email = `playwright+finish+${safeMarker(state.marker)}@unite-hub.test`
  const password = randomPassword()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-finish-core-journeys',
    },
  })

  if (error) throw new Error(`createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('createUser did not return an id')

  state.user = { id: data.user.id, email, password }
  appendEvidence(`  - created finish-core auth user: ${data.user.id}`)
}

async function signIn(page: Page, state: TestState) {
  if (!state.user) throw new Error('test user missing')
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(state.user.email)
  await page.locator('input[type="password"]').fill(state.user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(
    (url) => ['/founder/contacts', '/founder/dashboard'].includes(url.pathname),
    { timeout: 15000 }
  )
}

async function cleanup(admin: SupabaseClient, state: TestState) {
  if (state.campaigns.length > 0) {
    const { error } = await admin.from('email_campaigns').delete().in('id', state.campaigns)
    if (error) throw new Error(`campaign cleanup failed: ${error.message}`)
  }

  if (state.contacts.length > 0) {
    const { error } = await admin.from('contacts').delete().in('id', state.contacts)
    if (error) throw new Error(`contact cleanup failed: ${error.message}`)
  }

  if (state.user) {
    const { error } = await admin.auth.admin.deleteUser(state.user.id)
    if (error) throw new Error(`auth cleanup failed: ${error.message}`)
  }

  const [contacts, campaigns] = await Promise.all([
    state.contacts.length > 0 ? admin.from('contacts').select('id').in('id', state.contacts) : Promise.resolve({ data: [], error: null }),
    state.campaigns.length > 0 ? admin.from('email_campaigns').select('id').in('id', state.campaigns) : Promise.resolve({ data: [], error: null }),
  ])

  if (contacts.error) throw new Error(`contact cleanup re-query failed: ${contacts.error.message}`)
  if (campaigns.error) throw new Error(`campaign cleanup re-query failed: ${campaigns.error.message}`)
  if ((contacts.data ?? []).length > 0) throw new Error(`contacts left after cleanup: ${JSON.stringify(contacts.data)}`)
  if ((campaigns.data ?? []).length > 0) throw new Error(`campaigns left after cleanup: ${JSON.stringify(campaigns.data)}`)

  if (state.user) {
    const { data, error } = await admin.auth.admin.getUserById(state.user.id)
    if (error && !error.message.toLowerCase().includes('user not found')) {
      throw new Error(`auth cleanup re-query failed: ${error.message}`)
    }
    if (data.user) throw new Error(`auth user left after cleanup: ${state.user.id}`)
  }

  appendEvidence(`  - cleanup verified for finish-core marker ${state.marker}`)
}

test.describe('finish core journeys', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('proves drip, lead scoring, upload mock transcription, and Gmail consent boundary', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const state: TestState = { marker, contacts: [], campaigns: [] }
    const admin = makeAdminClient()

    appendEvidence(`\n### Finish core journey run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated password was kept in memory only and was not logged.')

    try {
      await provisionUser(admin, state)
      const context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state)

      const contactEmail = `playwright+finish+${safeMarker(marker)}+contact@unite-hub.test`
      const createContact = await page.request.post('/api/contacts', {
        data: {
          first_name: 'Playwright',
          last_name: 'Finish',
          email: contactEmail,
          phone: '+61 400 000 000',
          company: 'Acme Industrial',
          role: 'Operations Director',
          status: 'lead',
          tags: ['__PW_TEST__', marker],
          metadata: { marker, marketingConsent: true },
        },
      })
      const createContactBody = await createContact.json()
      expect(createContact.status(), JSON.stringify(createContactBody)).toBe(201)
      const contactId = createContactBody.id as string
      state.contacts.push(contactId)
      appendEvidence(`  - created tagged contact: ${contactId}`)

      const score = await page.request.post(`/api/contacts/${contactId}/score`, {
        data: {
          message: 'We need a CRM automation implementation and sales pipeline migration rollout for a multi-site operation.',
          interests: ['crm automation', 'sales pipeline'],
          marketingConsent: true,
          referralSource: 'partner',
          source: 'website',
        },
      })
      const scoreBody = await score.json()
      expect(score.status(), JSON.stringify(scoreBody)).toBe(200)
      expect(scoreBody.result).toMatchObject({ score: 100, band: 'qualified', recommendationOnly: true })

      const readScored = await page.request.get(`/api/contacts/${contactId}`)
      const readScoredBody = await readScored.json()
      expect(readScored.status(), JSON.stringify(readScoredBody)).toBe(200)
      expect(readScoredBody.metadata.leadQualification.score).toBe(100)
      appendEvidence(`  - lead scoring persisted score 100 for contact: ${contactId}`)

      const createDrip = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'create',
          businessKey: 'playwright',
          name: `__PW_TEST__${marker}`,
          subject: `__PW_TEST__${marker}`,
          bodyText: 'Initial drip draft.',
        },
      })
      const createDripBody = await createDrip.json()
      expect(createDrip.status(), JSON.stringify(createDripBody)).toBe(201)
      const campaignId = createDripBody.campaign.id as string
      state.campaigns.push(campaignId)

      const addStep = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'add_step',
          campaignId,
          delayHours: 0,
          subject: 'Playwright verification step',
          bodyText: 'Dry-run only verification step.',
        },
      })
      const addStepBody = await addStep.json()
      expect(addStep.status(), JSON.stringify(addStepBody)).toBe(200)
      expect(addStepBody.step.order).toBe(1)

      const enroll = await page.request.post('/api/campaigns/drip', {
        data: { action: 'enroll', campaignId, contactId },
      })
      const enrollBody = await enroll.json()
      expect(enroll.status(), JSON.stringify(enrollBody)).toBe(200)
      expect(enrollBody.enrollment.status).toBe('pending')

      const process = await page.request.post('/api/campaigns/drip', {
        data: { action: 'process_pending', campaignId },
      })
      const processBody = await process.json()
      expect(process.status(), JSON.stringify(processBody)).toBe(200)
      expect(processBody).toMatchObject({ processed: 1, skipped: 0, dryRun: true, emailSent: false })
      expect(processBody.enrollments[0]).toMatchObject({ status: 'processed', lastResult: 'dry_run_no_email_sent' })
      appendEvidence(`  - drip lifecycle processed campaign ${campaignId} in dry-run mode with no email sent`)

      const cacheKey = `__PW_TEST__${safeMarker(marker)}`
      const upload = await page.request.post('/api/files', {
        multipart: {
          cacheKey,
          ttlDays: '1',
          file: {
            name: `__PW_TEST__${safeMarker(marker)}.txt`,
            mimeType: 'text/plain',
            buffer: Buffer.from('Playwright transcription sample.'),
          },
        },
      })
      const uploadBody = await upload.json()
      expect(upload.status(), JSON.stringify(uploadBody)).toBe(201)
      expect(uploadBody).toMatchObject({ cacheKey, filename: `__PW_TEST__${safeMarker(marker)}.txt`, sizeBytes: 32 })

      const transcribe = await page.request.post('/api/files/transcribe', {
        multipart: {
          file: {
            name: `__PW_TEST__${safeMarker(marker)}.txt`,
            mimeType: 'text/plain',
            buffer: Buffer.from('Playwright transcription sample.'),
          },
        },
      })
      const transcribeBody = await transcribe.json()
      expect(transcribe.status(), JSON.stringify(transcribeBody)).toBe(200)
      expect(transcribeBody).toMatchObject({
        transcript: 'Playwright transcription sample.',
        provider: 'mock',
        liveProviderExecuted: false,
      })
      appendEvidence(`  - upload and transcription mock wiring returned 201/200 for cacheKey ${cacheKey}`)

      const authorize = await page.request.get('/api/auth/google/authorize', { maxRedirects: 0 })
      expect([400, 401, 503]).toContain(authorize.status())
      const callback = await page.request.get('/api/auth/google/callback', { maxRedirects: 0 })
      expect([302, 307, 308]).toContain(callback.status())
      appendEvidence('  - Gmail OAuth consent boundary verified; import remains human-gated')

      await context.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
