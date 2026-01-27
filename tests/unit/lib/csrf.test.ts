/**
 * CSRF Validation Tests
 * Tests for Origin/Host header validation in middleware.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateCsrf } from '@/lib/csrf';
import { NextRequest } from 'next/server';

function createMockRequest(
  method: string,
  pathname: string,
  headers: Record<string, string> = {},
): NextRequest {
  const url = `http://localhost:3008${pathname}`;
  return new NextRequest(url, {
    method,
    headers: new Headers(headers),
  });
}

describe('validateCsrf', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('HTTP method filtering', () => {
    it('should allow GET requests without checking', () => {
      const req = createMockRequest('GET', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should allow HEAD requests without checking', () => {
      const req = createMockRequest('HEAD', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should allow OPTIONS requests without checking', () => {
      const req = createMockRequest('OPTIONS', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should check POST requests', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });

    it('should check PUT requests', () => {
      const req = createMockRequest('PUT', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });

    it('should check DELETE requests', () => {
      const req = createMockRequest('DELETE', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });

    it('should check PATCH requests', () => {
      const req = createMockRequest('PATCH', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });
  });

  describe('Exempt paths', () => {
    it('should exempt webhook paths', () => {
      const req = createMockRequest('POST', '/api/webhooks/stripe', {
        origin: 'http://stripe.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should exempt auth callback paths', () => {
      const req = createMockRequest('POST', '/api/auth/callback/google', {
        origin: 'http://accounts.google.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should exempt cron paths', () => {
      const req = createMockRequest('POST', '/api/cron/health-check', {
        origin: 'http://vercel.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should exempt public API paths', () => {
      const req = createMockRequest('POST', '/api/public/status', {
        origin: 'http://anywhere.com',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });
  });

  describe('Origin validation', () => {
    it('should allow when origin matches host', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://localhost:3008',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should allow when no origin header present', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should reject when origin does not match host', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://evil.com',
        host: 'localhost:3008',
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('evil.com');
    });

    it('should reject cross-origin with different ports', () => {
      process.env.NODE_ENV = 'production';
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://localhost:4000',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });

    it('should handle invalid origin gracefully', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'not-a-valid-url',
        host: 'localhost:3008',
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid origin');
    });
  });

  describe('Development localhost variants', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should allow localhost to 127.0.0.1 in development', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://localhost:3008',
        host: '127.0.0.1:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should allow 127.0.0.1 to localhost in development', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://127.0.0.1:3008',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should allow 0.0.0.0 to localhost in development', () => {
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://0.0.0.0:3008',
        host: 'localhost:3008',
      });
      expect(validateCsrf(req)).toEqual({ valid: true });
    });

    it('should not allow localhost variants in production', () => {
      process.env.NODE_ENV = 'production';
      const req = createMockRequest('POST', '/api/contacts', {
        origin: 'http://localhost:3008',
        host: '127.0.0.1:3008',
      });
      expect(validateCsrf(req).valid).toBe(false);
    });
  });
});
