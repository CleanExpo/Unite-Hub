// src/app/(founder)/founder/command-centre/InProgressPRsTile.test.ts
//
// Lane 16.5 — Lane 16 component source contract tests.

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = join(
  root,
  'src/app/(founder)/founder/command-centre/InProgressPRsTile.tsx',
)

describe('InProgressPRsTile source contract', () => {
  const src = readFileSync(path, 'utf8')

  it('is a server component (no "use client" directive)', () => {
    expect(src).not.toMatch(/^['"]use client['"]/m)
  })

  it('renders the data-testid hook used by the deck selector', () => {
    expect(src).toContain('data-testid="in-progress-prs-tile"')
  })

  it('renders the data-testid empty-state hook when there are no open PRs', () => {
    expect(src).toContain('data-testid="in-progress-prs-tile-empty"')
  })

  it('attaches the PR number as a data attribute for backref hooks', () => {
    expect(src).toContain('data-pr-number={pr.number}')
  })

  it('does not import from any client-only React hooks (useState/useEffect)', () => {
    expect(src).not.toMatch(/\buse(State|Effect|Reducer|Ref)\b/)
  })

  it('does not introduce browser automation, secret storage, or network calls', () => {
    expect(src).not.toMatch(/process\.env\.[A-Z_]*(?:SECRET|KEY|TOKEN)/)
    expect(src).not.toMatch(/fetch\(|axios\.|http\.|https\./)
  })
})
