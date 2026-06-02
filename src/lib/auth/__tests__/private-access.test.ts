import { describe, expect, it } from 'vitest'
import { getPrivateAccessConfig, hasPrivateAccess, isPrivateAccessConfigured } from '../private-access'

describe('private access allow-list', () => {
  it('allows access when no founder allow-list is configured to prevent accidental lockout', () => {
    expect(hasPrivateAccess({ id: 'any-user', email: 'guest@example.com' }, {} as NodeJS.ProcessEnv)).toBe(true)
    expect(isPrivateAccessConfigured({} as NodeJS.ProcessEnv)).toBe(false)
  })

  it('allows the configured founder user id', () => {
    const env = { FOUNDER_USER_ID: 'founder-user-id' } as NodeJS.ProcessEnv

    expect(hasPrivateAccess({ id: 'founder-user-id', email: 'other@example.com' }, env)).toBe(true)
    expect(hasPrivateAccess({ id: 'stranger', email: 'other@example.com' }, env)).toBe(false)
  })

  it('allows explicitly invited founder emails case-insensitively', () => {
    const env = { FOUNDER_ALLOWED_EMAILS: 'Phill@Example.com, ops@example.com' } as NodeJS.ProcessEnv

    expect(hasPrivateAccess({ id: 'u1', email: 'phill@example.com' }, env)).toBe(true)
    expect(hasPrivateAccess({ id: 'u2', email: 'OPS@example.com' }, env)).toBe(true)
    expect(hasPrivateAccess({ id: 'u3', email: 'guest@example.com' }, env)).toBe(false)
  })

  it('normalises legacy and new env names into one config', () => {
    const env = {
      FOUNDER_USER_ID: 'primary-id',
      FOUNDER_ALLOWED_USER_IDS: 'id-a, id-b',
      ALLOWED_FOUNDER_EMAILS: 'founder@example.com',
    } as NodeJS.ProcessEnv

    expect(getPrivateAccessConfig(env)).toEqual({
      allowedUserIds: ['id-a', 'id-b'],
      allowedEmails: ['founder@example.com'],
    })
  })
})
