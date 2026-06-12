// src/lib/command-centre/evidence-stream.ts
//
// Lane 16 — CRM Command-Centre Live Evidence Stream tile (foundation).
//
// Read-only tail of the 2nd-brain `.agentic_nexus/evidence/evidence_ledger.jsonl`.
// Parses the most recent N entries (default 5), tolerates malformed lines by
// skipping them, and exposes a typed result the Evidence Stream tile will render.
// NEVER mutates, NEVER executes, NEVER reaches the network.
//
// All paths are absolute; this module does NOT depend on `process.cwd()`.

import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

/** One parsed evidence-ledger entry. The schema is intentionally permissive
 *  because the ledger is append-only and older entries may pre-date current
 *  field conventions. We extract what we can, label the rest as `unknown`,
 *  and never throw on a single bad line. */
export interface EvidenceEntry {
  /** 1-based line number within the file (counted from the tail). */
  line_index: number
  /** Raw text of the line, for debugging. */
  raw: string
  /** Parsed JSON object, if the line was valid JSON. */
  parsed: Record<string, unknown> | null
  /** Set to a non-null message if the line could not be parsed. */
  parse_error: string | null
  /** Convenience fields lifted from common locations. */
  timestamp: string | null
  event: string | null
  event_type: string | null
  repo: string | null
  head_ref: string | null
  head_sha: string | null
  pr_url: string | null
  merge_commit: string | null
  safety: Record<string, unknown> | null
}

/** Result of one `tailEvidence` call. */
export interface EvidenceStreamResult {
  /** The vault file that was tailed. */
  ledger_path: string
  /** When the tail ran, in UTC ISO. */
  scanned_at: string
  /** How many lines were in the file (after stripping the trailing newline). */
  total_lines: number
  /** How many lines were successfully parsed and included in `entries`. */
  parsed_lines: number
  /** How many tail lines were malformed or empty and skipped. */
  malformed_lines: number
  /** The most recent N parsed entries, newest first. */
  entries: EvidenceEntry[]
}

const SENTINEL: unique symbol = Symbol('evidence-stream-internal')
type TailLine = { line_index: number; raw: string; parsed: Record<string, unknown> | null; parse_error: string | null } & {
  readonly [SENTINEL]: true
}

/**
 * Resolve the evidence-ledger path.
 *
 * Default: `~/2nd-brain/.agentic_nexus/evidence/evidence_ledger.jsonl`. Override
 * with `process.env.UNITE_EVIDENCE_LEDGER_PATH` for test isolation.
 */
export function resolveEvidenceLedgerPath(): string {
  const fromEnv = process.env.UNITE_EVIDENCE_LEDGER_PATH?.trim()
  if (fromEnv) return fromEnv
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '2nd-brain', '.agentic_nexus', 'evidence', 'evidence_ledger.jsonl')
}

/**
 * Read the ledger from the tail. Returns the most recent `n` entries
 * (default 5), newest first. The function never throws for a missing
 * or empty file — it returns an empty `entries` array. It DOES throw
 * if the path is a directory (a structural problem worth failing on).
 *
 * Implementation note: the ledger is append-only, so we read the file
 * once and slice from the tail. For multi-megabyte ledgers this is
 * fine because the consumer only needs the last N lines. If the file
 * ever grows past a few MB, switch to a tail-by-bytes implementation.
 */
export async function tailEvidence(
  ledgerPath: string = resolveEvidenceLedgerPath(),
  n: number = 5,
  now: () => Date = () => new Date(),
): Promise<EvidenceStreamResult> {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid n: ${n} (must be a positive integer)`)
  }
  let exists = true
  try {
    const st = await stat(ledgerPath)
    if (st.isDirectory()) {
      throw new Error(`Evidence ledger path is a directory, not a file: ${ledgerPath}`)
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code
    if (code === 'ENOENT') {
      exists = false
    } else {
      throw err
    }
  }

  if (!exists) {
    return {
      ledger_path: ledgerPath,
      scanned_at: now().toISOString(),
      total_lines: 0,
      parsed_lines: 0,
      malformed_lines: 0,
      entries: [],
    }
  }

  const raw = await readFile(ledgerPath, 'utf-8')
  const allLines = raw.split('\n')
  // Drop the trailing empty line that text files often end with.
  while (allLines.length > 0 && allLines[allLines.length - 1] === '') {
    allLines.pop()
  }
  const totalLines = allLines.length
  const tailLines = allLines.slice(Math.max(0, totalLines - n))

  // First pass: parse every tail line, preserving the original line_index.
  const parsed: TailLine[] = tailLines.map((line, idx): TailLine => {
    const lineIndex = totalLines - tailLines.length + idx + 1
    if (line.trim() === '') {
      return {
        [SENTINEL]: true,
        line_index: lineIndex,
        raw: line,
        parsed: null,
        parse_error: 'empty line',
      }
    }
    try {
      const obj: unknown = JSON.parse(line)
      if (typeof obj !== 'object' || obj === null) {
        return {
          [SENTINEL]: true,
          line_index: lineIndex,
          raw: line,
          parsed: null,
          parse_error: 'JSON root is not an object',
        }
      }
      return {
        [SENTINEL]: true,
        line_index: lineIndex,
        raw: line,
        parsed: obj as Record<string, unknown>,
        parse_error: null,
      }
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err)
      return {
        [SENTINEL]: true,
        line_index: lineIndex,
        raw: line,
        parsed: null,
        parse_error: reason,
      }
    }
  })

  // Surface malformed/empty lines via counts; the user-facing `entries` only
  // contains successfully parsed lines. This matches the contract:
  // "tolerates malformed lines by skipping them."
  const malformedLines = parsed.filter((tl) => tl.parse_error !== null).length

  const entries: EvidenceEntry[] = parsed
    .filter((tl) => tl.parse_error === null)
    .reverse() // newest first
    .map((tl): EvidenceEntry => {
      const p = tl.parsed
      return {
        line_index: tl.line_index,
        raw: tl.raw,
        parsed: p,
        parse_error: tl.parse_error,
        timestamp: pickString(p, ['timestamp']),
        event: pickString(p, ['event']),
        event_type: pickString(p, ['event_type']),
        repo: pickString(p, ['repo']),
        head_ref: pickString(p, ['head_ref']),
        head_sha: pickString(p, ['head_sha']),
        pr_url: pickString(p, ['pr_url']),
        merge_commit: pickString(p, ['merge_commit']),
        safety: pickObject(p, ['safety']),
      }
    })

  return {
    ledger_path: ledgerPath,
    scanned_at: now().toISOString(),
    total_lines: totalLines,
    parsed_lines: entries.length,
    malformed_lines: malformedLines,
    entries,
  }
}

/** Pull the first non-null string value from a record at any of the given keys. */
function pickString(rec: Record<string, unknown> | null, keys: string[]): string | null {
  if (!rec) return null
  for (const k of keys) {
    const v = rec[k]
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

/** Pull the first non-null object value from a record at any of the given keys. */
function pickObject(rec: Record<string, unknown> | null, keys: string[]): Record<string, unknown> | null {
  if (!rec) return null
  for (const k of keys) {
    const v = rec[k]
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      return v as Record<string, unknown>
    }
  }
  return null
}
