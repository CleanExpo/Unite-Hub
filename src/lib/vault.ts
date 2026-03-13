// src/lib/vault.ts
// AES-256-GCM encryption for credentials_vault table
// Key derivation: PBKDF2(VAULT_ENCRYPTION_KEY, per-row salt) → 256-bit key

import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto'

// Lazy-evaluated: checked at operation time, not at module load.
// This allows the build to succeed in CI without vault secrets while
// still guaranteeing no vault operation proceeds without the key.
function getVaultKey(): string {
  const key = process.env.VAULT_ENCRYPTION_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'VAULT_ENCRYPTION_KEY is required in production. ' +
        'Generate one with: openssl rand -hex 32'
      )
    }
    throw new Error(
      'VAULT_ENCRYPTION_KEY not set — add it to .env.local ' +
      '(generate with: openssl rand -hex 32)'
    )
  }
  return key.trim()
}

function deriveKey(salt: Buffer): Buffer {
  return pbkdf2Sync(getVaultKey(), salt, 100_000, 32, 'sha256')
}

export interface VaultPayload {
  encryptedValue: string // base64: 16-byte GCM auth tag || ciphertext
  iv: string             // base64: 12-byte GCM nonce
  salt: string           // base64: 16-byte PBKDF2 salt
}

export function encrypt(plaintext: string): VaultPayload {
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = deriveKey(salt)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encryptedValue: Buffer.concat([tag, encrypted]).toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
  }
}

export function decrypt(payload: VaultPayload): string {
  const saltBuf = Buffer.from(payload.salt, 'base64')
  const ivBuf = Buffer.from(payload.iv, 'base64')
  const combined = Buffer.from(payload.encryptedValue, 'base64')
  const key = deriveKey(saltBuf)

  const tag = combined.subarray(0, 16)
  const ciphertext = combined.subarray(16)

  const decipher = createDecipheriv('aes-256-gcm', key, ivBuf)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
