// src/app/api/files/transcribe/route.ts
// POST: Transcribe a founder-owned cached file. Mock provider is supported for
// safe e2e proof; live provider remains disabled until credentials/cost/storage
// are explicitly approved.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { transcribeCachedFile, TranscriptionError } from '@/lib/ai/features/transcription'

export const dynamic = 'force-dynamic'

function readCacheKey(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = (body as Record<string, unknown>).cacheKey
  return typeof value === 'string' ? value.trim() : undefined
}

function isMissingTranscriptTableError(error: { code?: string; message?: string }) {
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

async function persistTranscript(founderId: string, result: Awaited<ReturnType<typeof transcribeCachedFile>>) {
  const supabase = createServiceClient()
  const { data: cached, error: cacheError } = await supabase
    .from('ai_file_cache')
    .select('id')
    .eq('founder_id', founderId)
    .eq('cache_key', result.cacheKey)
    .single()

  if (cacheError || !cached?.id) {
    const message = cacheError?.message ?? 'Cached file row was not found during transcript persistence'
    throw new Error(`Failed to locate uploaded file cache for transcript persistence: ${message}`)
  }

  const { data, error } = await supabase
    .from('ai_file_transcripts')
    .upsert(
      {
        founder_id: founderId,
        file_cache_id: cached.id as string,
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
    if (isMissingTranscriptTableError(error)) {
      return {
        status: 'unknown' as const,
        persisted: false,
        reason: 'Transcript persistence schema is not applied.',
      }
    }

    throw new Error(`Failed to persist transcript: ${error.message}`)
  }

  return {
    status: 'persisted' as const,
    persisted: true,
    table: 'ai_file_transcripts',
    transcriptId: data.id as string,
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
    const result = await transcribeCachedFile(user.id, cacheKey)
    const persistence = await persistTranscript(user.id, result)
    return NextResponse.json({
      ...result,
      persistence,
    })
  } catch (error) {
    if (error instanceof TranscriptionError) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
      }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Transcription failed'
    if (message.includes('ai_file_cache') && message.includes('Could not find the table')) {
      return NextResponse.json({
        error: 'File upload cache is not configured',
        table: 'ai_file_cache',
        code: 'file_cache_not_configured',
      }, { status: 503 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
