// src/lib/__tests__/businesses.test.ts
import { BUSINESSES } from '../businesses'

describe('BUSINESSES', () => {
  it('has 7 entries', () => {
    expect(BUSINESSES).toHaveLength(7)
  })

  it('each entry has key, name, color, status', () => {
    for (const biz of BUSINESSES) {
      expect(biz).toMatchObject({
        key: expect.any(String),
        name: expect.any(String),
        color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        status: expect.stringMatching(/^(active|planning)$/),
      })
    }
  })

  it('all businesses are active', () => {
    expect(BUSINESSES.every(b => b.status === 'active')).toBe(true)
  })
})
