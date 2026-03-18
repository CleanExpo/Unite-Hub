// src/lib/vault-password.ts
// Master password management for the Vault UI gate.
// Uses Web Crypto SHA-256 + localStorage — this is a UI access gate only.
// The actual credential encryption is handled by VAULT_ENCRYPTION_KEY in vault.ts.

const STORAGE_KEY = 'vault_pw_hash'

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Returns true if the vault password has been explicitly set by the user. */
export function isVaultPasswordSet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

/** Returns the stored hash, or null if no password has been set yet. */
export async function getStoredHash(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEY)
}

/** Returns true if the given password matches the stored hash. Always false if no password set. */
export async function verifyVaultPassword(input: string): Promise<boolean> {
  const storedHash = await getStoredHash()
  if (!storedHash) return false
  const inputHash = await sha256hex(input)
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

/**
 * Sets or resets the master password without requiring the current password.
 * Safe to call — vault_pw_hash is a UI gate only, not an encryption key.
 * Actual credential decryption uses the server-side VAULT_ENCRYPTION_KEY.
 */
export async function resetVaultPassword(newPw: string): Promise<void> {
  const newHash = await sha256hex(newPw)
  localStorage.setItem(STORAGE_KEY, newHash)
}
