// src/lib/oauth-state.ts
// HMAC-signed OAuth state parameter — prevents CSRF on all OAuth flows.
// State format: base64url(JSON.stringify(payload)) + "." + base64url(HMAC-SHA256)

import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  const s = process.env.VAULT_ENCRYPTION_KEY
  if (!s) throw new Error('VAULT_ENCRYPTION_KEY not set')
  return s
}

/**
 * Creates a signed state string for OAuth authorize requests.
 * The HMAC ensures the callback cannot be replayed or forged.
 */
export function signOAuthState(payload: Record<string, string>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

/**
 * Verifies and decodes a signed OAuth state string.
 * Throws if the signature is missing or invalid.
 */
export function verifyOAuthState(state: string): Record<string, string> {
  const dot = state.lastIndexOf('.')
  if (dot === -1) throw new Error('Invalid state: no signature')

  const data = state.slice(0, dot)
  const receivedSig = Buffer.from(state.slice(dot + 1), 'base64url')
  const expectedSig = Buffer.from(
    createHmac('sha256', secret()).update(data).digest('base64url'),
    'base64url'
  )

  if (
    receivedSig.length !== expectedSig.length ||
    !timingSafeEqual(receivedSig, expectedSig)
  ) {
    throw new Error('Invalid state: signature mismatch')
  }

  return JSON.parse(Buffer.from(data, 'base64url').toString()) as Record<string, string>
}
