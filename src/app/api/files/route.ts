// src/app/api/files/route.ts
// POST: Upload a file to the Anthropic Files API and cache in Supabase.
// GET:  List all cached files for the authenticated founder.
//
// POST body: multipart/form-data — fields: file (required), cacheKey (required), ttlDays (optional)
// POST response: { fileId, cacheKey, filename, sizeBytes }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { uploadAndCacheFile, listCachedFiles } from '@/lib/ai/features/files'

export const dynamic = 'force-dynamic'

// ── POST — upload ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const fileField = formData.get('file')
  const cacheKey  = formData.get('cacheKey')?.toString()

  if (!(fileField instanceof Blob)) {
    return NextResponse.json({ error: 'file field is required (must be a file upload)' }, { status: 400 })
  }
  if (!cacheKey?.trim()) {
    return NextResponse.json({ error: 'cacheKey is required' }, { status: 400 })
  }

  const ttlDaysRaw = formData.get('ttlDays')?.toString()
  const ttlDays    = ttlDaysRaw ? parseInt(ttlDaysRaw, 10) : undefined

  const filename = (fileField as File).name ?? 'upload'
  const mimeType = fileField.type || 'application/octet-stream'

  // 10 MB limit
  if (fileField.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 })
  }

  try {
    const cached = await uploadAndCacheFile(
      user.id,
      cacheKey,
      fileField,
      filename,
      mimeType,
      ttlDays
    )

    return NextResponse.json({
      fileId:    cached.fileId,
      cacheKey:  cached.cacheKey,
      filename:  cached.filename,
      sizeBytes: cached.sizeBytes,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── GET — list ────────────────────────────────────────────────────────────────

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const files = await listCachedFiles(user.id)
  return NextResponse.json({ files })
}
