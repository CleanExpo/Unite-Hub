// src/lib/__tests__/businesses.test.ts
import { BUSINESSES } from '../businesses'

describe('BUSINESSES', () => {
  it('has 8 entries', () => {
    expect(BUSINESSES).toHaveLength(8)
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

  it('ATO has planning status', () => {
    const ato = BUSINESSES.find(b => b.key === 'ato')
    expect(ato?.status).toBe('planning')
  })

  it('all other businesses are active', () => {
    const others = BUSINESSES.filter(b => b.key !== 'ato')
    expect(others.every(b => b.status === 'active')).toBe(true)
  })
})
