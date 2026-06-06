import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

describe('command centre operator gateway UI source', () => {
  it('renders the required safety and lane visibility language', () => {
    const page = readFileSync(
      join(root, 'src/app/(founder)/founder/command-centre/operator-gateway/page.tsx'),
      'utf8',
    )

    expect(page).toContain('No API keys')
    expect(page).toContain('Operator-session lanes only')
    expect(page).toContain('No external execution yet')
    expect(page).toContain('Production actions gated')
    expect(page).toContain('Senior PM next action queue')
    expect(page).toContain('Hard-gate warnings')
    expect(page).toContain('Daily ops panel')
    expect(page).toContain('Queue disabled until sandbox DB + execution gate')
  })

  it('does not introduce browser automation, secret storage, or live runner calls', () => {
    const page = readFileSync(
      join(root, 'src/app/(founder)/founder/command-centre/operator-gateway/page.tsx'),
      'utf8',
    )

    expect(page).not.toMatch(/process\.env\.[A-Z_]*(?:SECRET|KEY|TOKEN)/)
    expect(page).not.toContain('localStorage')
    expect(page).not.toContain('sessionStorage')
    expect(page).not.toContain('puppeteer')
    expect(page).not.toContain('playwright')
    expect(page).not.toContain('runOperatorJob')
  })
})
