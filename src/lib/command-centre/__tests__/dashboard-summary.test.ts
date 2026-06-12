import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  resolveDashboardDir,
  idFromFilename,
  normaliseStatus,
  normaliseSeverity,
  humaniseId,
  countByBucket,
  summariseDashboard,
  type DashboardSummary,
} from '@/lib/command-centre/dashboard-summary'

let tempDir: string
let originalDashboardDir: string | undefined

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), 'cc-dashboard-summary-'))
  await mkdir(tempDir, { recursive: true })
  originalDashboardDir = process.env.UNITE_DASHBOARD_DIR
  process.env.UNITE_DASHBOARD_DIR = tempDir
})

afterEach(async () => {
  if (originalDashboardDir === undefined) delete process.env.UNITE_DASHBOARD_DIR
  else process.env.UNITE_DASHBOARD_DIR = originalDashboardDir
  await rm(tempDir, { recursive: true, force: true })
})

describe('resolveDashboardDir', () => {
  it('uses UNITE_DASHBOARD_DIR when set', () => {
    process.env.UNITE_DASHBOARD_DIR = '/tmp/whatever'
    expect(resolveDashboardDir()).toBe('/tmp/whatever')
  })

  it('falls back to the canonical path under $HOME when unset', () => {
    delete process.env.UNITE_DASHBOARD_DIR
    const home = process.env.HOME || process.env.USERPROFILE || ''
    expect(resolveDashboardDir()).toBe(
      path.join(home, '2nd-brain', '.agentic_nexus', 'dashboard'),
    )
  })
})

describe('idFromFilename', () => {
  it('strips the `latest_` prefix and the `.json` suffix', () => {
    expect(idFromFilename('latest_daily_ops_status.json')).toBe('daily_ops_status')
  })

  it('handles lane-prefixed ids', () => {
    expect(idFromFilename('latest_lane_16_spec_status.json')).toBe('lane_16_spec_status')
  })

  it('is case-insensitive on the .json suffix', () => {
    expect(idFromFilename('latest_foo.JSON')).toBe('foo')
  })

  it('returns the input unchanged for non-matching names (defensive)', () => {
    // Defensive: if someone hands us a non-latest_ filename, we should not crash.
    expect(idFromFilename('not_latest.json')).toBe('not_latest')
  })
})

describe('normaliseStatus', () => {
  it('maps known statuses through unchanged', () => {
    expect(normaliseStatus('GREEN')).toBe('GREEN')
    expect(normaliseStatus('AMBER')).toBe('AMBER')
    expect(normaliseStatus('RED')).toBe('RED')
    expect(normaliseStatus('PASS')).toBe('PASS')
    expect(normaliseStatus('DRAFT_FOR_REVIEW')).toBe('DRAFT_FOR_REVIEW')
  })

  it('uppercases known lowercase statuses', () => {
    expect(normaliseStatus('green')).toBe('GREEN')
    expect(normaliseStatus('red')).toBe('RED')
  })

  it('returns "unknown" for unrecognised strings', () => {
    expect(normaliseStatus('PINK')).toBe('unknown')
    expect(normaliseStatus('')).toBe('unknown')
  })

  it('returns "unknown" for non-strings', () => {
    expect(normaliseStatus(42)).toBe('unknown')
    expect(normaliseStatus(null)).toBe('unknown')
    expect(normaliseStatus(undefined)).toBe('unknown')
    expect(normaliseStatus({})).toBe('unknown')
  })
})

describe('normaliseSeverity', () => {
  it('maps known severities through unchanged', () => {
    expect(normaliseSeverity('P0')).toBe('P0')
    expect(normaliseSeverity('P1')).toBe('P1')
    expect(normaliseSeverity('P2')).toBe('P2')
    expect(normaliseSeverity('P3')).toBe('P3')
    expect(normaliseSeverity('P4')).toBe('P4')
    expect(normaliseSeverity('informational')).toBe('informational')
  })

  it('returns "unknown" for unrecognised values', () => {
    expect(normaliseSeverity('P5')).toBe('unknown')
    expect(normaliseSeverity('URGENT')).toBe('unknown')
    expect(normaliseSeverity(null)).toBe('unknown')
  })
})

describe('humaniseId', () => {
  it('converts snake_case to Title Case', () => {
    expect(humaniseId('daily_ops_status')).toBe('Daily Ops Status')
  })

  it('converts kebab-case to Title Case', () => {
    expect(humaniseId('lane-16-spec-status')).toBe('Lane 16 Spec Status')
  })

  it('uppercases short tokens (≤2 chars)', () => {
    expect(humaniseId('cc_tools')).toBe('CC Tools')
  })

  it('returns empty string for empty input', () => {
    expect(humaniseId('')).toBe('')
  })

  it('collapses repeated separators', () => {
    expect(humaniseId('a__b---c')).toBe('A B C')
  })
})

describe('countByBucket', () => {
  function entry(over: Partial<DashboardSummary> = {}): DashboardSummary {
    return {
      id: 'x',
      title: 'X',
      status: 'GREEN',
      severity: 'unknown',
      updated_at: null,
      source_path: '/x',
      read_error: null,
      ...over,
    }
  }

  it('counts RED entries into red', () => {
    const c = countByBucket([entry({ status: 'RED' }), entry({ status: 'RED' })])
    expect(c).toEqual({ red: 2, amber: 0, green: 0, error: 0 })
  })

  it('counts AMBER entries into amber', () => {
    const c = countByBucket([entry({ status: 'AMBER' })])
    expect(c).toEqual({ red: 0, amber: 1, green: 0, error: 0 })
  })

  it('counts GREEN and PASS into green', () => {
    const c = countByBucket([entry({ status: 'GREEN' }), entry({ status: 'PASS' })])
    expect(c).toEqual({ red: 0, amber: 0, green: 2, error: 0 })
  })

  it('counts read_error into error (not into any status bucket)', () => {
    const c = countByBucket([entry({ read_error: 'boom' })])
    expect(c).toEqual({ red: 0, amber: 0, green: 0, error: 1 })
  })

  it('counts unknown as nothing (not into any bucket)', () => {
    const c = countByBucket([entry({ status: 'unknown' })])
    expect(c).toEqual({ red: 0, amber: 0, green: 0, error: 0 })
  })

  it('handles an empty array', () => {
    expect(countByBucket([])).toEqual({ red: 0, amber: 0, green: 0, error: 0 })
  })
})

describe('summariseDashboard', () => {
  it('returns zero counts and an empty entries list for an empty directory', async () => {
    const r = await summariseDashboard()
    expect(r.entries).toEqual([])
    expect(r.red_count).toBe(0)
    expect(r.amber_count).toBe(0)
    expect(r.green_count).toBe(0)
    expect(r.error_count).toBe(0)
  })

  it('parses a well-formed latest_*.json file into a DashboardSummary', async () => {
    const now = new Date('2026-06-12T13:00:00Z').toISOString()
    await writeFile(
      path.join(tempDir, 'latest_daily_ops_status.json'),
      JSON.stringify({
        status: 'GREEN',
        severity: 'P0',
        title: 'Daily Ops Status',
        updated_at: now,
      }),
      'utf-8',
    )
    const r = await summariseDashboard()
    expect(r.entries).toHaveLength(1)
    const e = r.entries[0]!
    expect(e.id).toBe('daily_ops_status')
    expect(e.title).toBe('Daily Ops Status')
    expect(e.status).toBe('GREEN')
    expect(e.severity).toBe('P0')
    expect(e.updated_at).toBe(now)
    expect(e.read_error).toBeNull()
    expect(r.green_count).toBe(1)
  })

  it('falls back to a humanised id when the JSON has no title field', async () => {
    await writeFile(
      path.join(tempDir, 'latest_lane_16_spec_status.json'),
      JSON.stringify({ status: 'DRAFT_FOR_REVIEW', severity: 'informational' }),
      'utf-8',
    )
    const r = await summariseDashboard()
    const e = r.entries[0]!
    expect(e.id).toBe('lane_16_spec_status')
    expect(e.title).toBe('Lane 16 Spec Status')
  })

  it('classifies a malformed JSON file as read_error without breaking other entries', async () => {
    await writeFile(
      path.join(tempDir, 'latest_one.json'),
      '{ not valid json',
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'latest_two.json'),
      JSON.stringify({ status: 'RED' }),
      'utf-8',
    )
    const r = await summariseDashboard()
    expect(r.entries).toHaveLength(2)
    const byId = new Map(r.entries.map((e) => [e.id, e]))
    expect(byId.get('one')?.read_error).toBeTruthy()
    expect(byId.get('one')?.status).toBe('unknown')
    expect(byId.get('two')?.read_error).toBeNull()
    expect(byId.get('two')?.status).toBe('RED')
    expect(r.error_count).toBe(1)
    expect(r.red_count).toBe(1)
  })

  it('sorts entries in filesystem order (which is alphabetical by filename)', async () => {
    await writeFile(
      path.join(tempDir, 'latest_zzz.json'),
      JSON.stringify({ status: 'GREEN' }),
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'latest_aaa.json'),
      JSON.stringify({ status: 'GREEN' }),
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'latest_mmm.json'),
      JSON.stringify({ status: 'GREEN' }),
      'utf-8',
    )
    const r = await summariseDashboard()
    expect(r.entries.map((e) => e.id)).toEqual(['aaa', 'mmm', 'zzz'])
  })

  it('ignores non-latest_ files and non-.json files', async () => {
    await writeFile(
      path.join(tempDir, 'latest_included.json'),
      JSON.stringify({ status: 'GREEN' }),
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'skipped_md.md'),
      '# nope',
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'README'),
      'nope',
      'utf-8',
    )
    await writeFile(
      path.join(tempDir, 'latest_no_ext'),
      'nope',
      'utf-8',
    )
    const r = await summariseDashboard()
    expect(r.entries.map((e) => e.id)).toEqual(['included'])
  })

  it('throws if the dashboard directory does not exist', async () => {
    process.env.UNITE_DASHBOARD_DIR = '/this/does/not/exist/anywhere'
    await expect(summariseDashboard()).rejects.toThrow(/not accessible/)
  })

  it('throws if the dashboard path is a file rather than a directory', async () => {
    const file = path.join(tempDir, 'not-a-dir.json')
    await writeFile(file, '{}', 'utf-8')
    await expect(summariseDashboard(file)).rejects.toThrow(/not a directory/)
  })

  it('records the scanned_at timestamp from the injected clock', async () => {
    const fixed = new Date('2026-06-12T14:00:00Z')
    const r = await summariseDashboard(undefined, () => fixed)
    expect(r.scanned_at).toBe(fixed.toISOString())
  })
})
