import { appendFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
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
  cacheKeys: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.FILE_UPLOAD_APPEND_EVIDENCE !== '1') return
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
      purpose: 'playwright-file-upload-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`file upload createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('file upload createUser did not return an id')
  user.id = data.user.id
  appendEvidence(`  - created file-upload auth user ${user.label}: ${data.user.id}`)
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
  let cacheCleanupError: Error | null = null

  const userIds = state.users.flatMap((user) => user.id ? [user.id] : [])

  if (userIds.length > 0 && state.cacheKeys.length > 0) {
    const { error } = await admin
      .from('ai_file_cache')
      .delete()
      .in('founder_id', userIds)
      .in('cache_key', state.cacheKeys)
    if (error && !error.message.includes("Could not find the table 'public.ai_file_cache'")) {
      cacheCleanupError = new Error(`file upload cache cleanup failed: ${error.message}`)
    }
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`file upload auth-user cleanup failed: ${error.message}`)

    const { data, error: getError } = await admin.auth.admin.getUserById(user.id)
    if (getError && !getError.message.toLowerCase().includes('user not found')) {
      throw new Error(`file upload auth-user re-query failed: ${getError.message}`)
    }
    if (data.user) throw new Error(`file upload auth-user cleanup re-query found ${user.id}`)
  }

  if (cacheCleanupError) throw cacheCleanupError

  appendEvidence(`  - cleanup verified for file-upload marker ${state.marker}`)
}

test.describe('authenticated file upload', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('persists a tiny tagged upload and scopes it to the authenticated founder', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const safe = safeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+file-upload+${safe}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+file-upload+${safe}+b@unite-hub.test`, password: randomPassword() },
      ],
      cacheKeys: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### File upload API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated password was kept in memory only and was not logged.')
    appendEvidence('- Provider note: UNITE_HUB_TEST_MOCK_AI_FILES=1 uses a tagged test-only mock file id; no live provider call is made.')

    try {
      await provisionUser(admin, state, state.users[0])
      await provisionUser(admin, state, state.users[1])
      const context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state.users[0])

      const cacheKey = `__PW_TEST__UPLOAD__${safe}`
      state.cacheKeys.push(cacheKey)
      const filename = `__PW_TEST__UPLOAD__${safe}.txt`
      const buffer = Buffer.from('Playwright upload verification.')

      const upload = await page.request.post('/api/files', {
        multipart: {
          cacheKey,
          ttlDays: '1',
          file: {
            name: filename,
            mimeType: 'text/plain',
            buffer,
          },
        },
      })
      const uploadBody = await upload.json().catch(async () => ({ raw: await upload.text() }))
      expect(upload.status(), JSON.stringify({ step: 'upload', body: uploadBody })).toBe(201)
      expect(uploadBody).toMatchObject({
        cacheKey,
        filename,
        sizeBytes: buffer.length,
      })
      expect(String((uploadBody as { fileId?: string }).fileId ?? '')).toMatch(/^file_mock_/)

      const listA = await page.request.get('/api/files')
      const listABody = await listA.json().catch(async () => ({ raw: await listA.text() }))
      expect(listA.status(), JSON.stringify({ step: 'list-a', body: listABody })).toBe(200)
      expect((listABody as { files?: Array<{ cacheKey: string }> }).files?.some((file) => file.cacheKey === cacheKey)).toBe(true)

      const { data, error } = await admin
        .from('ai_file_cache')
        .select('cache_key,file_id,filename,size_bytes,founder_id')
        .eq('founder_id', state.users[0].id!)
        .eq('cache_key', cacheKey)
        .single()
      expect(error, JSON.stringify({ step: 'admin-reread-cache', error })).toBeNull()
      expect(data).toMatchObject({
        cache_key: cacheKey,
        filename,
        size_bytes: buffer.length,
        founder_id: state.users[0].id,
      })
      expect(String(data?.file_id ?? '')).toMatch(/^file_mock_/)

      const contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])
      const listB = await pageB.request.get('/api/files')
      const listBBody = await listB.json().catch(async () => ({ raw: await listB.text() }))
      expect(listB.status(), JSON.stringify({ step: 'list-b', body: listBBody })).toBe(200)
      expect((listBBody as { files?: Array<{ cacheKey: string }> }).files?.some((file) => file.cacheKey === cacheKey)).toBe(false)

      const anonA = createClient(cfg.url, cfg.anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const anonB = createClient(cfg.url, cfg.anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const signInA = await anonA.auth.signInWithPassword({
        email: state.users[0].email,
        password: state.users[0].password,
      })
      expect(signInA.error, JSON.stringify({ step: 'rls-sign-in-a', error: signInA.error })).toBeNull()
      const signInB = await anonB.auth.signInWithPassword({
        email: state.users[1].email,
        password: state.users[1].password,
      })
      expect(signInB.error, JSON.stringify({ step: 'rls-sign-in-b', error: signInB.error })).toBeNull()

      const rlsA = await anonA.from('ai_file_cache').select('cache_key').eq('cache_key', cacheKey)
      expect(rlsA.error, JSON.stringify({ step: 'rls-a', error: rlsA.error })).toBeNull()
      expect(rlsA.data?.map((row) => row.cache_key)).toEqual([cacheKey])
      const rlsB = await anonB.from('ai_file_cache').select('cache_key').eq('cache_key', cacheKey)
      expect(rlsB.error, JSON.stringify({ step: 'rls-b', error: rlsB.error })).toBeNull()
      expect(rlsB.data).toEqual([])

      appendEvidence(`  - uploaded tiny tagged file: status 201, cacheKey ${cacheKey}, persisted file id ${data?.file_id}`)
      appendEvidence(`  - cross-user isolation verified: user B could not list/read ${cacheKey} via API or direct RLS query`)

      await contextB.close()
      await context.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
