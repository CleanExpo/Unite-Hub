// src/lib/ai/__tests__/features/memory.test.ts
// Unit tests for the memory tool configuration builder.

import { describe, it, expect } from 'vitest'
import { buildMemoryToolConfig } from '../../features/memory'
import type { MemoryConfig } from '../../features/memory'

describe('Memory Tool', () => {
  it('default config has type=memory and name=memory', () => {
    const config = buildMemoryToolConfig()
    expect(config.type).toBe('memory')
    expect(config.name).toBe('memory')
  })

  it('custom namespace is included', () => {
    const config = buildMemoryToolConfig({ namespace: 'founder-notes' })
    expect(config.namespace).toBe('founder-notes')
  })

  it('MemoryConfig type works', () => {
    const mc: MemoryConfig = { namespace: 'test-ns' }
    expect(mc.namespace).toBe('test-ns')
  })
})
