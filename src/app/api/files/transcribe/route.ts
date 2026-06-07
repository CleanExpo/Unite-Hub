// src/app/api/files/transcribe/route.ts
// POST: Transcribe a founder-owned cached file. Mock provider is supported for
// safe e2e proof; live provider remains disabled until credentials/cost/storage
// are explicitly approved.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { transcribeCachedFile, TranscriptionError } from '@/lib/ai/features/transcription'

export const dynamic = 'force-dynamic'

function readCacheKey(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = (body as Record<string, unknown>).cacheKey
  return typeof value === 'string' ? value.trim() : undefined
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
    return NextResponse.json(result)
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
