// src/lib/ai/__tests__/features/files.test.ts
// Unit tests for the Files API upload and reference utilities.

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/ai/client', () => ({
  getAIClient: vi.fn(() => ({
    beta: {
      files: {
        upload: vi.fn().mockResolvedValue({ id: 'file-abc123', filename: 'doc.pdf' }),
      },
    },
  })),
}))

import { uploadFile, buildFileReference, addToFileCache, getFileCache, clearFileCache } from '../../features/files'

describe('Files API', () => {
  it('uploadFile function exists', () => {
    expect(typeof uploadFile).toBe('function')
  })

  it('buildFileReference returns correct structure', () => {
    const ref = buildFileReference('file-abc123')
    expect(ref).toEqual({
      type: 'document',
      source: {
        type: 'file',
        file_id: 'file-abc123',
      },
    })
  })

  it('file cache add/get works', () => {
    clearFileCache()
    addToFileCache('my-doc', 'file-xyz789')
    expect(getFileCache('my-doc')).toBe('file-xyz789')
    expect(getFileCache('nonexistent')).toBeUndefined()
  })
})
