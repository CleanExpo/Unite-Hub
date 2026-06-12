// src/lib/command-centre/in-progress-prs.ts
//
// Lane 16.5 — In-Progress PRs tile (foundation).
//
// Read-only helper that shells out to `gh pr list --state open` and parses
// the JSON into a typed result. Falls back to an empty list if `gh` is
// not available or not authenticated.
//
// The CLI invocation runs the user-level `gh` binary (no token in env);
// it inherits the existing `gh auth` session on the developer's machine.
// For server-side use in the deck, the route handler invokes this and
// surfaces the result; no secret tokens are ever read by this module.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface InProgressPR {
  /** PR number, as a string (gh returns numbers as strings). */
  number: string
  /** PR title. */
  title: string
  /** Author login. */
  author: string
  /** Head branch name. */
  head_ref: string
  /** ISO 8601 timestamp the PR was created. */
  created_at: string
  /** PR URL. */
  url: string
  /** Optional age in days, computed at parse time. */
  age_days: number | null
}

export interface InProgressPRsResult {
  /** Path of the `gh` binary used (or 'gh' if PATH resolution succeeded). */
  gh_path: string
  /** ISO timestamp the scan ran. */
  scanned_at: string
  /** True if `gh` was available AND authenticated AND returned data. */
  gh_available: boolean
  /** All open PRs in the repository (across all authors), newest first. */
  entries: InProgressPR[]
  /** Human-readable status, suitable for tile render. */
  status_message: string
  /** Set to a non-null message if `gh` failed. */
  read_error: string | null
}

interface GhPrListRow {
  number: number
  title: string
  author: { login: string } | string
  headRefName: string
  createdAt: string
  url: string
}

/**
 * Run `gh pr list --state open --limit 100 --json ...` and return the parsed
 * result. If `gh` is not installed, not authenticated, or fails, returns a
 * structured result with `gh_available: false` and a status_message. Never
 * throws.
 */
export async function listInProgressPRs(
  cwd: string = process.cwd(),
  now: () => Date = () => new Date(),
): Promise<InProgressPRsResult> {
  const fields = ['number', 'title', 'author', 'headRefName', 'createdAt', 'url']
  const args = ['pr', 'list', '--state', 'open', '--limit', '100', '--json', ...fields]

  try {
    const { stdout } = await execFileAsync('gh', args, {
      cwd,
      timeout: 15_000,
      maxBuffer: 4 * 1024 * 1024,
    })
    const rows: unknown = JSON.parse(stdout)
    if (!Array.isArray(rows)) {
      return {
        gh_path: 'gh',
        scanned_at: now().toISOString(),
        gh_available: true,
        entries: [],
        status_message: 'gh returned non-array output',
        read_error: null,
      }
    }
    const entries: InProgressPR[] = rows
      .map((raw): InProgressPR | null => {
        if (typeof raw !== 'object' || raw === null) return null
        const r = raw as Partial<GhPrListRow>
        if (
          typeof r.number !== 'number' ||
          typeof r.title !== 'string' ||
          typeof r.headRefName !== 'string' ||
          typeof r.createdAt !== 'string' ||
          typeof r.url !== 'string'
        ) {
          return null
        }
        const author =
          typeof r.author === 'object' && r.author !== null && 'login' in r.author
            ? (r.author as { login: string }).login
            : typeof r.author === 'string'
              ? r.author
              : 'unknown'
        const created = new Date(r.createdAt)
        const ageMs = now().getTime() - created.getTime()
        const ageDays = Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 86_400_000)) : null
        return {
          number: String(r.number),
          title: r.title,
          author,
          head_ref: r.headRefName,
          created_at: r.createdAt,
          url: r.url,
          age_days: ageDays,
        }
      })
      .filter((e): e is InProgressPR => e !== null)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

    return {
      gh_path: 'gh',
      scanned_at: now().toISOString(),
      gh_available: true,
      entries,
      status_message: entries.length === 0 ? 'no open PRs' : `${entries.length} open PRs`,
      read_error: null,
    }
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string }
    if (e.code === 'ENOENT') {
      return {
        gh_path: 'gh',
        scanned_at: now().toISOString(),
        gh_available: false,
        entries: [],
        status_message: 'gh CLI not installed on this machine',
        read_error: 'gh CLI not found in PATH',
      }
    }
    const stderr = e.stderr?.trim() ?? ''
    const message = stderr || (e instanceof Error ? e.message : String(e))
    return {
      gh_path: 'gh',
      scanned_at: now().toISOString(),
      gh_available: false,
      entries: [],
      status_message: 'gh failed (see read_error)',
      read_error: message,
    }
  }
}
