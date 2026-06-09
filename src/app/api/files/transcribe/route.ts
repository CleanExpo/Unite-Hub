// src/app/api/files/transcribe/route.ts
// POST: Transcribe a founder-owned cached file. Mock provider is supported for
// safe e2e proof; live provider remains disabled until credentials/cost/storage
// are explicitly approved.

import { NextResponse } from 'next/server'
import { createClient, getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type CachedFileRow = {
  id: string
  cache_key: string
  file_id: string
  filename: string
  expires_at: string | null
}

type TranscriptResult = {
  cacheKey: string
  fileId: string
  filename: string
  provider: 'mock'
  source: 'mocked_provider'
  transcript: {
    text: string
    language: string
    confidence: number
  }
}

function readCacheKey(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = (body as Record<string, unknown>).cacheKey
  return typeof value === 'string' ? value.trim() : undefined
}

class StableRouteError extends Error {
  constructor(
    readonly code: 'file_cache_lookup_failed' | 'transcript_persist_failed',
    readonly status: number
  ) {
    super(code)
    this.name = 'StableRouteError'
  }
}

function isMissingTableError(error: { code?: string; message?: string }, tableName: string) {
  const message = error.message ?? ''
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    (
      message.includes(tableName) &&
      (message.includes('Could not find the table') || message.includes('does not exist'))
    )
  )
}

function logSupabaseError(context: string, error: unknown) {
  console.error(`[files/transcribe] ${context}:`, error)
}

async function persistTranscript(
  supabase: Awaited<ReturnType<typeof createClient>>,
  founderId: string,
  cached: CachedFileRow,
  result: TranscriptResult
) {
  const { data, error } = await supabase
    .from('ai_file_transcripts')
    .upsert(
      {
        founder_id: founderId,
        file_cache_id: cached.id,
        cache_key: result.cacheKey,
        file_id: result.fileId,
        filename: result.filename,
        provider: result.provider,
        source: result.source,
        transcript_text: result.transcript.text,
        language: result.transcript.language,
        confidence: result.transcript.confidence,
        transcript: result.transcript,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'founder_id,cache_key' }
    )
    .select('id')
    .single()

  if (error) {
    logSupabaseError('transcript persist failed', error)
    if (isMissingTableError(error, 'ai_file_transcripts')) {
      return {
        status: 'unknown' as const,
        persisted: false,
        table: 'ai_file_transcripts',
        reason: 'schema_missing' as const,
      }
    }

    throw new StableRouteError(
      'transcript_persist_failed',
      500
    )
  }

  return {
    status: 'persisted' as const,
    persisted: true,
    table: 'ai_file_transcripts',
    transcriptId: data.id as string,
  }
}

function buildMockTranscript(cached: CachedFileRow): TranscriptResult {
  return {
    cacheKey: cached.cache_key,
    fileId: cached.file_id,
    filename: cached.filename,
    provider: 'mock',
    source: 'mocked_provider',
    transcript: {
      text: `Mock transcript for ${cached.filename} (${cached.cache_key}).`,
      language: 'en',
      confidence: 1,
    },
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cacheKey = readCacheKey(body)
  if (!cacheKey) {
    return NextResponse.json({ error: 'cacheKey is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: cached, error: cacheError } = await supabase
      .from('ai_file_cache')
      .select('id,cache_key,file_id,filename,expires_at')
      .eq('founder_id', user.id)
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (cacheError) {
      logSupabaseError('file cache lookup failed', cacheError)

      return NextResponse.json({
        error: 'file_cache_lookup_failed',
        code: 'file_cache_lookup_failed',
      }, { status: isMissingTableError(cacheError, 'ai_file_cache') ? 503 : 500 })
    }

    if (!cached) {
      return NextResponse.json({ error: 'Cached file not found', code: 'file_not_found' }, { status: 404 })
    }

    if (cached.expires_at && new Date(cached.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cached file not found', code: 'file_not_found' }, { status: 404 })
    }

    if (process.env.UNITE_HUB_TEST_MOCK_TRANSCRIPTION !== '1' || !cacheKey.startsWith('__PW_TEST__')) {
      return NextResponse.json({
        error: 'Live transcription provider is not configured for this endpoint.',
        code: 'provider_not_configured',
      }, { status: 503 })
    }

    const result = buildMockTranscript(cached)
    const persistence = await persistTranscript(supabase, user.id, cached, result)
    return NextResponse.json({
      ...result,
      persistence,
    })
  } catch (error) {
    logSupabaseError('transcription failed', error)
    if (error instanceof StableRouteError) {
      return NextResponse.json({
        error: error.code,
        code: error.code,
      }, { status: error.status })
    }

    return NextResponse.json({
      error: 'transcript_persist_failed',
      code: 'transcript_persist_failed',
    }, { status: 500 })
  }
}
