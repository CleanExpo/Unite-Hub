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
  cacheKeys: string[]
}

function safeMarker(marker: string) {
  return marker.replace(/[^a-zA-Z0-9]/g, '-')
}

function randomPassword() {
  return `${randomBytes(24).toString('base64url')}aA1!`
}

function appendEvidence(line: string) {
  if (process.env.TRANSCRIPTION_APPEND_EVIDENCE !== '1') return
  appendFileSync('EVIDENCE.md', `${line}\n`)
}

function makeAdminClient() {
  const cfg = loadSupabaseAdminConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function isMissingTranscriptTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  const message = error.message ?? ''
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    (
      message.includes('ai_file_transcripts') &&
      (message.includes('Could not find the table') || message.includes('does not exist'))
    )
  )
}

async function provisionUser(admin: SupabaseClient, state: CleanupState, user: TestUser) {
  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      marker: state.marker,
      purpose: 'playwright-transcription-verification',
      label: user.label,
    },
  })

  if (error) throw new Error(`transcription createUser failed: ${error.message}`)
  if (!data.user?.id) throw new Error('transcription createUser did not return an id')
  user.id = data.user.id
  appendEvidence(`  - created transcription auth user ${user.label}: ${data.user.id}`)
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
  const userIds = state.users.flatMap((user) => user.id ? [user.id] : [])

  if (userIds.length > 0 && state.cacheKeys.length > 0) {
    const { error: transcriptError } = await admin
      .from('ai_file_transcripts')
      .delete()
      .in('founder_id', userIds)
      .in('cache_key', state.cacheKeys)
    if (transcriptError && !isMissingTranscriptTableError(transcriptError)) {
      throw new Error(`transcription transcript cleanup failed: ${transcriptError.message}`)
    }

    const { data: transcripts, error: transcriptRequeryError } = await admin
      .from('ai_file_transcripts')
      .select('id')
      .in('founder_id', userIds)
      .in('cache_key', state.cacheKeys)
    if (transcriptRequeryError && !isMissingTranscriptTableError(transcriptRequeryError)) {
      throw new Error(`transcription transcript cleanup re-query failed: ${transcriptRequeryError.message}`)
    }
    if ((transcripts ?? []).length > 0) {
      throw new Error(`transcription cleanup left ${transcripts?.length ?? 0} transcript rows`)
    }

    const { error } = await admin
      .from('ai_file_cache')
      .delete()
      .in('founder_id', userIds)
      .in('cache_key', state.cacheKeys)
    if (error) throw new Error(`transcription cache cleanup failed: ${error.message}`)

    const { data, error: requeryError } = await admin
      .from('ai_file_cache')
      .select('id')
      .in('founder_id', userIds)
      .in('cache_key', state.cacheKeys)
    if (requeryError) throw new Error(`transcription cache cleanup re-query failed: ${requeryError.message}`)
    if ((data ?? []).length > 0) throw new Error(`transcription cleanup left ${data?.length ?? 0} cache rows`)
  }

  for (const user of state.users) {
    if (!user.id) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw new Error(`transcription auth-user cleanup failed: ${error.message}`)

    const { data, error: getError } = await admin.auth.admin.getUserById(user.id)
    if (getError && !getError.message.toLowerCase().includes('user not found')) {
      throw new Error(`transcription auth-user re-query failed: ${getError.message}`)
    }
    if (data.user) throw new Error(`transcription auth-user cleanup re-query found ${user.id}`)
  }

  appendEvidence(`  - cleanup verified for transcription marker ${state.marker}`)
}

test.describe('authenticated file transcription', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 })

  test('fails closed before authentication', async ({ request }) => {
    const response = await request.post('/api/files/transcribe', {
      data: { cacheKey: '__PW_TEST__TRANSCRIPTION__unauthenticated' },
      maxRedirects: 0,
    })

    expect(
      [307, 401],
      `/api/files/transcribe should redirect to login or return 401 before auth; got ${response.status()}`
    ).toContain(response.status())
  })

  test('transcribes a founder-owned cached upload through the mocked provider', async ({ browser }) => {
    const cfg = loadSupabaseAdminConfig()
    const marker = new Date().toISOString()
    const safe = safeMarker(marker)
    const state: CleanupState = {
      marker,
      users: [
        { label: 'A', email: `playwright+transcription+${safe}+a@unite-hub.test`, password: randomPassword() },
        { label: 'B', email: `playwright+transcription+${safe}+b@unite-hub.test`, password: randomPassword() },
      ],
      cacheKeys: [],
    }
    const admin = makeAdminClient()

    appendEvidence(`\n### Transcription API run - ${marker}`)
    appendEvidence(`- Supabase host: ${cfg.host}`)
    appendEvidence('- Safety: generated passwords were kept in memory only and were not logged.')
    appendEvidence('- Provider note: UNITE_HUB_TEST_MOCK_TRANSCRIPTION=1 proves wiring without a live paid provider call.')

    let context: BrowserContext | undefined
    let contextB: BrowserContext | undefined

    try {
      await provisionUser(admin, state, state.users[0])
      await provisionUser(admin, state, state.users[1])

      context = await browser.newContext()
      const page = await context.newPage()
      await signIn(page, state.users[0])

      const cacheKey = `__PW_TEST__TRANSCRIPTION__${safe}`
      state.cacheKeys.push(cacheKey)
      const filename = `__PW_TEST__TRANSCRIPTION__${safe}.txt`
      const buffer = Buffer.from('Playwright mocked transcription source.')

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

      const transcribe = await page.request.post('/api/files/transcribe', {
        data: { cacheKey },
      })
      const body = await transcribe.json().catch(async () => ({ raw: await transcribe.text() }))
      expect(transcribe.status(), JSON.stringify({ step: 'transcribe-a', body })).toBe(200)
      expect(body).toMatchObject({
        cacheKey,
        filename,
        provider: 'mock',
        source: 'mocked_provider',
        transcript: {
          text: `Mock transcript for ${filename} (${cacheKey}).`,
          language: 'en',
          confidence: 1,
        },
        persistence: {
          status: 'persisted',
          persisted: true,
          table: 'ai_file_transcripts',
        },
      })
      expect(String((body as { persistence?: { transcriptId?: string } }).persistence?.transcriptId ?? '')).toMatch(
        /^[0-9a-f-]{36}$/
      )

      const { data, error } = await admin
        .from('ai_file_cache')
        .select('cache_key,file_id,filename,founder_id')
        .eq('founder_id', state.users[0].id!)
        .eq('cache_key', cacheKey)
        .single()
      expect(error, JSON.stringify({ step: 'admin-reread-cache', error })).toBeNull()
      expect(data).toMatchObject({
        cache_key: cacheKey,
        filename,
        founder_id: state.users[0].id,
      })

      const { data: persistedTranscript, error: transcriptError } = await admin
        .from('ai_file_transcripts')
        .select('cache_key,file_id,filename,founder_id,provider,source,transcript_text,language,confidence,transcript')
        .eq('founder_id', state.users[0].id!)
        .eq('cache_key', cacheKey)
        .single()
      expect(transcriptError, JSON.stringify({ step: 'admin-reread-transcript', error: transcriptError })).toBeNull()
      expect(persistedTranscript).toMatchObject({
        cache_key: cacheKey,
        file_id: data?.file_id,
        filename,
        founder_id: state.users[0].id,
        provider: 'mock',
        source: 'mocked_provider',
        transcript_text: `Mock transcript for ${filename} (${cacheKey}).`,
        language: 'en',
      })
      expect(Number(persistedTranscript?.confidence)).toBe(1)
      expect(persistedTranscript?.transcript).toMatchObject({
        text: `Mock transcript for ${filename} (${cacheKey}).`,
        language: 'en',
        confidence: 1,
      })

      contextB = await browser.newContext()
      const pageB = await contextB.newPage()
      await signIn(pageB, state.users[1])
      const transcribeB = await pageB.request.post('/api/files/transcribe', {
        data: { cacheKey },
      })
      const bodyB = await transcribeB.json().catch(async () => ({ raw: await transcribeB.text() }))
      expect(transcribeB.status(), JSON.stringify({ step: 'transcribe-b', body: bodyB })).toBe(404)
      expect(bodyB).toMatchObject({ code: 'file_not_found' })

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
      expect(signInA.error, JSON.stringify({ step: 'rls-transcript-sign-in-a', error: signInA.error })).toBeNull()
      const signInB = await anonB.auth.signInWithPassword({
        email: state.users[1].email,
        password: state.users[1].password,
      })
      expect(signInB.error, JSON.stringify({ step: 'rls-transcript-sign-in-b', error: signInB.error })).toBeNull()

      const rlsA = await anonA.from('ai_file_transcripts').select('cache_key').eq('cache_key', cacheKey)
      expect(rlsA.error, JSON.stringify({ step: 'rls-transcript-a', error: rlsA.error })).toBeNull()
      expect(rlsA.data?.map((row) => row.cache_key)).toEqual([cacheKey])
      const rlsB = await anonB.from('ai_file_transcripts').select('cache_key').eq('cache_key', cacheKey)
      expect(rlsB.error, JSON.stringify({ step: 'rls-transcript-b', error: rlsB.error })).toBeNull()
      expect(rlsB.data).toEqual([])

      appendEvidence(`  - uploaded tagged source file: status 201, cacheKey ${cacheKey}`)
      appendEvidence(`  - mocked transcription persisted transcript row for ${cacheKey}`)
      appendEvidence(`  - cross-user transcription isolation verified: user B received 404 and direct RLS returned no transcript for ${cacheKey}`)
    } finally {
      await contextB?.close().catch(() => undefined)
      await context?.close().catch(() => undefined)
      await cleanup(admin, state)
    }
  })
})
