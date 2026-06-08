import { appendFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadSupabaseAdminConfig } from './support/supabase-admin-config'

type TestUser = {
  label: 'A' | 'B'
  email: string
  password: string
  id?: string
}

type CleanupState = {
  marker: string
  users: TestUser[]
  contactIds: string[]
  campaignIds: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.DRIP_CAMPAIGN_APPEND_EVIDENCE !== '1') return
  appendFileSync('EVIDENCE.md', `${line}\n`)
}

function makeAdminClient() {
  const cfg = loadSupabaseAdminConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function provisionUser(admin: SupabaseClient, state: CleanupState, user: TestUser) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-drip-campaign-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`drip createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('drip createUser did not return an id')
  user.id = data.user.id
  appendEvidence(`  - created drip auth user ${user.label}: ${data.user.id}`)
}

async function signIn(page: Page, user: TestUser) {
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(
    (url) => ['/founder/contacts', '/founder/dashboard'].includes(url.pathname),
    { timeout: 15000 }
  )
}

async function cleanup(admin: SupabaseClient, state: CleanupState) {
  if (state.campaignIds.length > 0) {
    const { error: eventError } = await admin.from('drip_events').delete().in('campaign_id', state.campaignIds)
    if (eventError) throw new Error(`drip event cleanup failed: ${eventError.message}`)

    const { error: enrollmentError } = await admin.from('drip_enrollments').delete().in('campaign_id', state.campaignIds)
    if (enrollmentError) throw new Error(`drip enrollment cleanup failed: ${enrollmentError.message}`)

    const { error: stepError } = await admin.from('drip_steps').delete().in('campaign_id', state.campaignIds)
    if (stepError) throw new Error(`drip step cleanup failed: ${stepError.message}`)

    const { error } = await admin.from('drip_campaigns').delete().in('id', state.campaignIds)
    if (error) throw new Error(`drip campaign cleanup failed: ${error.message}`)

    const { data, error: requeryError } = await admin
      .from('drip_campaigns')
      .select('id')
      .in('id', state.campaignIds)
    if (requeryError) throw new Error(`drip campaign cleanup re-query failed: ${requeryError.message}`)
    if ((data ?? []).length > 0) throw new Error(`drip cleanup left ${data?.length ?? 0} campaigns`)
  }

  if (state.contactIds.length > 0) {
    const { error } = await admin.from('contacts').delete().in('id', state.contactIds)
    if (error) throw new Error(`drip contact cleanup failed: ${error.message}`)

    const { data, error: requeryError } = await admin
      .from('contacts')
      .select('id')
      .in('id', state.contactIds)
    if (requeryError) throw new Error(`drip contact cleanup re-query failed: ${requeryError.message}`)
    if ((data ?? []).length > 0) throw new Error(`drip cleanup left ${data?.length ?? 0} contacts`)
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`drip auth-user cleanup failed: ${error.message}`)

    const { data, error: getError } = await admin.auth.admin.getUserById(user.id)
    if (getError && !getError.message.toLowerCase().includes('user not found')) {
      throw new Error(`drip auth-user re-query failed: ${getError.message}`)
    }
    if (data.user) throw new Error(`drip auth-user cleanup re-query found ${user.id}`)
  }

  appendEvidence(`  - cleanup verified for drip marker ${state.marker}`)
}

test.describe('authenticated drip campaign lifecycle', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('fails closed before authentication', async ({ request }) => {
    const response = await request.post('/api/campaigns/drip', {
      data: { action: 'process_pending', campaignId: '00000000-0000-0000-0000-000000000000' },
      maxRedirects: 0,
    })

    expect(
      [307, 401],
      `/api/campaigns/drip should redirect to login or return 401 before auth; got ${response.status()}`
    ).toContain(response.status())
  })

  test('creates, steps, enrolls, dry-runs, scopes, and cleans up', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const safe = safeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+drip+${safe}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+drip+${safe}+b@unite-hub.test`, password: randomPassword() },
      ],
      contactIds: [],
      campaignIds: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### Drip campaign API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated passwords were kept in memory only and were not logged.')
    appendEvidence('- Provider note: process_pending is dry-run only in this guard; no email provider send is attempted.')

    let context: BrowserContext | undefined
    let contextB: BrowserContext | undefined

    try {
      await provisionUser(admin, state, state.users[0])
      await provisionUser(admin, state, state.users[1])

      context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state.users[0])

      const contactEmail = `playwright+drip-contact+${safe}@unite-hub.test`
      const createContact = await page.request.post('/api/contacts', {
        data: {
          first_name: '__PW_TEST__DRIP',
          last_name: safe,
          email: contactEmail,
          status: 'lead',
          metadata: { marker, journey: 'drip-campaign' },
        },
      })
      const contactBody = await createContact.json().catch(async () => ({ raw: await createContact.text() }))
      expect(createContact.status(), JSON.stringify({ step: 'create-contact', body: contactBody })).toBe(201)
      const contactId = (contactBody as { id?: string }).id
      expect(contactId).toBeTruthy()
      state.contactIds.push(contactId!)

      const createCampaign = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'create_campaign',
          businessKey: 'playwright',
          name: `__PW_TEST__DRIP__${safe}`,
          subject: `__PW_TEST__DRIP__${safe}`,
          bodyHtml: '<p>Playwright drip lifecycle verification.</p>',
          bodyText: 'Playwright drip lifecycle verification.',
        },
      })
      const createCampaignBody = await createCampaign.json().catch(async () => ({ raw: await createCampaign.text() }))
      expect(createCampaign.status(), JSON.stringify({ step: 'create-campaign', body: createCampaignBody })).toBe(201)
      const campaignId = (createCampaignBody as { campaign?: { id?: string } }).campaign?.id
      expect(campaignId).toBeTruthy()
      state.campaignIds.push(campaignId!)

      const addStep = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'add_step',
          campaignId,
          subject: `__PW_TEST__STEP__${safe}`,
          bodyHtml: '<p>Step one, dry-run only.</p>',
          bodyText: 'Step one, dry-run only.',
          delayMinutes: 0,
        },
      })
      const addStepBody = await addStep.json().catch(async () => ({ raw: await addStep.text() }))
      expect(addStep.status(), JSON.stringify({ step: 'add-step', body: addStepBody })).toBe(200)
      expect((addStepBody as { stepCount?: number }).stepCount).toBe(1)

      const enroll = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'enroll_contact',
          campaignId,
          contactId,
        },
      })
      const enrollBody = await enroll.json().catch(async () => ({ raw: await enroll.text() }))
      expect(enroll.status(), JSON.stringify({ step: 'enroll', body: enrollBody })).toBe(200)
      expect((enrollBody as { enrollment?: { email?: string } }).enrollment?.email).toBe(contactEmail)

      const processPending = await page.request.post('/api/campaigns/drip', {
        data: {
          action: 'process_pending',
          campaignId,
          dryRun: true,
        },
      })
      const processBody = await processPending.json().catch(async () => ({ raw: await processPending.text() }))
      expect(processPending.status(), JSON.stringify({ step: 'process-pending', body: processBody })).toBe(200)
      expect(processBody).toMatchObject({
        result: {
          processed: 1,
          skipped: 0,
          failed: 0,
          dryRun: true,
          providerSend: 'not_attempted',
        },
      })

      const { data: persisted, error } = await admin
        .from('drip_campaigns')
        .select('id,founder_id,status')
        .eq('id', campaignId!)
        .eq('founder_id', state.users[0].id!)
        .single()
      expect(error, JSON.stringify({ step: 'admin-reread-campaign', error })).toBeNull()
      expect(persisted?.founder_id).toBe(state.users[0].id)

      const { data: persistedSteps, error: stepsError } = await admin
        .from('drip_steps')
        .select('id,founder_id,campaign_id,step_order')
        .eq('campaign_id', campaignId!)
        .eq('founder_id', state.users[0].id!)
        .order('step_order', { ascending: true })
      expect(stepsError, JSON.stringify({ step: 'admin-reread-steps', error: stepsError })).toBeNull()
      expect(persistedSteps?.length).toBe(1)
      expect(persistedSteps?.[0]).toMatchObject({ campaign_id: campaignId, step_order: 1 })

      const { data: persistedEnrollments, error: enrollmentsError } = await admin
        .from('drip_enrollments')
        .select('id,founder_id,campaign_id,contact_id,email,status,current_step_order,completed_at')
        .eq('campaign_id', campaignId!)
        .eq('founder_id', state.users[0].id!)
      expect(enrollmentsError, JSON.stringify({ step: 'admin-reread-enrollments', error: enrollmentsError })).toBeNull()
      expect(persistedEnrollments?.length).toBe(1)
      expect(persistedEnrollments?.[0]).toMatchObject({
        campaign_id: campaignId,
        contact_id: contactId,
        email: contactEmail,
        status: 'completed',
        current_step_order: 2,
      })
      expect(persistedEnrollments?.[0]?.completed_at).toBeTruthy()

      const { data: persistedEvents, error: eventsError } = await admin
        .from('drip_events')
        .select('id,founder_id,campaign_id,enrollment_id,contact_id,step_id,event_type,provider_send')
        .eq('campaign_id', campaignId!)
        .eq('founder_id', state.users[0].id!)
      expect(eventsError, JSON.stringify({ step: 'admin-reread-events', error: eventsError })).toBeNull()
      expect(persistedEvents?.length).toBe(1)
      expect(persistedEvents?.[0]).toMatchObject({
        campaign_id: campaignId,
        contact_id: contactId,
        step_id: persistedSteps?.[0]?.id,
        event_type: 'dry_run_processed',
        provider_send: 'not_attempted',
      })

      const { data: crossFounderRows, error: crossFounderRereadError } = await admin
        .from('drip_campaigns')
        .select('id')
        .eq('id', campaignId!)
        .eq('founder_id', state.users[1].id!)
      expect(crossFounderRereadError, JSON.stringify({
        step: 'admin-cross-founder-reread',
        error: crossFounderRereadError,
      })).toBeNull()
      expect(crossFounderRows).toEqual([])

      contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])
      const processAsB = await pageB.request.post('/api/campaigns/drip', {
        data: {
          action: 'process_pending',
          campaignId,
          dryRun: true,
        },
      })
      const processAsBBody = await processAsB.json().catch(async () => ({ raw: await processAsB.text() }))
      expect(processAsB.status(), JSON.stringify({ step: 'process-as-b', body: processAsBBody })).toBe(404)

      appendEvidence(`  - created drip contact ${contactId}: ${contactEmail}`)
      appendEvidence(`  - created drip campaign ${campaignId}`)
      appendEvidence('  - added one drip step and enrolled the tagged contact in dedicated drip tables')
      appendEvidence('  - process_pending dry-run returned processed=1, failed=0, providerSend=not_attempted')
      appendEvidence(`  - cross-user isolation verified: user B received 404 for campaign ${campaignId}`)
    } finally {
      await contextB?.close().catch(() => undefined)
      await context?.close().catch(() => undefined)
      await cleanup(admin, state)
    }
  })
})
