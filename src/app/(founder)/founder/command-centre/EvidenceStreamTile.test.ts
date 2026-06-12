// src/app/(founder)/founder/command-centre/EvidenceStreamTile.test.ts
//
// Lane 16 — Lane 16 component source contract tests.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = join(
  root,
  'src/app/(founder)/founder/command-centre/EvidenceStreamTile.tsx',
)

describe('EvidenceStreamTile source contract', () => {
  const src = readFileSync(path, 'utf8')

  it('is a server component (no "use client" directive)', () => {
    expect(src).not.toMatch(/^['"]use client['"]/m)
  })

  it('renders the data-testid hook used by the deck selector', () => {
    expect(src).toContain('data-testid="evidence-stream-tile"')
  })

  it('renders the data-testid empty-state hook when the ledger is empty', () => {
    expect(src).toContain('data-testid="evidence-stream-tile-empty"')
  })

  it('surfaces the malformed-line count so missing data is visible', () => {
    expect(src).toContain('malformed_lines')
    expect(src).toMatch(/malformed.*skipped|skipped/i)
  })

  it('renders per-row line_index data attribute for backref hooks', () => {
    expect(src).toContain('data-line-index={e.line_index}')
  })

  it('does not import from any client-only React hooks (useState/useEffect)', () => {
    expect(src).not.toMatch(/\buse(State|Effect|Reducer|Ref)\b/)
  })

  it('does not introduce browser automation, secret storage, or network calls', () => {
    expect(src).not.toMatch(/process\.env\.[A-Z_]*(?:SECRET|KEY|TOKEN)/)
    expect(src).not.toMatch(/fetch\(|axios\.|http\.|https\./)
  })
})
