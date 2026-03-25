// src/lib/ai/features/files.ts
// Files API — upload documents to Anthropic's Files API with Supabase-backed caching.
// Uploaded files are keyed by (founderId, cacheKey) and survive cold starts.
// Upload once → reference by fileId across any number of subsequent calls.

import { getAIClient } from '@/lib/ai/client'
import { createServiceClient } from '@/lib/supabase/service'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CachedFile {
  fileId: string
  filename: string
  mimeType: string
  sizeBytes: number
  cacheKey: string
  createdAt: string
}

// ── File reference builder ───────────────────────────────────────────────────

/**
 * Build a document content block for inclusion in a message content array.
 * Pass this alongside text blocks when calling execute() with features.fileIds.
 */
export function buildFileReference(fileId: string) {
  return {
    type: 'document' as const,
    source: {
      type: 'file' as const,
      file_id: fileId,
    },
  }
}

// ── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file to the Anthropic Files API and cache the result in Supabase.
 * If a non-expired file already exists for (founderId, cacheKey), returns the
 * cached fileId without re-uploading.
 *
 * @param founderId - Founder who owns this file (for RLS isolation)
 * @param cacheKey  - Human-readable key for future lookup (e.g. "xero_jun_2026")
 * @param file      - The file content as a Blob or Buffer
 * @param filename  - Original filename (e.g. "statement.pdf")
 * @param mimeType  - MIME type (default: "application/octet-stream")
 * @param ttlDays   - Optional TTL in days — after expiry, a new upload is forced
 */
export async function uploadAndCacheFile(
  founderId: string,
  cacheKey: string,
  file: Blob | Buffer,
  filename: string,
  mimeType = 'application/octet-stream',
  ttlDays?: number
): Promise<CachedFile> {
  // Check Supabase cache first
  const cached = await getCachedFile(founderId, cacheKey)
  if (cached) return cached

  // Upload to Anthropic Files API
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Files API beta types
  const result = await (client.beta.files as any).upload(
    { file, betas: ['files-api-2025-04-14'] }
  )

  const sizeBytes = file instanceof Blob ? file.size : (file as Buffer).length
  const expiresAt = ttlDays
    ? new Date(Date.now() + ttlDays * 86400_000).toISOString()
    : null

  // Persist to Supabase
  const supabase = createServiceClient()
  await supabase.from('ai_file_cache').upsert(
    {
      founder_id:  founderId,
      cache_key:   cacheKey,
      file_id:     result.id,
      filename,
      mime_type:   mimeType,
      size_bytes:  sizeBytes,
      expires_at:  expiresAt,
    },
    { onConflict: 'founder_id,cache_key' }
  )

  return {
    fileId:     result.id,
    filename,
    mimeType,
    sizeBytes,
    cacheKey,
    createdAt:  new Date().toISOString(),
  }
}

// ── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Retrieve a cached file record by (founderId, cacheKey).
 * Returns null if not found or expired.
 */
export async function getCachedFile(
  founderId: string,
  cacheKey: string
): Promise<CachedFile | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_file_cache')
    .select('*')
    .eq('founder_id', founderId)
    .eq('cache_key', cacheKey)
    .single()

  if (error || !data) return null

  // Respect TTL
  if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
    return null
  }

  return {
    fileId:    data.file_id as string,
    filename:  data.filename as string,
    mimeType:  data.mime_type as string,
    sizeBytes: data.size_bytes as number,
    cacheKey:  data.cache_key as string,
    createdAt: data.created_at as string,
  }
}

/**
 * Retrieve just the fileId for a cached file.
 * Returns undefined if not found or expired.
 */
export async function getCachedFileId(
  founderId: string,
  cacheKey: string
): Promise<string | undefined> {
  const cached = await getCachedFile(founderId, cacheKey)
  return cached?.fileId
}

/**
 * List all cached files for a founder.
 */
export async function listCachedFiles(founderId: string): Promise<CachedFile[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('ai_file_cache')
    .select('*')
    .eq('founder_id', founderId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const now = new Date()
  return data
    .filter(row => !row.expires_at || new Date(row.expires_at as string) > now)
    .map(row => ({
      fileId:    row.file_id as string,
      filename:  row.filename as string,
      mimeType:  row.mime_type as string,
      sizeBytes: row.size_bytes as number,
      cacheKey:  row.cache_key as string,
      createdAt: row.created_at as string,
    }))
}

// ── Legacy in-memory helpers (kept for backwards compatibility) ──────────────
// These are no-ops in production — use uploadAndCacheFile / getCachedFileId instead.

/** @deprecated Use uploadAndCacheFile() */
export function addToFileCache(_key: string, _fileId: string): void {}

/** @deprecated Use getCachedFileId() */
export function getFileCache(_key: string): string | undefined { return undefined }

/** @deprecated No-op — cache is now in Supabase */
export function clearFileCache(): void {}

/** @deprecated Use uploadAndCacheFile() */
export async function uploadFile(
  file: Blob | Buffer,
  filename: string
): Promise<{ fileId: string; filename: string }> {
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client.beta.files as any).upload({ file, betas: ['files-api-2025-04-14'] })
  return { fileId: result.id, filename: result.filename }
}
