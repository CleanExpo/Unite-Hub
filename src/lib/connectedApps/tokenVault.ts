/**
 * Token Vault
 *
 * Secure storage for OAuth tokens with AES-256-GCM encryption.
 * Handles encryption/decryption of access and refresh tokens.
 */

import crypto from 'crypto';
import { connectedAppsConfig } from '@config/connectedApps.config';
import {
  ConnectedAppsError,
  ErrorCodes,
  type OAuthTokens,
  type EncryptedTokens,
} from './providerTypes';

// ============================================================================
// Constants
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// ============================================================================
// Token Vault Class
// ============================================================================

class TokenVault {
  private encryptionKey: Buffer | null = null;

  constructor() {
    this.initializeKey();
  }

  /**
   * Initialize encryption key from config
   */
  private initializeKey(): void {
    const keyString = connectedAppsConfig.tokenVault.encryptionKey;

    if (!keyString) {
      console.warn(
        '[TokenVault] Encryption key not configured. Token encryption disabled.'
      );
      return;
    }

    // Hash the key to ensure consistent 32-byte length
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(keyString)
      .digest();
  }

  /**
   * Check if encryption is available
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Encrypt tokens for storage
   */
  encryptTokens(tokens: OAuthTokens): EncryptedTokens {
    if (!this.encryptionKey) {
      throw new ConnectedAppsError(
        'Encryption key not configured',
        ErrorCodes.ENCRYPTION_KEY_MISSING
      );
    }

    const iv = crypto.randomBytes(IV_LENGTH);

    // Encrypt access token
    const accessCipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encryptedAccess = Buffer.concat([
      accessCipher.update(tokens.accessToken, 'utf8'),
      accessCipher.final(),
      accessCipher.getAuthTag(),
    ]);

    // Encrypt refresh token if present (some providers don't issue refresh tokens)
    let encryptedRefresh: Buffer | undefined;
    if (tokens.refreshToken) {
      const refreshCipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
      encryptedRefresh = Buffer.concat([
        refreshCipher.update(tokens.refreshToken, 'utf8'),
        refreshCipher.final(),
        refreshCipher.getAuthTag(),
      ]);
    }

    return {
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      iv,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
    };
  }

  /**
   * Decrypt tokens from storage
   */
  decryptTokens(encrypted: EncryptedTokens): OAuthTokens {
    if (!this.encryptionKey) {
      throw new ConnectedAppsError(
        'Encryption key not configured',
        ErrorCodes.ENCRYPTION_KEY_MISSING
      );
    }

    try {
      // Decrypt access token
      const accessToken = this.decryptBuffer(
        encrypted.encryptedAccessToken,
        encrypted.iv
      );

      // Decrypt refresh token if present
      const refreshToken = encrypted.encryptedRefreshToken
        ? this.decryptBuffer(encrypted.encryptedRefreshToken, encrypted.iv)
        : undefined;

      return {
        accessToken,
        refreshToken,
        expiresAt: encrypted.expiresAt,
        scope: encrypted.scope,
        tokenType: 'Bearer',
      };
    } catch (error) {
      throw new ConnectedAppsError(
        'Failed to decrypt tokens',
        ErrorCodes.TOKEN_DECRYPTION_FAILED,
        undefined,
        { error: String(error) }
      );
    }
  }

  /**
   * Decrypt a single buffer
   */
  private decryptBuffer(encryptedBuffer: Buffer, iv: Buffer): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    // Extract auth tag from end of buffer
    const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
    const ciphertext = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Encrypt a single token string (for storing plain tokens)
   */
  encryptString(plaintext: string): { encrypted: Buffer; iv: Buffer } {
    if (!this.encryptionKey) {
      throw new ConnectedAppsError(
        'Encryption key not configured',
        ErrorCodes.ENCRYPTION_KEY_MISSING
      );
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    return { encrypted, iv };
  }

  /**
   * Decrypt a single encrypted string
   */
  decryptString(encrypted: Buffer, iv: Buffer): string {
    return this.decryptBuffer(encrypted, iv);
  }

  /**
   * Check if a token is expired or about to expire
   */
  isTokenExpired(expiresAt: Date, bufferMs?: number): boolean {
    const buffer = bufferMs ?? connectedAppsConfig.tokenRefreshBufferMs;
    const now = Date.now();
    const expirationTime = new Date(expiresAt).getTime();
    return now >= expirationTime - buffer;
  }

  /**
   * Generate a secure state parameter for OAuth
   */
  generateStateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code verifier
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Hash a string (for nonce storage)
   */
  hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let vaultInstance: TokenVault | null = null;

export function getTokenVault(): TokenVault {
  if (!vaultInstance) {
    vaultInstance = new TokenVault();
  }
  return vaultInstance;
}

// Backward-compatible singleton export for consumers expecting direct import
export const tokenVault = new Proxy({} as TokenVault, {
  get(_target, prop) {
    const instance = getTokenVault();
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default TokenVault;
