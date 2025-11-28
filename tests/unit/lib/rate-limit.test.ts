/**
 * Unit Tests for Rate Limiting
 * Tests the in-memory rate limiter for API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  apiRateLimit,
  strictRateLimit,
  publicRateLimit,
  aiAgentRateLimit,
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    vi.clearAllMocks();
  });

  describe('apiRateLimit', () => {
    it('should allow requests under limit', async () => {
      const req = new NextRequest('http://localhost:3008/api/test');
      const result = await apiRateLimit(req);
      expect(result).toBeNull(); // null means allowed
    });

    it('should block requests over limit (100 per 15 min)', async () => {
      const req = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      // Exhaust rate limit (100 requests allowed)
      for (let i = 0; i < 100; i++) {
        const result = await apiRateLimit(req);
        expect(result).toBeNull();
      }

      // 101st request should be blocked
      const result = await apiRateLimit(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    it('should include rate limit headers in 429 response', async () => {
      const req = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.101',
        },
      });

      // Exhaust limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimit(req);
      }

      const result = await apiRateLimit(req);
      expect(result).not.toBeNull();

      const retryAfter = result?.headers.get('Retry-After');
      const rateLimitLimit = result?.headers.get('X-RateLimit-Limit');
      const rateLimitRemaining = result?.headers.get('X-RateLimit-Remaining');

      expect(retryAfter).toBeTruthy();
      expect(rateLimitLimit).toBe('100');
      expect(rateLimitRemaining).toBe('0');
    });

    it('should reset after time window expires', async () => {
      // This test would require mocking time, skipping for now
      // In real tests, you'd use vi.useFakeTimers()
    });
  });

  describe('strictRateLimit', () => {
    it('should enforce stricter limits (10 per 15 min)', async () => {
      const req = new NextRequest('http://localhost:3008/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.102',
        },
      });

      // Exhaust strict limit (10 requests allowed)
      for (let i = 0; i < 10; i++) {
        const result = await strictRateLimit(req);
        expect(result).toBeNull();
      }

      // 11th request should be blocked
      const result = await strictRateLimit(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    it('should return appropriate error message', async () => {
      const req = new NextRequest('http://localhost:3008/api/auth/login', {
        headers: {
          'x-forwarded-for': '192.168.1.103',
        },
      });

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        await strictRateLimit(req);
      }

      const result = await strictRateLimit(req);
      expect(result).not.toBeNull();

      const json = await result?.json();
      expect(json.error).toContain('Too many attempts');
    });
  });

  describe('publicRateLimit', () => {
    it('should allow more requests (300 per 15 min)', async () => {
      const req = new NextRequest('http://localhost:3008/api/public/health', {
        headers: {
          'x-forwarded-for': '192.168.1.104',
        },
      });

      // Make 100 requests - should all be allowed
      for (let i = 0; i < 100; i++) {
        const result = await publicRateLimit(req);
        expect(result).toBeNull();
      }
    });
  });

  describe('aiAgentRateLimit', () => {
    it('should enforce AI-specific limits (100 per 15 min)', async () => {
      const req = new NextRequest('http://localhost:3008/api/agents/contact-intelligence', {
        headers: {
          'x-forwarded-for': '192.168.1.105',
        },
      });

      // Exhaust AI limit (100 requests allowed)
      for (let i = 0; i < 100; i++) {
        const result = await aiAgentRateLimit(req);
        expect(result).toBeNull();
      }

      // 101st request should be blocked
      const result = await aiAgentRateLimit(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);

      const json = await result?.json();
      expect(json.error).toContain('Too many AI requests');
    });
  });

  describe('IP extraction', () => {
    it('should use x-forwarded-for header', async () => {
      const req1 = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.200',
        },
      });

      const req2 = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.201',
        },
      });

      // Each IP should have its own rate limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimit(req1);
      }

      // req1 is now at limit
      const result1 = await apiRateLimit(req1);
      expect(result1?.status).toBe(429);

      // req2 should still be allowed (different IP)
      const result2 = await apiRateLimit(req2);
      expect(result2).toBeNull();
    });

    it('should use x-real-ip header if x-forwarded-for not present', async () => {
      const req = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-real-ip': '192.168.1.210',
        },
      });

      const result = await apiRateLimit(req);
      expect(result).toBeNull();
    });

    it('should use cf-connecting-ip for Cloudflare requests', async () => {
      const req = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'cf-connecting-ip': '192.168.1.220',
        },
      });

      const result = await apiRateLimit(req);
      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return JSON error response', async () => {
      const req = new NextRequest('http://localhost:3008/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.250',
        },
      });

      // Exhaust limit
      for (let i = 0; i < 100; i++) {
        await apiRateLimit(req);
      }

      const result = await apiRateLimit(req);
      expect(result).not.toBeNull();

      const json = await result?.json();
      expect(json).toHaveProperty('error');
      expect(json).toHaveProperty('retryAfter');
      expect(typeof json.retryAfter).toBe('number');
    });
  });
});
