import { existsSync, readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { config as loadDotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

for (const file of ['.env.local', '.env.test']) {
  if (existsSync(file)) loadDotenv({ path: file, override: false })
}

const productionRef = 'lksfwktwtmyznckodsau'
const statePath = '.playwright/contact-crud-state.json'

type VerificationState = {
  otherContactId?: string
}

function supabaseHost(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is unavailable to the Contact CRUD effect test')
  return new URL(url).host
}

function isProductionHost(): boolean {
  return supabaseHost().split('.')[0] === productionRef
}

function testCredentials() {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL ?? process.env.TEST_FOUNDER_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD ?? process.env.TEST_FOUNDER_PASSWORD
  if (!email || !password) {
    throw new Error('PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD are unavailable to the authenticated Contact CRUD test')
  }
  return { email, password }
}

function readState(): VerificationState {
  if (!existsSync(statePath)) return {}
  return JSON.parse(readFileSync(statePath, 'utf8')) as VerificationState
}

async function signIn(page: Page) {
  const { email, password } = testCredentials()
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/founder\/contacts|\/founder\/dashboard/, { timeout: 15000 })
  await page.context().storageState({ path: '.playwright/contact-crud-storage.json' })
}

async function readOnlyOtherContactId(authedFounderId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin
    .from('contacts')
    .select('id, founder_id')
    .neq('founder_id', authedFounderId)
    .limit(1)

  if (error) {
    throw new Error(`Read-only other-founder RLS probe setup failed: ${error.message}`)
  }

  return data?.[0]?.id ?? null
}

test.describe('authenticated Contact CRUD verification', () => {
  test('proves the allowed Contact path for the current Supabase host', async ({ page }) => {
    const host = supabaseHost()
    await signIn(page)

    const listResponse = await page.request.get('/api/contacts')
    const listBody = await listResponse.json().catch(async () => ({ raw: await listResponse.text() }))
    const listSummary = {
      host,
      status: listResponse.status(),
      rowCount: Array.isArray(listBody) ? listBody.length : null,
      bodyType: Array.isArray(listBody) ? 'array' : typeof listBody,
    }
    expect.soft(listSummary).toBeTruthy()
    expect(listResponse.status(), JSON.stringify(listSummary)).toBe(200)
    expect(Array.isArray(listBody), JSON.stringify(listSummary)).toBe(true)

    const visibleFounderIds = new Set(
      (listBody as Array<{ founder_id?: string }>).map((row) => row.founder_id).filter(Boolean)
    )
    expect(visibleFounderIds.size, JSON.stringify({ host, visibleFounderIds: [...visibleFounderIds] })).toBeLessThanOrEqual(1)
    const authedFounderId = [...visibleFounderIds][0]

    const state = readState()
    const otherContactId = state.otherContactId ?? (authedFounderId ? await readOnlyOtherContactId(authedFounderId) : null)
    if (otherContactId) {
      const otherContactResponse = await page.request.get(`/api/contacts/${otherContactId}`)
      const otherContactBody = await otherContactResponse.json().catch(async () => ({ raw: await otherContactResponse.text() }))
      expect(
        otherContactResponse.status(),
        JSON.stringify({
          host,
          otherContactPath: '/api/contacts/<other-founder-contact-id>',
          status: otherContactResponse.status(),
          bodyKeys: otherContactBody && typeof otherContactBody === 'object' ? Object.keys(otherContactBody) : [],
        })
      ).toBe(404)
    }

    if (isProductionHost()) {
      test.info().annotations.push({
        type: 'prod-safe',
        description: `Production host ${host}; create/update/delete intentionally not attempted`,
      })
      return
    }

    const unique = Date.now()
    const createPayload = {
      first_name: 'Verification',
      last_name: `Contact ${unique}`,
      email: `contact-crud-${unique}@example.test`,
      company: 'Unite Hub Verification',
      status: 'lead',
      tags: ['verification'],
      metadata: { marker: `contact-crud-${unique}` },
    }

    const createResponse = await page.request.post('/api/contacts', { data: createPayload })
    const createBody = await createResponse.json().catch(async () => ({ raw: await createResponse.text() }))
    expect(createResponse.status(), JSON.stringify({ host, body: createBody })).toBe(201)
    const createdId = (createBody as { id?: string }).id
    expect(createdId, JSON.stringify({ host, body: createBody })).toBeTruthy()

    try {
      const postCreateList = await page.request.get('/api/contacts')
      const postCreateBody = await postCreateList.json() as Array<{ id: string }>
      expect(postCreateList.status(), JSON.stringify({ host, rowCount: postCreateBody.length })).toBe(200)
      expect(postCreateBody.some((row) => row.id === createdId), JSON.stringify({ host, createdId })).toBe(true)

      const updateResponse = await page.request.patch(`/api/contacts/${createdId}`, {
        data: { status: 'prospect', company: 'Updated Verification Company' },
      })
      const updateBody = await updateResponse.json().catch(async () => ({ raw: await updateResponse.text() }))
      expect(updateResponse.status(), JSON.stringify({ host, body: updateBody })).toBe(200)
      expect((updateBody as { status?: string }).status).toBe('prospect')
      expect((updateBody as { company?: string }).company).toBe('Updated Verification Company')

      const readUpdatedResponse = await page.request.get(`/api/contacts/${createdId}`)
      const readUpdatedBody = await readUpdatedResponse.json().catch(async () => ({ raw: await readUpdatedResponse.text() }))
      expect(readUpdatedResponse.status(), JSON.stringify({ host, body: readUpdatedBody })).toBe(200)
      expect((readUpdatedBody as { status?: string }).status).toBe('prospect')
      expect((readUpdatedBody as { company?: string }).company).toBe('Updated Verification Company')
    } finally {
      const deleteResponse = await page.request.delete(`/api/contacts/${createdId}`)
      const deleteBody = await deleteResponse.json().catch(async () => ({ raw: await deleteResponse.text() }))
      expect(deleteResponse.status(), JSON.stringify({ host, body: deleteBody })).toBe(200)

      const readDeletedResponse = await page.request.get(`/api/contacts/${createdId}`)
      expect(readDeletedResponse.status(), JSON.stringify({ host, createdId })).toBe(404)
    }
  })
})
