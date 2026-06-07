import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

describe('command centre project DoD coverage UI source', () => {
  it('shows Project Definition of Done coverage and false-done prevention', () => {
    const source = readFileSync(
      join(root, 'src/app/(founder)/founder/command-centre/operator-gateway/page.tsx'),
      'utf8',
    )

    expect(source).toContain('Project Definition of Done Engine')
    expect(source).toContain('Project coverage')
    expect(source).toContain('false-done prevention active')
    expect(source).toContain('project done')
    expect(source).toContain('missing requirements')
    expect(source).toContain('next generated jobs')
    expect(source).toContain('/api/hermes/operator-gateway/project-coverage')
  })
})
