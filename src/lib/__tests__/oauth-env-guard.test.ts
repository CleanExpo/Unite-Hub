import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { requireOAuthEnv } from '../oauth-env-guard'

const ORIGINAL_A = process.env.TEST_OAUTH_VAR_A
const ORIGINAL_B = process.env.TEST_OAUTH_VAR_B

afterEach(() => {
  if (ORIGINAL_A === undefined) delete process.env.TEST_OAUTH_VAR_A
  else process.env.TEST_OAUTH_VAR_A = ORIGINAL_A
  if (ORIGINAL_B === undefined) delete process.env.TEST_OAUTH_VAR_B
  else process.env.TEST_OAUTH_VAR_B = ORIGINAL_B
})

describe('requireOAuthEnv', () => {
  it('returns ok when all required vars are present and non-empty', () => {
    process.env.TEST_OAUTH_VAR_A = 'value-a'
    process.env.TEST_OAUTH_VAR_B = 'value-b'
    const r = requireOAuthEnv({
      check: 'test_check',
      required: ['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'],
    })
    expect(r.ok).toBe(true)
    expect(r.missing).toEqual([])
    expect(r.response).toBeNull()
  })

  it('returns 503 with missing list when a var is undefined', () => {
    delete process.env.TEST_OAUTH_VAR_A
    process.env.TEST_OAUTH_VAR_B = 'value-b'
    const r = requireOAuthEnv({
      check: 'test_check',
      required: ['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'],
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['TEST_OAUTH_VAR_A'])
    expect(r.response).not.toBeNull()
    expect(r.response!.status).toBe(503)
  })

  it('returns 503 when a var is the literal string "undefined"', () => {
    process.env.TEST_OAUTH_VAR_A = 'undefined'
    process.env.TEST_OAUTH_VAR_B = 'value-b'
    const r = requireOAuthEnv({
      check: 'test_check',
      required: ['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'],
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['TEST_OAUTH_VAR_A'])
  })

  it('returns 503 when a var is empty string', () => {
    process.env.TEST_OAUTH_VAR_A = ''
    process.env.TEST_OAUTH_VAR_B = 'value-b'
    const r = requireOAuthEnv({
      check: 'test_check',
      required: ['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'],
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['TEST_OAUTH_VAR_A'])
  })

  it('returns 503 with all missing when none are set', () => {
    delete process.env.TEST_OAUTH_VAR_A
    delete process.env.TEST_OAUTH_VAR_B
    const r = requireOAuthEnv({
      check: 'test_check',
      required: ['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'],
    })
    expect(r.ok).toBe(false)
    expect(r.missing).toEqual(['TEST_OAUTH_VAR_A', 'TEST_OAUTH_VAR_B'])
  })

  it('the 503 response body includes the check name, missing vars, and remediation', async () => {
    delete process.env.TEST_OAUTH_VAR_A
    const r = requireOAuthEnv({
      check: 'linkedin_authorize',
      required: ['TEST_OAUTH_VAR_A'],
    })
    expect(r.response).not.toBeNull()
    const body = await r.response!.json()
    expect(body.check).toBe('linkedin_authorize')
    expect(body.missing_env_vars).toEqual(['TEST_OAUTH_VAR_A'])
    expect(body.remediation).toMatch(/Vercel/i)
  })
})
