import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/vault', () => ({
  encrypt: vi.fn((v: string) => ({ encryptedValue: `enc:${v}`, iv: 'iv', salt: 'salt' })),
  decrypt: vi.fn(({ encryptedValue }: { encryptedValue: string }) => encryptedValue.replace('enc:', '')),
}))

describe('social channels', () => {
  it('encodeToken serialises VaultPayload to JSON string', async () => {
    const { encodeToken, decodeToken } = await import('../channels')
    const encoded = encodeToken('my-token')
    expect(typeof encoded).toBe('string')
    const decoded = decodeToken(encoded)
    expect(decoded).toBe('my-token')
  })

  it('PLATFORMS contains all 5 platforms', async () => {
    const { PLATFORMS } = await import('../types')
    expect(PLATFORMS).toEqual(['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'])
  })
})
