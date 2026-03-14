// src/lib/webhooks/verify.ts
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Generic API key verifier — prevents timing-based side-channel attacks.
 * Use for any integration that authenticates via a static API key header.
 */
export function verifyApiKey(header: string | null, envVarName: string): boolean {
  const expected = process.env[envVarName]
  if (!header || !expected) return false
  try {
    return timingSafeEqual(Buffer.from(header.trim()), Buffer.from(expected.trim()))
  } catch {
    return false
  }
}

/**
 * Verify WhatsApp Cloud API webhook signature.
 * Meta sends: x-hub-signature-256: sha256=<hex>
 * Uses WHATSAPP_APP_SECRET as HMAC key.
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
    return timingSafeEqual(Buffer.from(signatureHeader.trim()), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Verify Paperclip inbound webhook via API key header.
 * Paperclip sends: x-api-key: <PAPERCLIP_API_KEY>
 */
export function verifyPaperclipApiKey(apiKeyHeader: string | null): boolean {
  return verifyApiKey(apiKeyHeader, 'PAPERCLIP_API_KEY')
}
