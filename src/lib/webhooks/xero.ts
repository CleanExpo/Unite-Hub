import { createHmac, timingSafeEqual } from 'crypto'

export function verifyXeroWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const webhookKey = process.env.XERO_WEBHOOK_KEY?.trim()
  if (!webhookKey || !signatureHeader) return false

  const expected = createHmac('sha256', webhookKey)
    .update(rawBody)
    .digest('base64')

  const receivedBuffer = Buffer.from(signatureHeader.trim())
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(receivedBuffer, expectedBuffer)
}
