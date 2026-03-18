// src/lib/webhooks/verify.ts
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verify WhatsApp Cloud API webhook signature.
 * Meta sends: x-hub-signature-256: sha256=<hex>
 * Uses WHATSAPP_APP_SECRET as key.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !process.env.WHATSAPP_APP_SECRET) return false
  const expected =
    'sha256=' +
    createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Generic API key verification — timing-safe comparison.
 * @param header  The x-api-key header value from the request
 * @param envVarName  Name of the env var that holds the expected key
 */
export function verifyApiKey(
  header: string | null,
  envVarName: string
): boolean {
  const expected = process.env[envVarName]
  if (!header || !expected) return false
  try {
    return timingSafeEqual(
      Buffer.from(header.trim()),
      Buffer.from(expected.trim())
    )
  } catch {
    return false
  }
}
