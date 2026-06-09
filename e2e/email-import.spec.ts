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
  contactEmails: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.EMAIL_IMPORT_APPEND_EVIDENCE !== '1') return
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
      purpose: 'playwright-email-import-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`email import createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('email import createUser did not return an id')
  user.id = data.user.id
  appendEvidence(`  - created email import auth user ${user.label}: ${data.user.id}`)
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
  if (state.contactEmails.length > 0) {
    const userIds = state.users.flatMap((user) => user.id ? [user.id] : [])
    const { error } = await admin
      .from('contacts')
      .delete()
      .in('founder_id', userIds)
      .in('email', state.contactEmails)
    if (error) throw new Error(`email import contact cleanup failed: ${error.message}`)

    const { data, error: requeryError } = await admin
      .from('contacts')
      .select('id')
      .in('founder_id', userIds)
      .in('email', state.contactEmails)
    if (requeryError) throw new Error(`email import contact cleanup re-query failed: ${requeryError.message}`)
    if ((data ?? []).length > 0) throw new Error(`email import cleanup left ${data?.length ?? 0} contacts`)
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`email import auth-user cleanup failed: ${error.message}`)
  }

  appendEvidence(`  - cleanup verified for email import marker ${state.marker}`)
}

test.describe('authenticated email import to contacts', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('fails closed before authentication', async ({ request }) => {
    const response = await request.post('/api/email/contacts/import', {
      data: {
        source: 'gmail_mock',
        senderEmail: 'playwright+email-import+unauth@unite-hub.test',
      },
      maxRedirects: 0,
    })

    expect(
      [307, 401],
      `/api/email/contacts/import should redirect to login or return 401 before auth; got ${response.status()}`
    ).toContain(response.status())
  })

  test('imports a mocked Gmail sender once and scopes it to the authenticated founder', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const safe = safeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+email-import+${safe}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+email-import+${safe}+b@unite-hub.test`, password: randomPassword() },
      ],
      contactEmails: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### Email import API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated passwords were kept in memory only and were not logged.')
    appendEvidence('- Provider note: gmail_mock proves sender-to-contact import without live Google consent.')

    let context: BrowserContext | undefined
    let contextB: BrowserContext | undefined

    try {
      await provisionUser(admin, state, state.users[0])
      await provisionUser(admin, state, state.users[1])

      context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state.users[0])

      const senderEmail = `playwright+gmail-import+${safe}@unite-hub.test`.toLowerCase()
      state.contactEmails.push(senderEmail)

      const firstImport = await page.request.post('/api/email/contacts/import', {
        data: {
          source: 'gmail_mock',
          senderEmail,
          senderName: 'Gmail Import',
          company: '__PW_TEST__ Email Import',
          threadId: `__PW_TEST__THREAD__${safe}`,
          accountEmail: state.users[0].email,
        },
      })
      const firstBody = await firstImport.json().catch(async () => ({ raw: await firstImport.text() }))
      expect(firstImport.status(), JSON.stringify({ step: 'first-import', body: firstBody })).toBe(201)
      const contactId = (firstBody as { contact?: { id?: string } }).contact?.id
      expect(contactId).toBeTruthy()
      expect(firstBody).toMatchObject({
        created: true,
        source: 'mocked_gmail_sender',
        contact: {
          email: senderEmail,
          status: 'lead',
          company: '__PW_TEST__ Email Import',
        },
      })

      const duplicate = await page.request.post('/api/email/contacts/import', {
        data: {
          source: 'gmail_mock',
          senderEmail,
          senderName: 'Gmail Import',
        },
      })
      const duplicateBody = await duplicate.json().catch(async () => ({ raw: await duplicate.text() }))
      expect(duplicate.status(), JSON.stringify({ step: 'duplicate-import', body: duplicateBody })).toBe(200)
      expect(duplicateBody).toMatchObject({ created: false, contact: { id: contactId } })

      const { data, error } = await admin
        .from('contacts')
        .select('id,founder_id,email,metadata')
        .eq('founder_id', state.users[0].id!)
        .eq('email', senderEmail)
      expect(error, JSON.stringify({ step: 'admin-reread', error })).toBeNull()
      expect(data?.map((row) => row.id)).toEqual([contactId])

      contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])
      const listB = await pageB.request.get('/api/contacts')
      const listBBody = await listB.json().catch(async () => ({ raw: await listB.text() }))
      expect(listB.status(), JSON.stringify({ step: 'list-b', body: listBBody })).toBe(200)
      expect(Array.isArray(listBBody)).toBe(true)
      expect((listBBody as Array<{ email?: string }>).some((contact) => contact.email === senderEmail)).toBe(false)

      appendEvidence(`  - imported mocked Gmail sender to contact ${contactId}: ${senderEmail}`)
      appendEvidence('  - duplicate import returned existing contact instead of creating another')
      appendEvidence(`  - cross-user isolation verified: user B could not list ${senderEmail}`)
    } finally {
      await contextB?.close().catch(() => undefined)
      await context?.close().catch(() => undefined)
      await cleanup(admin, state)
    }
  })
})
