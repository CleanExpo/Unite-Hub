// src/app/(founder)/founder/command-centre/ActionQueueTile.test.ts
//
// Lane 16 — Lane 16 component source contract tests.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = join(
  root,
  'src/app/(founder)/founder/command-centre/ActionQueueTile.tsx',
)

describe('ActionQueueTile source contract', () => {
  const src = readFileSync(path, 'utf8')

  it('is a server component (no "use client" directive)', () => {
    expect(src).not.toMatch(/^['"]use client['"]/m)
  })

  it('renders the data-testid hook used by the deck selector', () => {
    expect(src).toContain('data-testid="action-queue-tile"')
  })

  it('renders the data-testid empty-state hook when the queue has no actions', () => {
    expect(src).toContain('data-testid="action-queue-tile-empty"')
  })

  it('renders the data-testid error-state hook when the file cannot be read', () => {
    expect(src).toContain('data-testid="action-queue-tile-error"')
  })

  it('exposes a server-side loader that NEVER throws (returns structured result)', () => {
    expect(src).toContain('export async function loadActionQueueData')
    // The loader catches errors and returns a read_error field instead.
    expect(src).toContain('read_error')
    expect(src).toMatch(/catch\s*\(\s*err\s*:\s*unknown\s*\)/)
  })

  it('does not import from any client-only React hooks (useState/useEffect)', () => {
    expect(src).not.toMatch(/\buse(State|Effect|Reducer|Ref)\b/)
  })

  it('does not introduce browser automation, secret storage, or network calls', () => {
    expect(src).not.toMatch(/process\.env\.[A-Z_]*(?:SECRET|KEY|TOKEN)/)
    expect(src).not.toMatch(/fetch\(|axios\.|http\.|https\./)
  })
})
