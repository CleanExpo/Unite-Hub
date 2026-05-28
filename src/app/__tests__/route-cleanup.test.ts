import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('route cleanup', () => {
  it('does not ship the legacy direct founder workspace tree', () => {
    expect(existsSync(join(root, 'src/app/founder/layout.tsx'))).toBe(false)
    expect(existsSync(join(root, 'src/app/founder/workspace/page.tsx'))).toBe(false)
  })

  it('does not ship obsolete Founder OS PWA assets', () => {
    expect(existsSync(join(root, 'public/founder-os-manifest.json'))).toBe(false)
    expect(existsSync(join(root, 'public/founder-os-sw.js'))).toBe(false)
  })
})
