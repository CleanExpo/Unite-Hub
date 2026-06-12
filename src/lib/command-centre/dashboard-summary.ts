// src/lib/command-centre/dashboard-summary.ts
//
// Lane 16 — CRM Command-Centre OS Health tile (foundation).
//
// Read-only aggregator over the 2nd-brain `.agentic_nexus/dashboard/` directory.
// Scans every `latest_*.json` file, extracts a uniform `{ id, title, status, severity,
// updated_at }` summary, and exposes a typed result the OS Health tile component will
// render. NEVER mutates, NEVER executes, NEVER reaches the network.
//
// This is a pure data-access helper. No DB, no secrets, no env vars, no
// external services. Files are read in parallel via `Promise.all`. Per-file
// read errors are caught and surfaced as `read_error` entries so a single
// missing/malformed JSON does not break the whole summary (NorthStar:
// "200 ≠ real" — render the source path, never fall back to mock data).
//
// All paths are absolute; this module does NOT depend on `process.cwd()`.

import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** Status string the OS Health tile understands. Unrecognised statuses are mapped to 'unknown'. */
export type DashboardStatus = 'GREEN' | 'AMBER' | 'RED' | 'PASS' | 'DRAFT_FOR_REVIEW' | 'unknown'

/** Severity ranking for sort/colour. P0 highest, P4 lowest. Unrecognised = 'info'. */
export type DashboardSeverity =
  | 'P0'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'informational'
  | 'unknown'

/** One OS Health card. One per `latest_*.json` file found on disk. */
export interface DashboardSummary {
  /** Stable id derived from the file name, e.g. `latest_daily_ops_status` → `daily_ops_status`. */
  id: string
  /** Title from the JSON's `title` field. Falls back to a humanised id. */
  title: string
  /** Status from the JSON's `status` field. Unrecognised values are 'unknown'. */
  status: DashboardStatus
  /** Severity from the JSON's `severity` field, if present. Defaults to 'unknown'. */
  severity: DashboardSeverity
  /** ISO timestamp from the JSON's `updated_at` field, if present. */
  updated_at: string | null
  /** Absolute path of the file on disk. Always populated. */
  source_path: string
  /** Set to a non-null message if the file could not be read or parsed. */
  read_error: string | null
}

/** Result of one `summariseDashboard` call. */
export interface DashboardSummaryResult {
  /** The vault root that was scanned. */
  dashboard_dir: string
  /** When the scan ran, in UTC ISO. */
  scanned_at: string
  /** All cards, in filesystem order. */
  entries: DashboardSummary[]
  /** Convenience count: how many cards are RED. */
  red_count: number
  /** Convenience count: how many cards are AMBER. */
  amber_count: number
  /** Convenience count: how many cards are GREEN or PASS. */
  green_count: number
  /** Convenience count: how many cards have a read_error. */
  error_count: number
}

const KNOWN_STATUSES: ReadonlySet<DashboardStatus> = new Set<DashboardStatus>([
  'GREEN',
  'AMBER',
  'RED',
  'PASS',
  'DRAFT_FOR_REVIEW',
])

const KNOWN_SEVERITIES: ReadonlySet<DashboardSeverity> = new Set<DashboardSeverity>([
  'P0',
  'P1',
  'P2',
  'P3',
  'P4',
  'informational',
])

/**
 * Resolve the dashboard directory.
 *
 * Default: `~/2nd-brain/.agentic_nexus/dashboard`. Override with
 * `process.env.UNITE_DASHBOARD_DIR` for test isolation. The function
 * is exported so tests can pre-set the env var and assert the path
 * without depending on the OS home.
 */
export function resolveDashboardDir(): string {
  const fromEnv = process.env.UNITE_DASHBOARD_DIR?.trim()
  if (fromEnv) return fromEnv
  // Anchor to the OS home; matches the .agentic_nexus location documented
  // in the 2nd-brain vault's CLAUDE.md. This is intentionally NOT
  // `process.cwd()`-relative so the helper works from any repo (Unite-Hub
  // today, possibly other repos tomorrow).
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '2nd-brain', '.agentic_nexus', 'dashboard')
}

/**
 * Derive a stable id from a `latest_*.json` filename.
 * `latest_daily_ops_status.json` → `daily_ops_status`.
 * `latest_lane_16_spec_status.json` → `lane_16_spec_status`.
 */
export function idFromFilename(filename: string): string {
  return filename.replace(/^latest_/, '').replace(/\.json$/i, '')
}

/** Map an arbitrary status string from a dashboard JSON to a known enum. */
export function normaliseStatus(raw: unknown): DashboardStatus {
  if (typeof raw !== 'string') return 'unknown'
  const upper = raw.trim().toUpperCase()
  if ((KNOWN_STATUSES as Set<string>).has(upper)) return upper as DashboardStatus
  return 'unknown'
}

/** Map an arbitrary severity string to a known enum. */
export function normaliseSeverity(raw: unknown): DashboardSeverity {
  if (typeof raw !== 'string') return 'unknown'
  const trimmed = raw.trim()
  // Try the exact value first (some enums are lowercase: 'informational').
  if ((KNOWN_SEVERITIES as Set<string>).has(trimmed)) return trimmed as DashboardSeverity
  // Then try uppercased (P0..P4 may arrive as 'p0' etc).
  const upper = trimmed.toUpperCase()
  if ((KNOWN_SEVERITIES as Set<string>).has(upper)) return upper as DashboardSeverity
  return 'unknown'
}

/** Humanise a kebab/snake id into a Title Case label. `daily_ops_status` → `Daily Ops Status`. */
export function humaniseId(id: string): string {
  return id
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
}

/** Count cards by status bucket. Internal helper; exported for tests. */
export function countByBucket(entries: DashboardSummary[]): {
  red: number
  amber: number
  green: number
  error: number
} {
  let red = 0
  let amber = 0
  let green = 0
  let error = 0
  for (const e of entries) {
    if (e.read_error) {
      error += 1
      continue
    }
    if (e.status === 'RED') red += 1
    else if (e.status === 'AMBER') amber += 1
    else if (e.status === 'GREEN' || e.status === 'PASS') green += 1
  }
  return { red, amber, green, error }
}

/**
 * Read the dashboard directory, parse every `latest_*.json`, and return a typed
 * summary. The function is the only entry point the OS Health tile will use.
 *
 * Per-file read errors are caught and surfaced as `read_error` entries; the
 * function never throws for "file is missing or malformed." It DOES throw
 * for "dashboard directory is not a directory" (a structural problem worth
 * failing on).
 */
export async function summariseDashboard(
  dir: string = resolveDashboardDir(),
  now: () => Date = () => new Date(),
): Promise<DashboardSummaryResult> {
  const dirStat = await stat(dir).catch((err: unknown) => {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Dashboard directory not accessible: ${dir} (${reason})`)
  })
  if (!dirStat.isDirectory()) {
    throw new Error(`Dashboard path is not a directory: ${dir}`)
  }

  const all = await readdir(dir)
  const jsonFiles = all.filter((n) => n.startsWith('latest_') && n.endsWith('.json')).sort()

  const entries: DashboardSummary[] = await Promise.all(
    jsonFiles.map(async (filename): Promise<DashboardSummary> => {
      const filePath = path.join(dir, filename)
      const id = idFromFilename(filename)
      try {
        const raw = await readFile(filePath, 'utf-8')
        const parsed: unknown = JSON.parse(raw)
        if (typeof parsed !== 'object' || parsed === null) {
          return {
            id,
            title: humaniseId(id),
            status: 'unknown',
            severity: 'unknown',
            updated_at: null,
            source_path: filePath,
            read_error: 'JSON root is not an object',
          }
        }
        const obj = parsed as Record<string, unknown>
        const titleRaw = obj.title
        const title =
          typeof titleRaw === 'string' && titleRaw.trim().length > 0
            ? titleRaw.trim()
            : humaniseId(id)
        return {
          id,
          title,
          status: normaliseStatus(obj.status),
          severity: normaliseSeverity(obj.severity),
          updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : null,
          source_path: filePath,
          read_error: null,
        }
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : String(err)
        return {
          id,
          title: humaniseId(id),
          status: 'unknown',
          severity: 'unknown',
          updated_at: null,
          source_path: filePath,
          read_error: reason,
        }
      }
    }),
  )

  const counts = countByBucket(entries)
  return {
    dashboard_dir: dir,
    scanned_at: now().toISOString(),
    entries,
    red_count: counts.red,
    amber_count: counts.amber,
    green_count: counts.green,
    error_count: counts.error,
  }
}
