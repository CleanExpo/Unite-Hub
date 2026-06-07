import { appendFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadSupabaseAdminConfig } from './support/supabase-admin-config'

type TestUser = {
  email: string
  password: string
  id?: string
}

type CleanupState = {
  marker: string
  user: TestUser
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

async function provisionUser(admin: SupabaseClient, state: CleanupState) {
  const { data, error } = await admin.auth.admin.createUser({
    email: state.user.email,
    password: state.user.password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-file-upload-verification',
    },
  })

  if (error) throw new Error(`file upload createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('file upload createUser did not return an id')
  state.user.id = data.user.id
  appendEvidence(`  - created file-upload auth user: ${data.user.id}`)
}

async function signIn(page: Page, state: CleanupState) {
  await page.goto('/auth/login?redirectTo=/founder/contacts')
  await page.locator('input[type="email"]').fill(state.user.email)
  await page.locator('input[type="password"]').fill(state.user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(
    (url) => ['/founder/contacts', '/founder/dashboard'].includes(url.pathname),
    { timeout: 15000 }
  )
}

async function cleanup(admin: SupabaseClient, state: CleanupState) {
  let cacheCleanupError: Error | null = null

  if (state.user.id && state.cacheKeys.length > 0) {
    const { error } = await admin
      .from('ai_file_cache')
      .delete()
      .eq('founder_id', state.user.id)
      .in('cache_key', state.cacheKeys)
    if (error && !error.message.includes("Could not find the table 'public.ai_file_cache'")) {
      cacheCleanupError = new Error(`file upload cache cleanup failed: ${error.message}`)
    }
  }

  if (state.user.id) {
    const { error } = await admin.auth.admin.deleteUser(state.user.id)
    if (error) throw new Error(`file upload auth-user cleanup failed: ${error.message}`)

    const { data, error: getError } = await admin.auth.admin.getUserById(state.user.id)
    if (getError && !getError.message.toLowerCase().includes('user not found')) {
      throw new Error(`file upload auth-user re-query failed: ${getError.message}`)
    }
    if (data.user) throw new Error(`file upload auth-user cleanup re-query found ${state.user.id}`)
  }

  if (cacheCleanupError) throw cacheCleanupError

  appendEvidence(`  - cleanup verified for file-upload marker ${state.marker}`)
}

test.describe('authenticated file upload', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('exercises tiny tagged upload boundary without a live provider call', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const safe = safeMarker(marker)
    const state: CleanupState = {
      marker,
      user: {
        email: `playwright+file-upload+${safe}@unite-hub.test`,
        password: randomPassword(),
      },
      cacheKeys: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### File upload API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated password was kept in memory only and was not logged.')
    appendEvidence('- Provider note: UNITE_HUB_TEST_MOCK_AI_FILES=1 uses a tagged test-only mock file id; persisted upload requires ai_file_cache to exist.')

    try {
      await provisionUser(admin, state)
      const context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state)

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
      expect([201, 503], JSON.stringify({ step: 'upload', body: uploadBody })).toContain(upload.status())

      if (upload.status() === 503) {
        expect(uploadBody).toMatchObject({
          error: 'File upload cache is not configured',
          table: 'ai_file_cache',
          code: 'file_cache_not_configured',
        })
        appendEvidence('  - tiny tagged file upload returned 503 file_cache_not_configured; existing ai_file_cache migration is not applied in the verified lane.')
      } else {
        expect(uploadBody).toMatchObject({
          cacheKey,
          filename,
          sizeBytes: buffer.length,
        })
        expect(String((uploadBody as { fileId?: string }).fileId ?? '')).toMatch(/^file_mock_/)

        const list = await page.request.get('/api/files')
        const listBody = await list.json().catch(async () => ({ raw: await list.text() }))
        expect(list.status(), JSON.stringify({ step: 'list', body: listBody })).toBe(200)
        expect((listBody as { files?: Array<{ cacheKey: string }> }).files?.some((file) => file.cacheKey === cacheKey)).toBe(true)

        const { data, error } = await admin
          .from('ai_file_cache')
          .select('cache_key,file_id,filename,size_bytes')
          .eq('founder_id', state.user.id!)
          .eq('cache_key', cacheKey)
          .single()
        expect(error, JSON.stringify({ step: 'admin-reread-cache', error })).toBeNull()
        expect(data).toMatchObject({
          cache_key: cacheKey,
          filename,
          size_bytes: buffer.length,
        })
        expect(String(data?.file_id ?? '')).toMatch(/^file_mock_/)
        appendEvidence(`  - uploaded tiny tagged file: status 201, cacheKey ${cacheKey}, persisted file id ${data?.file_id}`)
      }

      await context.close()
    } finally {
      await cleanup(admin, state)
    }
  })
})
