// src/lib/command-centre/markdown.ts
//
// Lane 16 — CRM Command-Centre tiles (PR #X+1).
//
// Tiny markdown-table parser for the two tile components that read the
// Senior PM backlog + action-queue files. NOT a general-purpose markdown
// parser — only handles the pipe-table format that lives in:
//
//   - 2nd-brain/.agentic_nexus/SENIOR_PM_NEXT_ACTION_QUEUE.md
//   - 2nd-brain/.agentic_nexus/ACTIVE_PROGRAMME_BACKLOG.md
//
// Both files use the same column shape: a header row, a separator row
// (`|---|---|...`), then N data rows. We do not handle nested tables,
// multi-line cells, or escaped pipes — the real files do not need them.
//
// Pure function library, no I/O. Tests in __tests__/markdown.test.ts.

export interface MarkdownTable {
  /** Column headers, trimmed. */
  headers: string[]
  /** Data rows; each row has the same number of cells as `headers`. */
  rows: string[][]
}

/**
 * Parse a markdown pipe-table from a chunk of text. Returns null if the
 * chunk does not contain a recognisable table (no separator row).
 *
 * The returned rows are trimmed of leading/trailing whitespace per cell.
 * Empty cells become empty strings (not undefined).
 *
 * This is intentionally permissive: if a row has fewer or more cells
 * than the header, we pad with empty strings or trim to match. The
 * caller's render layer is responsible for handling the visual result.
 */
export function parseMarkdownTable(text: string): MarkdownTable | null {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+$/g, ''))
    .filter((l) => l.length > 0)

  if (lines.length < 2) return null

  // Find a header row, then a separator row directly after it.
  for (let i = 0; i < lines.length - 1; i++) {
    const headerLine = lines[i]!
    if (!isPipeRow(headerLine)) continue
    const sepLine = lines[i + 1]!
    if (!isSeparatorRow(sepLine)) continue

    const headers = splitRow(headerLine)
    const expectedCols = headers.length
    const dataLines = lines.slice(i + 2)

    const rows: string[][] = []
    for (const dl of dataLines) {
      if (!isPipeRow(dl)) break
      const cells = splitRow(dl)
      // Pad / trim to match header width.
      while (cells.length < expectedCols) cells.push('')
      if (cells.length > expectedCols) cells.length = expectedCols
      rows.push(cells)
    }
    return { headers, rows }
  }
  return null
}

/** True if the line looks like a pipe row: contains at least one `|`. */
function isPipeRow(line: string): boolean {
  return line.includes('|')
}

/** True if the line is a separator row like `|---|---|`. */
function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') && !trimmed.includes('|')) return false
  // Every cell between pipes must look like `---` (possibly with leading
  // or trailing whitespace and a trailing `:` for alignment markers).
  const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|')
  return cells.every((c) => /^:?-{3,}:?$/.test(c.trim()))
}

/**
 * Split a pipe row into cells. Trims each cell. Returns an empty array
 * if the row does not actually contain pipes.
 */
export function splitRow(line: string): string[] {
  if (!line.includes('|')) return []
  // Strip a leading/trailing pipe so we don't end up with empty cells.
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1)
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1)
  return trimmed.split('|').map((c) => c.trim())
}

/**
 * Extract the first N data rows from a markdown table. Convenience for
 * the tile components that want "top 5 next actions" without re-parsing.
 */
export function topRows(table: MarkdownTable, n: number): string[][] {
  if (n < 1) return []
  return table.rows.slice(0, n)
}

/**
 * Find the column index of a header that contains a given substring
 * (case-insensitive). Returns -1 if no match.
 */
export function findColumnIndex(headers: string[], needle: string): number {
  const lower = needle.toLowerCase()
  return headers.findIndex((h) => h.toLowerCase().includes(lower))
}
