// src/lib/ai/features/files.ts
// Files API — upload documents and build file references for Anthropic's Files API.

import { getAIClient } from '@/lib/ai/client'

/** In-memory cache mapping user-defined keys to Anthropic file IDs. */
const fileCache = new Map<string, string>()

/**
 * Builds a document content block reference for use in message content arrays.
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

/**
 * Uploads a file to the Anthropic Files API.
 * Returns the file ID and filename for subsequent reference building.
 */
export async function uploadFile(
  file: Blob | Buffer,
  filename: string
): Promise<{ fileId: string; filename: string }> {
  const client = getAIClient()
  // Use type assertion for beta API access
  const result = await (client.beta.files as any).upload({
    file,
    betas: ['files-api-2025-04-14'],
  })
  return { fileId: result.id, filename: result.filename }
}

/** Store a file ID in the local cache under the given key. */
export function addToFileCache(key: string, fileId: string): void {
  fileCache.set(key, fileId)
}

/** Retrieve a cached file ID by key. Returns undefined if not found. */
export function getFileCache(key: string): string | undefined {
  return fileCache.get(key)
}

/** Clear all entries from the file cache. */
export function clearFileCache(): void {
  fileCache.clear()
}
