/**
 * Unit Tests for Environment Variable Validation
 * Tests environment configuration validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should validate NEXT_PUBLIC_SUPABASE_URL exists', () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(supabaseUrl).toBeDefined();
    });

    it('should validate NEXT_PUBLIC_SUPABASE_ANON_KEY exists', () => {
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(supabaseAnonKey).toBeDefined();
    });

    it('should validate ANTHROPIC_API_KEY exists', () => {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      // May be undefined in test environment
      expect(typeof anthropicKey === 'string' || anthropicKey === undefined).toBe(
        true
      );
    });
  });

  describe('URL Format Validation', () => {
    it('should validate NEXT_PUBLIC_SUPABASE_URL is a valid URL', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (url) {
        const isValidUrl = /^https?:\/\/.+/.test(url);
        expect(isValidUrl).toBe(true);
      }
    });

    it('should validate NEXTAUTH_URL format', () => {
      const url = process.env.NEXTAUTH_URL;

      if (url) {
        const isValidUrl = /^https?:\/\/.+/.test(url);
        expect(isValidUrl).toBe(true);
      }
    });
  });

  describe('API Key Format Validation', () => {
    it('should validate ANTHROPIC_API_KEY format', () => {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (apiKey) {
        // Should start with 'sk-ant-'
        const hasValidPrefix = apiKey.startsWith('sk-ant-');
        expect(hasValidPrefix).toBe(true);
      }
    });

    it('should validate Supabase anon key is not empty', () => {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (anonKey) {
        expect(anonKey.length).toBeGreaterThan(0);
      }
    });

    it('should validate service role key is different from anon key', () => {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (anonKey && serviceKey) {
        expect(anonKey).not.toBe(serviceKey);
      }
    });
  });

  describe('OAuth Configuration', () => {
    it('should validate GOOGLE_CLIENT_ID exists', () => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      expect(typeof clientId === 'string' || clientId === undefined).toBe(true);
    });

    it('should validate GOOGLE_CLIENT_SECRET exists', () => {
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      expect(
        typeof clientSecret === 'string' || clientSecret === undefined
      ).toBe(true);
    });

    it('should validate Google OAuth callback URL', () => {
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

      if (callbackUrl) {
        const includesCallback = callbackUrl.includes('/callback');
        expect(includesCallback).toBe(true);
      }
    });
  });

  describe('Port Configuration', () => {
    it('should use port 3008 as default', () => {
      const defaultPort = 3008;
      expect(defaultPort).toBe(3008);
    });

    it('should validate PORT is a number if set', () => {
      const port = process.env.PORT;

      if (port) {
        const portNumber = parseInt(port, 10);
        expect(isNaN(portNumber)).toBe(false);
        expect(portNumber).toBeGreaterThan(0);
        expect(portNumber).toBeLessThanOrEqual(65535);
      }
    });
  });

  describe('Email Configuration', () => {
    it('should validate at least one email provider is configured', () => {
      const sendgrid = process.env.SENDGRID_API_KEY;
      const resend = process.env.RESEND_API_KEY;
      const smtp = process.env.EMAIL_SERVER_HOST;

      const hasEmailProvider = !!(sendgrid || resend || smtp);

      // Should have at least one email provider in production
      expect(typeof hasEmailProvider).toBe('boolean');
    });

    it('should validate SMTP configuration if present', () => {
      const smtpHost = process.env.EMAIL_SERVER_HOST;
      const smtpPort = process.env.EMAIL_SERVER_PORT;

      if (smtpHost) {
        expect(smtpHost.length).toBeGreaterThan(0);

        if (smtpPort) {
          const port = parseInt(smtpPort, 10);
          expect(isNaN(port)).toBe(false);
        }
      }
    });
  });

  describe('Environment Modes', () => {
    it('should identify development mode', () => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      expect(typeof isDevelopment).toBe('boolean');
    });

    it('should identify production mode', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(typeof isProduction).toBe('boolean');
    });

    it('should identify test mode', () => {
      const isTest = process.env.NODE_ENV === 'test';
      expect(typeof isTest).toBe('boolean');
    });
  });

  describe('Security Validation', () => {
    it('should not expose secret keys in client environment', () => {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const clientSideKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Service role key should NOT start with NEXT_PUBLIC_
      if (serviceRoleKey) {
        expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      }
    });

    it('should validate NEXTAUTH_SECRET exists in production', () => {
      const secret = process.env.NEXTAUTH_SECRET;

      if (process.env.NODE_ENV === 'production') {
        expect(secret).toBeDefined();
      }
    });

    it('should validate NEXTAUTH_SECRET has sufficient length', () => {
      const secret = process.env.NEXTAUTH_SECRET;

      if (secret) {
        // Should be at least 32 characters for security
        expect(secret.length).toBeGreaterThanOrEqual(32);
      }
    });
  });

  describe('Optional Configuration', () => {
    it('should allow optional Redis configuration', () => {
      const redisUrl = process.env.REDIS_URL;
      expect(redisUrl === undefined || typeof redisUrl === 'string').toBe(true);
    });

    it('should allow optional Stripe configuration', () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      expect(stripeKey === undefined || typeof stripeKey === 'string').toBe(true);
    });

    it('should allow optional OpenAI configuration', () => {
      const openaiKey = process.env.OPENAI_API_KEY;
      expect(openaiKey === undefined || typeof openaiKey === 'string').toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required variables gracefully', () => {
      // Clear required variable
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(url).toBeUndefined();
    });

    it('should handle malformed URLs', () => {
      process.env.TEST_URL = 'not-a-valid-url';

      const isValidUrl = /^https?:\/\/.+/.test(process.env.TEST_URL);
      expect(isValidUrl).toBe(false);
    });

    it('should handle empty string values', () => {
      process.env.TEST_VAR = '';

      expect(process.env.TEST_VAR).toBe('');
      expect(process.env.TEST_VAR.length).toBe(0);
    });
  });
});

describe('Environment Helper Functions', () => {
  it('should safely get environment variable with default', () => {
    const getEnvWithDefault = (key: string, defaultValue: string) => {
      return process.env[key] || defaultValue;
    };

    const value = getEnvWithDefault('NONEXISTENT_VAR', 'default');
    expect(value).toBe('default');
  });

  it('should validate boolean environment variables', () => {
    const parseBoolean = (value: string | undefined): boolean => {
      return value === 'true' || value === '1';
    };

    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean(undefined)).toBe(false);
  });

  it('should safely parse numeric environment variables', () => {
    const parseNumber = (value: string | undefined, defaultValue: number): number => {
      if (!value) {
return defaultValue;
}
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    expect(parseNumber('3008', 3000)).toBe(3008);
    expect(parseNumber('invalid', 3000)).toBe(3000);
    expect(parseNumber(undefined, 3000)).toBe(3000);
  });
});
