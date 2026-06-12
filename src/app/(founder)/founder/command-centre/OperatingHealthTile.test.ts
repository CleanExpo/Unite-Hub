// src/app/(founder)/founder/command-centre/OperatingHealthTile.test.ts
//
// Lane 16 — Lane 16 component source contract tests.
//
// We do NOT render React here. The existing deck convention
// (operator-gateway/__tests__/page-source.test.ts) is to test the source
// file's contract directly: what it must contain, what it must not
// contain. This is faster, more stable, and avoids needing a React
// testing library setup for a tile that's pure data render.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = join(
  root,
  'src/app/(founder)/founder/command-centre/OperatingHealthTile.tsx',
)

describe('OperatingHealthTile source contract', () => {
  const src = readFileSync(path, 'utf8')

  it('is a server component (no "use client" directive)', () => {
    expect(src).not.toMatch(/^['"]use client['"]/m)
  })

  it('renders the data-testid hook used by the deck selector', () => {
    expect(src).toContain('data-testid="operating-health-tile"')
  })

  it('exposes a per-card status data attribute for CSS / sort hooks', () => {
    expect(src).toContain('data-status={e.status}')
    expect(src).toContain('data-severity={e.severity}')
  })

  it('surfaces per-file read errors in orange so missing data is visible', () => {
    expect(src).toContain('read_error')
    expect(src).toMatch(/color:\s*['"]#fb923c['"]/)
  })

  it('always renders the source path on the card footer (NorthStar: 200 != real)', () => {
    expect(src).toContain('source_path')
    expect(src).toContain('title={e.source_path}')
  })

  it('does not import from any client-only React hooks (useState/useEffect)', () => {
    expect(src).not.toMatch(/\buse(State|Effect|Reducer|Ref)\b/)
  })

  it('does not introduce browser automation, secret storage, or network calls', () => {
    expect(src).not.toMatch(/process\.env\.[A-Z_]*(?:SECRET|KEY|TOKEN)/)
    expect(src).not.toMatch(/fetch\(|axios\.|http\.|https\./)
  })
})
