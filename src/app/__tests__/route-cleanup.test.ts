import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('route cleanup', () => {
  it('does not ship the legacy direct founder workspace tree', () => {
    expect(existsSync(join(root, 'src/app/founder/layout.tsx'))).toBe(false)
    expect(existsSync(join(root, 'src/app/founder/workspace/page.tsx'))).toBe(false)
  })

  it('does not ship the obsolete Founder OS manifest', () => {
    expect(existsSync(join(root, 'public/founder-os-manifest.json'))).toBe(false)
  })

  it('ships only a cleanup worker for retired Founder OS caches', () => {
    const serviceWorker = readFileSync(join(root, 'public/founder-os-sw.js'), 'utf8')

    expect(serviceWorker).toContain('phill-os')
    expect(serviceWorker).toContain('caches.delete')
    expect(serviceWorker).toContain('registration.unregister')
    expect(serviceWorker).not.toContain('cache.addAll')
    expect(serviceWorker).not.toContain('/api/founder-os/')
  })
})
