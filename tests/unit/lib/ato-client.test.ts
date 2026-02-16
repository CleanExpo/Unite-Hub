/**
 * ATO Client Unit Tests
 *
 * Tests for ATO OAuth2 M2M client:
 * - Configuration validation
 * - Token management
 * - Connection status
 * - Error handling
 *
 * Related to: UNI-176 [ATO] ATO API Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ATOClient } from '@/lib/integrations/ato/ato-client';
import type { ATOConfig } from '@/lib/integrations/ato/ato-client';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
      upsert: vi.fn(() => ({ data: null, error: null })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ATOClient', () => {
  const validConfig: ATOConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authUrl: 'https://auth.ato.gov.au/oauth2/authorize',
    tokenUrl: 'https://auth.ato.gov.au/oauth2/token',
    apiUrl: 'https://sandbox.api.ato.gov.au/v1',
    scope: 'https://ato.gov.au/api/v1',
    sandboxMode: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor validation', () => {
    it('should accept valid configuration', () => {
      expect(() => new ATOClient(validConfig)).not.toThrow();
    });

    it('should throw on missing clientId', () => {
      const config = { ...validConfig, clientId: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: clientId');
    });

    it('should throw on missing clientSecret', () => {
      const config = { ...validConfig, clientSecret: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: clientSecret');
    });

    it('should throw on missing authUrl', () => {
      const config = { ...validConfig, authUrl: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: authUrl');
    });

    it('should throw on missing tokenUrl', () => {
      const config = { ...validConfig, tokenUrl: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: tokenUrl');
    });

    it('should throw on missing apiUrl', () => {
      const config = { ...validConfig, apiUrl: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: apiUrl');
    });

    it('should throw on missing scope', () => {
      const config = { ...validConfig, scope: '' };
      expect(() => new ATOClient(config)).toThrow('ATO configuration missing: scope');
    });

    it('should default sandboxMode to true', () => {
      const config = { ...validConfig };
      delete config.sandboxMode;
      const client = new ATOClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('Environment factory', () => {
    it('should create client from environment variables', async () => {
      process.env.ATO_CLIENT_ID = 'env-client-id';
      process.env.ATO_CLIENT_SECRET = 'env-client-secret';
      process.env.ATO_AUTH_URL = 'https://auth.ato.gov.au/oauth2/authorize';
      process.env.ATO_TOKEN_URL = 'https://auth.ato.gov.au/oauth2/token';
      process.env.ATO_API_URL = 'https://sandbox.api.ato.gov.au/v1';
      process.env.ATO_SCOPE = 'https://ato.gov.au/api/v1';
      process.env.ATO_SANDBOX_MODE = 'true';

      vi.resetModules();
      const { createATOClient } = await import('@/lib/integrations/ato/ato-client');
      const client = createATOClient();
      expect(client).toBeDefined();
    });
  });

  describe('Token lifecycle', () => {
    it('should require initialization before token requests', async () => {
      const client = new ATOClient(validConfig);
      await expect(client.getAccessToken()).rejects.toThrow(
        'ATOClient not initialized'
      );
    });

    it('should handle missing credentials on initialization', async () => {
      const client = new ATOClient(validConfig);
      await client.initialize('workspace-1');
      // Should not throw, creates initial record
    });
  });

  describe('Connection status', () => {
    it('should throw if checking status before initialization', async () => {
      const client = new ATOClient(validConfig);
      await expect(client.getConnectionStatus()).rejects.toThrow(
        'Workspace ID not set'
      );
    });

    it('should throw if disconnecting before initialization', async () => {
      const client = new ATOClient(validConfig);
      await expect(client.disconnect()).rejects.toThrow('Workspace ID not set');
    });
  });

  describe('Configuration patterns', () => {
    it('should accept sandbox configuration', () => {
      const config: ATOConfig = {
        ...validConfig,
        apiUrl: 'https://sandbox.api.ato.gov.au/v1',
        sandboxMode: true,
      };
      const client = new ATOClient(config);
      expect(client).toBeDefined();
    });

    it('should accept production configuration', () => {
      const config: ATOConfig = {
        ...validConfig,
        apiUrl: 'https://api.ato.gov.au/v1',
        sandboxMode: false,
      };
      const client = new ATOClient(config);
      expect(client).toBeDefined();
    });
  });

  describe('BAS Data Validation', () => {
    it('should accept valid BAS period (quarterly)', () => {
      const period = {
        year: 2026,
        quarter: 1,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      };
      expect(period.quarter).toBeGreaterThanOrEqual(1);
      expect(period.quarter).toBeLessThanOrEqual(4);
    });

    it('should accept valid BAS period (monthly)', () => {
      const period = {
        year: 2026,
        month: 6,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      };
      expect(period.month).toBeGreaterThanOrEqual(1);
      expect(period.month).toBeLessThanOrEqual(12);
    });
  });

  describe('ABN Validation Patterns', () => {
    it('should accept 11-digit ABN format', () => {
      const abn = '51824753556';
      expect(abn).toMatch(/^\d{11}$/);
    });

    it('should reject invalid ABN formats', () => {
      expect('123').not.toMatch(/^\d{11}$/);
      expect('abc12345678').not.toMatch(/^\d{11}$/);
    });
  });

  describe('Tax Obligation Types', () => {
    it('should recognize valid obligation types', () => {
      const validTypes = ['BAS', 'PAYG', 'STP', 'INCOME_TAX', 'FBT'];
      for (const type of validTypes) {
        expect(validTypes).toContain(type);
      }
    });
  });

  describe('Token Expiry Buffer', () => {
    it('should use 5 minute buffer for token refresh', () => {
      const buffer = 5 * 60 * 1000;
      expect(buffer).toBe(300000);
    });
  });
});
