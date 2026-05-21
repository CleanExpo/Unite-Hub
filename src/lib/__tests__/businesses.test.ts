// src/lib/__tests__/businesses.test.ts
import { BUSINESSES } from '../businesses'

describe('BUSINESSES', () => {
  it('has 7 entries', () => {
    expect(BUSINESSES).toHaveLength(7)
  })

  it('each entry has key, name, color, status, type', () => {
    for (const biz of BUSINESSES) {
      expect(biz).toMatchObject({
        key: expect.any(String),
        name: expect.any(String),
        color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        status: expect.stringMatching(/^(active|planning)$/),
        type: expect.stringMatching(/^(owned|client)$/),
      })
    }
  })

  it('all businesses are active', () => {
    expect(BUSINESSES.every(b => b.status === 'active')).toBe(true)
  })

  it('CCW is the only client-type business', () => {
    const clients = BUSINESSES.filter(b => b.type === 'client')
    expect(clients).toHaveLength(1)
    expect(clients[0].key).toBe('ccw')
  })

  it('has 6 owned business keys (dr and nrpg are separate keys for one business entity)', () => {
    const owned = BUSINESSES.filter(b => b.type === 'owned')
    expect(owned).toHaveLength(6)
  })
})
