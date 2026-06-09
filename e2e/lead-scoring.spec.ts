import { appendFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadSupabaseAdminConfig } from './support/supabase-admin-config'
import { qualifyLead } from '../src/lib/crm/qualify-lead'

const evidencePath = 'EVIDENCE.md'
const decisionsPath = 'DECISIONS_NEEDED.md'

type TestUser = {
  label: 'A' | 'B'
  email: string
  password: string
  id?: string
}

type CreatedContact = {
  label: 'A' | 'B'
  id: string
  email: string
}

type CleanupState = {
  marker: string
  users: TestUser[]
  contacts: CreatedContact[]
}

function isoMarker() {
  return new Date().toISOString()
}

function emailSafeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function makeAdminClient() {
  const cfg = loadSupabaseAdminConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function appendEvidence(line: string) {
  if (process.env.LEAD_SCORING_APPEND_EVIDENCE !== '1') return
  appendFileSync(evidencePath, `${line}\n`)
}

function appendDecision(line: string) {
  appendFileSync(decisionsPath, `${line}\n`)
}

async function createUser(admin: SupabaseClient, user: TestUser, state: CleanupState) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-lead-scoring-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`createUser ${user.label} failed: ${error.message}`)
  if (!data.user?.id) throw new Error(`createUser ${user.label} did not return an id`)

  user.id = data.user.id
  appendEvidence(`  - created lead scoring auth user ${user.label}: ${user.id}`)
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

async function createScoringContact(request: APIRequestContext, user: TestUser, state: CleanupState) {
  const safeMarker = emailSafeMarker(state.marker)
  const contactEmail = `playwright+lead-scoring+${safeMarker}+${user.label.toLowerCase()}@unite-hub.invalid`
  const signals = {
    message: 'We need CRM automation, sales pipeline integration, and marketing rollout support for a national implementation.',
    interests: ['crm', 'automation', 'sales'],
    marketingConsent: true,
    referralSource: 'partner',
    source: 'playwright-e2e',
  }

  const response = await request.post('/api/contacts', {
    data: {
      first_name: 'Playwright',
      last_name: `Lead ${user.label}`,
      email: contactEmail,
      phone: '+61400111222',
      company: `__PW_LEAD_SCORING__${state.marker}`,
      role: 'Head of Sales',
      status: 'lead',
      tags: ['__PW_LEAD_SCORING__', state.marker, `user-${user.label}`],
      metadata: {
        marker: state.marker,
        purpose: 'playwright-lead-scoring-verification',
        ...signals,
      },
    },
  })
  const body = await response.json().catch(async () => ({ raw: await response.text() }))

  expect(response.status(), JSON.stringify({ step: 'create-contact', user: user.label, status: response.status(), body })).toBe(201)
  const id = (body as { id?: string }).id
  expect(id, JSON.stringify({ step: 'create-contact-id', user: user.label, body })).toBeTruthy()

  const contact = { label: user.label, id: id!, email: contactEmail }
  state.contacts.push(contact)
  appendEvidence(`  - created lead scoring contact ${user.label}: ${contact.id} (${contact.email})`)

  const expected = qualifyLead({
    email: contactEmail,
    phone: '+61400111222',
    company: `__PW_LEAD_SCORING__${state.marker}`,
    jobTitle: 'Head of Sales',
    ...signals,
  })

  return { contact, expected }
}

async function readContact(request: APIRequestContext, id: string) {
  const response = await request.get(`/api/contacts/${id}`)
  const body = await response.json().catch(async () => ({ raw: await response.text() }))
  return { response, body }
}

async function cleanup(admin: SupabaseClient, state: CleanupState) {
  const leftovers: Record<string, Array<{ id: string; error: string }>> = { contacts: [], users: [] }
  const contactIds = state.contacts.map((contact) => contact.id)

  if (contactIds.length > 0) {
    const { error } = await admin.from('contacts').delete().in('id', contactIds)
    if (error) leftovers.contacts.push(...contactIds.map((id) => ({ id, error: `delete failed: ${error.message}` })))
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) leftovers.users.push({ id: user.id, error: `delete failed: ${error.message}` })
  }

  if (contactIds.length > 0) {
    const { data, error } = await admin.from('contacts').select('id').in('id', contactIds)
    if (error) {
      leftovers.contacts.push(...contactIds.map((id) => ({ id, error: `re-query failed: ${error.message}` })))
    } else {
      leftovers.contacts.push(...(data ?? []).map((row) => ({
        id: row.id as string,
        error: 're-query found contact after cleanup',
      })))
    }
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { data, error } = await admin.auth.admin.getUserById(user.id)
    if (error && !error.message.toLowerCase().includes('user not found')) {
      leftovers.users.push({ id: user.id, error: `post-delete re-query failed: ${error.message}` })
    } else if (data.user) {
      leftovers.users.push({ id: user.id, error: 're-query found auth user after cleanup' })
    }
  }

  if (Object.values(leftovers).some((values) => values.length > 0)) {
    appendDecision(`\n## Added ${new Date().toISOString()} - Lead scoring cleanup incomplete\n\nLeftover test IDs for marker ${state.marker}: ${JSON.stringify(leftovers)}\n`)
    throw new Error(`cleanup incomplete: ${JSON.stringify(leftovers)}`)
  }

  appendEvidence(`  - cleanup verified for lead scoring marker ${state.marker}: contacts/users removed`)
}

test.describe('authenticated Lead Scoring API', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('scores a real contact, persists metadata, and blocks cross-founder scoring', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = isoMarker()
    const safeMarker = emailSafeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+lead-scoring+${safeMarker}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+lead-scoring+${safeMarker}+b@unite-hub.test`, password: randomPassword() },
      ],
      contacts: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### Lead scoring API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated passwords were kept in memory only and were not logged.')
    appendEvidence('- Persistence note: current contacts table has no ai_score column; route persists to contacts.metadata.leadQualification.')

    try {
      await createUser(admin, state.users[0], state)
      await createUser(admin, state.users[1], state)

      const contextA = await browser.newContext()
      const pageA = await contextA.newPage()
      await signIn(pageA, state.users[0])

      const contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])

      const { contact: contactA, expected } = await createScoringContact(pageA.request, state.users[0], state)
      const { contact: contactB } = await createScoringContact(pageB.request, state.users[1], state)

      const scoreResponse = await pageA.request.post(`/api/contacts/${contactA.id}/score`)
      const scoreBody = await scoreResponse.json().catch(async () => ({ raw: await scoreResponse.text() }))
      expect(scoreResponse.status(), JSON.stringify({ step: 'score-a', status: scoreResponse.status(), body: scoreBody })).toBe(200)
      expect((scoreBody as { result?: { score?: number } }).result?.score).toBe(expected.score)
      expect((scoreBody as { result?: { band?: string } }).result?.band).toBe(expected.band)
      expect((scoreBody as { persisted?: { column?: string; aiScoreColumn?: string } }).persisted?.column).toBe('metadata.leadQualification')
      expect((scoreBody as { persisted?: { aiScoreColumn?: string } }).persisted?.aiScoreColumn).toBe('missing')

      const reread = await readContact(pageA.request, contactA.id)
      expect(reread.response.status(), JSON.stringify({ step: 'reread-a', body: reread.body })).toBe(200)
      const persisted = (reread.body as { metadata?: { leadQualification?: { score?: number; band?: string } } }).metadata?.leadQualification
      expect(persisted?.score, JSON.stringify({ step: 'persisted-score', persisted, expected })).toBe(expected.score)
      expect(persisted?.band, JSON.stringify({ step: 'persisted-band', persisted, expected })).toBe(expected.band)
      appendEvidence(`  - scored contact ${contactA.id}: expected score ${expected.score}, persisted metadata score ${persisted?.score}`)

      const crossScopeResponse = await pageA.request.post(`/api/contacts/${contactB.id}/score`)
      const crossScopeBody = await crossScopeResponse.json().catch(async () => ({ raw: await crossScopeResponse.text() }))
      expect(crossScopeResponse.status(), JSON.stringify({ step: 'a-cannot-score-b', body: crossScopeBody })).toBe(404)
      appendEvidence(`  - cross-founder scoring blocked: A received 404 for B contact ${contactB.id}`)

      await contextA.close()
      await contextB.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
