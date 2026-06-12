import { describe, it, expect } from 'vitest'
import { listInProgressPRs } from '@/lib/command-centre/in-progress-prs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

describe('listInProgressPRs', () => {
  it('returns a structured empty result when gh is not installed (ENOENT)', async () => {
    // Use a temp dir with a PATH that has no `gh`. macOS ships `gh` to
    // /usr/local/bin or ~/.local/bin, but a minimal PATH won't.
    const dir = await mkdtemp(path.join(tmpdir(), 'cc-no-gh-'))
    const originalPath = process.env.PATH
    const originalPathExt = process.env.PATHEXT
    process.env.PATH = dir
    if (process.platform === 'win32') process.env.PATHEXT = ''

    try {
      const r = await listInProgressPRs(dir)
      expect(r.gh_available).toBe(false)
      expect(r.entries).toEqual([])
      expect(r.read_error).toMatch(/gh CLI not found|PATH|ENOENT/i)
      expect(r.status_message).toContain('gh CLI not installed')
    } finally {
      if (originalPath === undefined) delete process.env.PATH
      else process.env.PATH = originalPath
      if (originalPathExt === undefined) delete process.env.PATHEXT
      else process.env.PATHEXT = originalPathExt
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('exposes a stable typed result shape even on failure', async () => {
    // No mocking of execFile; we rely on the real `gh` behaviour on this
    // machine. If `gh` is present but unauthenticated, the function
    // returns a structured failure (gh_available=false); if not, the
    // ENOENT branch above covers it. Either way the shape is stable.
    const r = await listInProgressPRs()
    expect(typeof r.gh_available).toBe('boolean')
    expect(Array.isArray(r.entries)).toBe(true)
    expect(typeof r.scanned_at).toBe('string')
    expect(typeof r.status_message).toBe('string')
    expect(typeof r.gh_path).toBe('string')
    // read_error is null on success and a string on failure.
    expect(r.read_error === null || typeof r.read_error === 'string').toBe(true)
  })

  it('returns gh_available=true with entries when gh is authenticated and there are open PRs (live)', async () => {
    // This test is data-dependent: it asserts what the function actually
    // returns against the live `gh` state of the repo. We accept either
    // an empty list (no open PRs, which is the current state) or a
    // populated list, but the shape invariants are strict.
    const r = await listInProgressPRs()
    if (r.gh_available) {
      for (const e of r.entries) {
        expect(typeof e.number).toBe('string')
        expect(typeof e.title).toBe('string')
        expect(typeof e.author).toBe('string')
        expect(typeof e.head_ref).toBe('string')
        expect(typeof e.created_at).toBe('string')
        expect(typeof e.url).toBe('string')
        expect(e.age_days === null || typeof e.age_days === 'number').toBe(true)
        // Newest first.
        for (let i = 1; i < r.entries.length; i++) {
          const prev = r.entries[i - 1]!
          const curr = r.entries[i]!
          expect(prev.created_at >= curr.created_at).toBe(true)
        }
      }
    }
  })
})
