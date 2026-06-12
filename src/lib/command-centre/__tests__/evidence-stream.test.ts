import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { resolveEvidenceLedgerPath, tailEvidence } from '@/lib/command-centre/evidence-stream'

let tempDir: string
let ledgerPath: string
let originalLedgerPath: string | undefined

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'cc-evidence-stream-'))
  await mkdir(tempDir, { recursive: true })
  ledgerPath = path.join(tempDir, 'evidence_ledger.jsonl')
  originalLedgerPath = process.env.UNITE_EVIDENCE_LEDGER_PATH
  process.env.UNITE_EVIDENCE_LEDGER_PATH = ledgerPath
})

afterEach(async () => {
  if (originalLedgerPath === undefined) delete process.env.UNITE_EVIDENCE_LEDGER_PATH
  else process.env.UNITE_EVIDENCE_LEDGER_PATH = originalLedgerPath
  await rm(tempDir, { recursive: true, force: true })
})

async function appendLine(line: object | string): Promise<void> {
  const text = typeof line === 'string' ? line : JSON.stringify(line)
  await writeFile(ledgerPath, text + '\n', { flag: 'a' })
}

describe('resolveEvidenceLedgerPath', () => {
  it('uses UNITE_EVIDENCE_LEDGER_PATH when set', () => {
    process.env.UNITE_EVIDENCE_LEDGER_PATH = '/tmp/whatever.jsonl'
    expect(resolveEvidenceLedgerPath()).toBe('/tmp/whatever.jsonl')
  })

  it('falls back to the canonical path under $HOME when unset', () => {
    delete process.env.UNITE_EVIDENCE_LEDGER_PATH
    const home = process.env.HOME || process.env.USERPROFILE || ''
    expect(resolveEvidenceLedgerPath()).toBe(
      path.join(home, '2nd-brain', '.agentic_nexus', 'evidence', 'evidence_ledger.jsonl'),
    )
  })
})

describe('tailEvidence', () => {
  it('returns an empty result when the ledger does not exist', async () => {
    process.env.UNITE_EVIDENCE_LEDGER_PATH = '/this/does/not/exist.jsonl'
    const r = await tailEvidence()
    expect(r.entries).toEqual([])
    expect(r.total_lines).toBe(0)
    expect(r.parsed_lines).toBe(0)
  })

  it('returns an empty result when the ledger is empty', async () => {
    const r = await tailEvidence()
    expect(r.entries).toEqual([])
    expect(r.total_lines).toBe(0)
  })

  it('returns the last N entries, newest first', async () => {
    for (let i = 1; i <= 7; i++) {
      await appendLine({ timestamp: `2026-06-12T10:0${i}:00Z`, event: `event_${i}` })
    }
    const r = await tailEvidence(undefined, 3)
    expect(r.entries).toHaveLength(3)
    expect(r.entries.map((e) => e.event)).toEqual(['event_7', 'event_6', 'event_5'])
    expect(r.total_lines).toBe(7)
    expect(r.parsed_lines).toBe(3)
  })

  it('defaults to 5 entries when n is not provided', async () => {
    for (let i = 1; i <= 8; i++) {
      await appendLine({ event: `e${i}` })
    }
    const r = await tailEvidence()
    expect(r.entries).toHaveLength(5)
    expect(r.entries.map((e) => e.event)).toEqual(['e8', 'e7', 'e6', 'e5', 'e4'])
  })

  it('extracts convenience fields from common locations', async () => {
    await appendLine({
      timestamp: '2026-06-12T10:00:00Z',
      event: 'pr_89_merged_externally',
      repo: 'CleanExpo/Unite-Hub',
      pr_url: 'https://github.com/CleanExpo/Unite-Hub/pull/89',
      head_ref: 'feat/project-dod-coverage-reconciler',
      head_sha: 'f2e13deef93cadad817e9920c0f7d0b9a70de1ac',
      merge_commit: 'd38ad9313c0b5dba0d7ffbfff75ea754f9911570',
      safety: { op_or_1password_touched: false, supabase_touched: false },
    })
    const r = await tailEvidence()
    const e = r.entries[0]!
    expect(e.timestamp).toBe('2026-06-12T10:00:00Z')
    expect(e.event).toBe('pr_89_merged_externally')
    expect(e.repo).toBe('CleanExpo/Unite-Hub')
    expect(e.pr_url).toBe('https://github.com/CleanExpo/Unite-Hub/pull/89')
    expect(e.head_ref).toBe('feat/project-dod-coverage-reconciler')
    expect(e.head_sha).toBe('f2e13deef93cadad817e9920c0f7d0b9a70de1ac')
    expect(e.merge_commit).toBe('d38ad9313c0b5dba0d7ffbfff75ea754f9911570')
    expect(e.safety).toEqual({ op_or_1password_touched: false, supabase_touched: false })
    expect(e.parse_error).toBeNull()
  })

  it('falls back to event_type when event is absent', async () => {
    await appendLine({ event_type: 'continuous_agentic_ops_supervisor_evidence' })
    const r = await tailEvidence()
    expect(r.entries[0]?.event_type).toBe('continuous_agentic_ops_supervisor_evidence')
  })

  it('skips malformed lines without breaking the tail', async () => {
    await appendLine({ event: 'first' })
    await appendLine('{ not valid json')
    await appendLine({ event: 'third' })
    const r = await tailEvidence()
    expect(r.total_lines).toBe(3)
    expect(r.parsed_lines).toBe(2)
    expect(r.malformed_lines).toBe(1)
    // Entries contains ONLY the successfully parsed lines, newest first.
    expect(r.entries.map((e) => e.event)).toEqual(['third', 'first'])
    // The malformed line is counted but not in `entries` (no event for it).
    const bad = r.entries.find((e) => e.event === null)
    expect(bad).toBeUndefined()
  })

  it('handles a trailing empty line (text-file convention)', async () => {
    await writeFile(ledgerPath, '{"event":"only"}\n', 'utf-8')
    const r = await tailEvidence()
    expect(r.total_lines).toBe(1)
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0]?.event).toBe('only')
  })

  it('throws when n is not a positive integer', async () => {
    await expect(tailEvidence(undefined, 0)).rejects.toThrow(/positive integer/)
    await expect(tailEvidence(undefined, -1)).rejects.toThrow(/positive integer/)
    await expect(tailEvidence(undefined, 1.5)).rejects.toThrow(/positive integer/)
  })

  it('throws if the ledger path is a directory', async () => {
    await expect(tailEvidence(tempDir)).rejects.toThrow(/directory/)
  })

  it('records the scanned_at timestamp from the injected clock', async () => {
    await appendLine({ event: 'e' })
    const fixed = new Date('2026-06-12T14:00:00Z')
    const r = await tailEvidence(undefined, 5, () => fixed)
    expect(r.scanned_at).toBe(fixed.toISOString())
  })

  it('attaches a 1-based line_index from the file head (not the tail)', async () => {
    for (let i = 1; i <= 5; i++) {
      await appendLine({ event: `e${i}` })
    }
    const r = await tailEvidence(undefined, 3)
    // Newest first. e5 is at line 5, e4 is at line 4, e3 is at line 3.
    expect(r.entries.map((e) => e.line_index)).toEqual([5, 4, 3])
  })
})
