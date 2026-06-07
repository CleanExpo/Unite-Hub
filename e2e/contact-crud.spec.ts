import { appendFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { test, expect, type APIRequestContext, type Browser, type Page } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false })

const productionRef = 'lksfwktwtmyznckodsau'
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
  workspaceIds: string[]
}

type CleanupLeftover = {
  id: string
  error: string
}

function loadConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const missing = [
    ['NEXT_PUBLIC_SUPABASE_URL', url],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Contact CRUD production-write exception precondition failed; missing ${missing.join(', ')}`)
  }

  const host = new URL(url!).host
  if (host.split('.')[0] !== productionRef) {
    throw new Error(`Expected production Supabase host for the approved exception, got ${host}`)
  }

  return { url: url!, anonKey: anonKey!, serviceRoleKey: serviceRoleKey!, host }
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
  const cfg = loadConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function appendEvidence(line: string) {
  if (process.env.CONTACT_CRUD_APPEND_EVIDENCE !== '1') return
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
      purpose: 'playwright-contact-crud-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`createUser ${user.label} failed: ${error.message}`)
  if (!data.user?.id) throw new Error(`createUser ${user.label} did not return an id`)

  user.id = data.user.id
  appendEvidence(`  - created test auth user ${user.label}: ${user.id}`)
}

async function signIn(page: Page, user: TestUser) {
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/founder\/contacts|\/founder\/dashboard/, { timeout: 15000 })
}

async function createTaggedContact(request: APIRequestContext, user: TestUser, state: CleanupState) {
  const contactEmail = `playwright+crud+${emailSafeMarker(state.marker)}+${user.label.toLowerCase()}@unite-hub.test`
  const response = await request.post('/api/contacts', {
    data: {
      first_name: 'Playwright',
      last_name: `CRUD ${user.label}`,
      email: contactEmail,
      company: `__PW_CRUD_TEST__${state.marker}`,
      role: 'Verification Test Contact',
      status: 'lead',
      tags: ['__PW_CRUD_TEST__', state.marker, `user-${user.label}`],
      metadata: {
        marker: state.marker,
        purpose: 'playwright-contact-crud-verification',
        testUserLabel: user.label,
      },
    },
  })
  const body = await response.json().catch(async () => ({ raw: await response.text() }))

  expect(response.status(), JSON.stringify({ step: 'create', user: user.label, status: response.status(), body })).toBe(201)
  const id = (body as { id?: string }).id
  expect(id, JSON.stringify({ step: 'create', user: user.label, body })).toBeTruthy()

  const created = { label: user.label, id: id!, email: contactEmail }
  state.contacts.push(created)
  appendEvidence(`  - created test contact ${user.label}: ${created.id} (${created.email})`)

  return { response, body, contact: created }
}

async function listContacts(request: APIRequestContext) {
  const response = await request.get('/api/contacts')
  const body = await response.json().catch(async () => ({ raw: await response.text() }))
  expect(response.status(), JSON.stringify({ step: 'list', status: response.status(), body })).toBe(200)
  expect(Array.isArray(body), JSON.stringify({ step: 'list', body })).toBe(true)
  return body as Array<{ id: string; email?: string | null; founder_id?: string; company?: string | null }>
}

async function readContact(request: APIRequestContext, id: string) {
  const response = await request.get(`/api/contacts/${id}`)
  const body = await response.json().catch(async () => ({ raw: await response.text() }))
  return { response, body }
}

async function assertContactGone(admin: SupabaseClient, contactIds: string[]) {
  if (contactIds.length === 0) return []
  const { data, error } = await admin
    .from('contacts')
    .select('id')
    .in('id', contactIds)

  if (error) throw new Error(`cleanup contact re-query failed: ${error.message}`)
  return data ?? []
}

async function cleanup(admin: SupabaseClient, state: CleanupState) {
  const leftover: Record<string, CleanupLeftover[]> = { contacts: [], workspaces: [], users: [] }
  const contactIds = state.contacts.map((contact) => contact.id)

  if (contactIds.length > 0) {
    const { error } = await admin
      .from('contacts')
      .delete()
      .in('id', contactIds)
    if (error) {
      leftover.contacts.push(...contactIds.map((id) => ({ id, error: `delete failed: ${error.message}` })))
    }
  }

  for (const id of state.workspaceIds) {
    const { error } = await admin.from('workspaces').delete().eq('id', id)
    if (error) leftover.workspaces.push({ id, error: `delete failed: ${error.message}` })
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) leftover.users.push({ id: user.id, error: `delete failed: ${error.message}` })
  }

  const remainingContacts = await assertContactGone(admin, contactIds)
  leftover.contacts.push(...remainingContacts.map((row) => ({
    id: row.id as string,
    error: 're-query found contact after cleanup',
  })))

  for (const user of state.users) {
    if (!user.id) continue
    const { data, error } = await admin.auth.admin.getUserById(user.id)
    if (error) {
      leftover.users.push({ id: user.id, error: `post-delete re-query failed: ${error.message}` })
    } else if (data.user) {
      leftover.users.push({ id: user.id, error: 're-query found auth user after cleanup' })
    }
  }

  const deduped = Object.fromEntries(
    Object.entries(leftover).map(([key, values]) => {
      const byIdAndError = new Map(values.map((value) => [`${value.id}:${value.error}`, value]))
      return [key, [...byIdAndError.values()]]
    })
  ) as Record<string, CleanupLeftover[]>

  if (Object.values(deduped).some((values) => values.length > 0)) {
    const message = `\n## Added ${new Date().toISOString()} - Contact CRUD cleanup incomplete\n\nLeftover test IDs for marker ${state.marker}: ${JSON.stringify(deduped)}\n`
    appendDecision(message)
    throw new Error(`cleanup incomplete: ${JSON.stringify(deduped)}`)
  }

  appendEvidence(`  - cleanup verified for marker ${state.marker}: contacts/users removed; workspace IDs created: ${state.workspaceIds.length}`)
}

test.describe('authenticated Contact CRUD approved production-write verification', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('proves CRUD and cross-user isolation with tagged throwaway rows', async ({ browser }) => {
    const cfg = loadConfig()
    const marker = isoMarker()
    const safeMarker = emailSafeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+crud+${safeMarker}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+crud+${safeMarker}+b@unite-hub.test`, password: randomPassword() },
      ],
      contacts: [],
      workspaceIds: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### Contact CRUD approved production-write run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated passwords were kept in memory only and were not logged.')
    appendEvidence('- Workspace note: live Contact API is founder-scoped and has no workspace_id; workspaces require an organization parent, which is outside this write exception.')

    try {
      await createUser(admin, state.users[0], state)
      await createUser(admin, state.users[1], state)

      const contextA = await browser.newContext()
      const pageA = await contextA.newPage()
      await signIn(pageA, state.users[0])
      await contextA.storageState({ path: '.playwright/contact-crud-storage-a.json' })

      const contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])
      await contextB.storageState({ path: '.playwright/contact-crud-storage-b.json' })

      const createA = await createTaggedContact(pageA.request, state.users[0], state)
      const listAAfterCreate = await listContacts(pageA.request)
      expect(listAAfterCreate.some((row) => row.id === createA.contact.id), JSON.stringify({
        step: 'list-a-after-create',
        createdId: createA.contact.id,
        visibleIds: listAAfterCreate.map((row) => row.id),
      })).toBe(true)

      const updateResponse = await pageA.request.patch(`/api/contacts/${createA.contact.id}`, {
        data: {
          status: 'prospect',
          company: `__PW_CRUD_TEST__${state.marker}__UPDATED`,
          metadata: {
            marker: state.marker,
            purpose: 'playwright-contact-crud-verification',
            updated: true,
          },
        },
      })
      const updateBody = await updateResponse.json().catch(async () => ({ raw: await updateResponse.text() }))
      expect(updateResponse.status(), JSON.stringify({ step: 'update-a', status: updateResponse.status(), body: updateBody })).toBe(200)
      expect((updateBody as { status?: string }).status).toBe('prospect')
      expect((updateBody as { company?: string }).company).toBe(`__PW_CRUD_TEST__${state.marker}__UPDATED`)

      const readUpdated = await readContact(pageA.request, createA.contact.id)
      expect(readUpdated.response.status(), JSON.stringify({ step: 'read-updated-a', body: readUpdated.body })).toBe(200)
      expect((readUpdated.body as { status?: string }).status).toBe('prospect')
      expect((readUpdated.body as { company?: string }).company).toBe(`__PW_CRUD_TEST__${state.marker}__UPDATED`)

      const createB = await createTaggedContact(pageB.request, state.users[1], state)

      const listAAfterB = await listContacts(pageA.request)
      const listBAfterB = await listContacts(pageB.request)

      expect(listAAfterB.some((row) => row.id === createB.contact.id), JSON.stringify({
        step: 'rls-a-cannot-list-b',
        bContactId: createB.contact.id,
        visibleIds: listAAfterB.map((row) => row.id),
      })).toBe(false)
      expect(listBAfterB.some((row) => row.id === createA.contact.id), JSON.stringify({
        step: 'rls-b-cannot-list-a',
        aContactId: createA.contact.id,
        visibleIds: listBAfterB.map((row) => row.id),
      })).toBe(false)

      const aReadsB = await readContact(pageA.request, createB.contact.id)
      expect(aReadsB.response.status(), JSON.stringify({ step: 'rls-a-cannot-read-b', body: aReadsB.body })).toBe(404)
      const bReadsA = await readContact(pageB.request, createA.contact.id)
      expect(bReadsA.response.status(), JSON.stringify({ step: 'rls-b-cannot-read-a', body: bReadsA.body })).toBe(404)

      const deleteAResponse = await pageA.request.delete(`/api/contacts/${createA.contact.id}`)
      const deleteABody = await deleteAResponse.json().catch(async () => ({ raw: await deleteAResponse.text() }))
      expect(deleteAResponse.status(), JSON.stringify({ step: 'delete-a', status: deleteAResponse.status(), body: deleteABody })).toBe(200)
      state.contacts = state.contacts.filter((contact) => contact.id !== createA.contact.id)

      const readDeletedA = await readContact(pageA.request, createA.contact.id)
      expect(readDeletedA.response.status(), JSON.stringify({ step: 'read-deleted-a', body: readDeletedA.body })).toBe(404)
      appendEvidence(`  - authenticated delete verified for contact A: ${createA.contact.id}`)

      await contextA.close()
      await contextB.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
