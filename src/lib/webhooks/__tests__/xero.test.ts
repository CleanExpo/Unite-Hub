import { createHmac } from 'crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { verifyXeroWebhookSignature } from '../xero'

describe('verifyXeroWebhookSignature', () => {
  const originalKey = process.env.XERO_WEBHOOK_KEY

  afterEach(() => {
    process.env.XERO_WEBHOOK_KEY = originalKey
  })

  it('accepts a valid Xero signature', () => {
    process.env.XERO_WEBHOOK_KEY = 'test-webhook-key'
    const rawBody = JSON.stringify({ events: [], entropy: 'abc123' })
    const signature = createHmac('sha256', 'test-webhook-key')
      .update(rawBody)
      .digest('base64')

    expect(verifyXeroWebhookSignature(rawBody, signature)).toBe(true)
  })

  it('rejects an invalid Xero signature', () => {
    process.env.XERO_WEBHOOK_KEY = 'test-webhook-key'

    expect(verifyXeroWebhookSignature('{"events":[]}', 'invalid')).toBe(false)
  })

  it('rejects when the webhook key is missing', () => {
    delete process.env.XERO_WEBHOOK_KEY
    const rawBody = JSON.stringify({ events: [] })
    const signature = createHmac('sha256', 'test-webhook-key')
      .update(rawBody)
      .digest('base64')

    expect(verifyXeroWebhookSignature(rawBody, signature)).toBe(false)
  })
})
