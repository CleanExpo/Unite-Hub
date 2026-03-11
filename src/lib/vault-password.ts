// src/lib/vault-password.ts
// Master password management for the Vault UI gate.
// Uses Web Crypto SHA-256 + localStorage — this is a UI access gate only.
// The actual credential encryption is handled by VAULT_ENCRYPTION_KEY in vault.ts.

const STORAGE_KEY = 'vault_pw_hash'
const DEFAULT_PW = 'nexus2026'

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Returns the stored hash, seeding from the default password on first use. */
export async function getStoredHash(): Promise<string> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored
  const defaultHash = await sha256hex(DEFAULT_PW)
  localStorage.setItem(STORAGE_KEY, defaultHash)
  return defaultHash
}

/** Returns true if the given password matches the stored hash. */
export async function verifyVaultPassword(input: string): Promise<boolean> {
  const [inputHash, storedHash] = await Promise.all([sha256hex(input), getStoredHash()])
  return inputHash === storedHash
}

/**
 * Changes the master password.
 * Returns true on success, false if currentPw is incorrect.
 */
export async function changeVaultPassword(currentPw: string, newPw: string): Promise<boolean> {
  const valid = await verifyVaultPassword(currentPw)
  if (!valid) return false
  const newHash = await sha256hex(newPw)
  localStorage.setItem(STORAGE_KEY, newHash)
  return true
}
