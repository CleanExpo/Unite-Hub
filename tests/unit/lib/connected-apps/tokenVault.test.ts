/**
 * Token Vault Tests
 *
 * Tests for AES-256-GCM encryption/decryption and PKCE generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import TokenVault, { tokenVault } from '@/lib/connectedApps/tokenVault';
import type {
  EncryptedTokens,
  OAuthTokens,
} from '@/lib/connectedApps/providerTypes';

// Mock crypto for consistent test results
vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto');
  return {
    ...actual,
    randomBytes: vi.fn().mockImplementation((size: number) => {
      // Return predictable bytes for testing
      const buffer = Buffer.alloc(size);
      for (let i = 0; i < size; i++) {
        buffer[i] = i % 256;
      }
      return buffer;
    }),
  };
});

describe('TokenVault', () => {
  let vault: TokenVault;

  beforeEach(() => {
    vault = new TokenVault();
  });

  describe('encryptTokens', () => {
    it('should encrypt tokens and return encrypted data', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'openid email',
      };

      const encrypted = vault.encryptTokens(tokens);

      expect(encrypted).toBeDefined();
      expect(encrypted.encryptedAccessToken).toBeDefined();
      expect(encrypted.encryptedRefreshToken).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.expiresAt).toBe(tokens.expiresAt);
      expect(encrypted.tokenType).toBe(tokens.tokenType);
      expect(encrypted.scope).toBe(tokens.scope);
    });

    it('should produce different ciphertext for same plaintext (due to IV)', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000,
      };

      // Reset mock to return different random bytes
      const crypto = require('crypto');
      let callCount = 0;
      crypto.randomBytes.mockImplementation((size: number) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i + callCount * 16) % 256;
        }
        callCount++;
        return buffer;
      });

      const encrypted1 = vault.encryptTokens(tokens);
      const encrypted2 = vault.encryptTokens(tokens);

      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should handle tokens without optional fields', () => {
      const tokens: OAuthTokens = {
        accessToken: 'minimal-token',
        expiresAt: Date.now(),
      };

      const encrypted = vault.encryptTokens(tokens);

      expect(encrypted.encryptedAccessToken).toBeDefined();
      expect(encrypted.encryptedRefreshToken).toBeUndefined();
      expect(encrypted.scope).toBeUndefined();
    });
  });

  describe('decryptTokens', () => {
    it('should decrypt tokens and return original data', () => {
      const originalTokens: OAuthTokens = {
        accessToken: 'my-secret-access-token-12345',
        refreshToken: 'my-secret-refresh-token-67890',
        expiresAt: 1700000000000,
        tokenType: 'Bearer',
        scope: 'gmail.readonly gmail.send',
      };

      const encrypted = vault.encryptTokens(originalTokens);
      const decrypted = vault.decryptTokens(encrypted);

      expect(decrypted.accessToken).toBe(originalTokens.accessToken);
      expect(decrypted.refreshToken).toBe(originalTokens.refreshToken);
      expect(decrypted.expiresAt).toBe(originalTokens.expiresAt);
      expect(decrypted.tokenType).toBe(originalTokens.tokenType);
      expect(decrypted.scope).toBe(originalTokens.scope);
    });

    it('should handle tokens without refresh token', () => {
      const originalTokens: OAuthTokens = {
        accessToken: 'access-only-token',
        expiresAt: Date.now(),
      };

      const encrypted = vault.encryptTokens(originalTokens);
      const decrypted = vault.decryptTokens(encrypted);

      expect(decrypted.accessToken).toBe(originalTokens.accessToken);
      expect(decrypted.refreshToken).toBeUndefined();
    });

    it('should throw error for tampered ciphertext', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now(),
      };

      const encrypted = vault.encryptTokens(tokens);

      // Tamper with the ciphertext
      const tamperedBuffer = Buffer.from(encrypted.encryptedAccessToken, 'base64');
      tamperedBuffer[0] = tamperedBuffer[0] ^ 0xff;
      encrypted.encryptedAccessToken = tamperedBuffer.toString('base64');

      expect(() => vault.decryptTokens(encrypted)).toThrow();
    });

    it('should throw error for wrong auth tag', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-token',
        expiresAt: Date.now(),
      };

      const encrypted = vault.encryptTokens(tokens);

      // Replace auth tag with wrong value
      encrypted.authTag = Buffer.alloc(16).toString('base64');

      expect(() => vault.decryptTokens(encrypted)).toThrow();
    });
  });

  describe('generateCodeVerifier', () => {
    it('should generate a valid code verifier', () => {
      const verifier = vault.generateCodeVerifier();

      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      // PKCE verifiers should be 43-128 characters
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate URL-safe characters', () => {
      const verifier = vault.generateCodeVerifier();

      // Should only contain URL-safe base64 characters
      const urlSafePattern = /^[A-Za-z0-9_-]+$/;
      expect(urlSafePattern.test(verifier)).toBe(true);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate a valid code challenge from verifier', () => {
      const verifier = vault.generateCodeVerifier();
      const challenge = vault.generateCodeChallenge(verifier);

      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      // SHA256 base64url encoded is 43 characters
      expect(challenge.length).toBe(43);
    });

    it('should generate consistent challenge for same verifier', () => {
      const verifier = 'test-verifier-string-12345';

      const challenge1 = vault.generateCodeChallenge(verifier);
      const challenge2 = vault.generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should generate different challenges for different verifiers', () => {
      const verifier1 = 'verifier-one';
      const verifier2 = 'verifier-two';

      const challenge1 = vault.generateCodeChallenge(verifier1);
      const challenge2 = vault.generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it('should not contain URL-unsafe characters', () => {
      const verifier = vault.generateCodeVerifier();
      const challenge = vault.generateCodeChallenge(verifier);

      // Should not contain + or / or =
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired tokens', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test',
        expiresAt: Date.now() - 1000, // 1 second ago
      };

      expect(vault.isTokenExpired(tokens)).toBe(true);
    });

    it('should return true for tokens expiring within buffer', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test',
        expiresAt: Date.now() + 30000, // 30 seconds from now
      };

      // Default buffer is 5 minutes
      expect(vault.isTokenExpired(tokens)).toBe(true);
    });

    it('should return false for valid tokens', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      expect(vault.isTokenExpired(tokens)).toBe(false);
    });

    it('should respect custom buffer time', () => {
      const tokens: OAuthTokens = {
        accessToken: 'test',
        expiresAt: Date.now() + 60000, // 1 minute from now
      };

      // With 30 second buffer, should not be expired
      expect(vault.isTokenExpired(tokens, 30000)).toBe(false);

      // With 2 minute buffer, should be expired
      expect(vault.isTokenExpired(tokens, 120000)).toBe(true);
    });
  });
});

describe('tokenVault singleton', () => {
  it('should export a singleton instance', () => {
    expect(tokenVault).toBeDefined();
    expect(tokenVault).toBeInstanceOf(TokenVault);
  });

  it('should have all required methods', () => {
    expect(typeof tokenVault.encryptTokens).toBe('function');
    expect(typeof tokenVault.decryptTokens).toBe('function');
    expect(typeof tokenVault.generateCodeVerifier).toBe('function');
    expect(typeof tokenVault.generateCodeChallenge).toBe('function');
    expect(typeof tokenVault.isTokenExpired).toBe('function');
  });
});
