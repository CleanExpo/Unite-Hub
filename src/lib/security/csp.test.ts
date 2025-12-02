/**
 * CSP Utilities Test Suite
 *
 * Unit tests for CSP nonce generation and header building
 */

import { describe, test, expect } from '@jest/globals';
import {
  generateNonce,
  buildCSPHeader,
  isValidNonce,
  getEnvironmentCSP,
} from './csp';

describe('generateNonce', () => {
  test('generates nonce with default length', () => {
    const nonce = generateNonce();
    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(20); // 16 bytes = 24 chars in base64
  });

  test('generates nonce with custom length', () => {
    const nonce = generateNonce(32);
    expect(nonce).toBeDefined();
    expect(nonce.length).toBeGreaterThan(40); // 32 bytes = 44 chars in base64
  });

  test('generates unique nonces', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
  });

  test('generates cryptographically random nonces', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      nonces.add(generateNonce());
    }
    // All 1000 should be unique
    expect(nonces.size).toBe(1000);
  });
});

describe('isValidNonce', () => {
  test('validates correct nonce format', () => {
    const nonce = generateNonce();
    expect(isValidNonce(nonce)).toBe(true);
  });

  test('rejects non-base64 characters', () => {
    expect(isValidNonce('invalid@nonce!')).toBe(false);
  });

  test('rejects too short nonces', () => {
    expect(isValidNonce('abc')).toBe(false);
    expect(isValidNonce('abcdefghij')).toBe(false);
  });

  test('accepts valid base64 with padding', () => {
    expect(isValidNonce('abcdefghijklmnopqrstuvwx==')).toBe(true);
  });
});

describe('buildCSPHeader', () => {
  test('includes nonce in script-src', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain('script-src');
  });

  test('includes nonce in style-src', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain('style-src');
  });

  test('does not include unsafe-inline', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).not.toContain("'unsafe-inline'");
  });

  test('includes unsafe-eval by default', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain("'unsafe-eval'");
  });

  test('excludes unsafe-eval when disabled', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce, { allowUnsafeEval: false });
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('includes custom script-src domains', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce, {
      scriptSrcDomains: ['https://example.com'],
    });
    expect(csp).toContain('https://example.com');
  });

  test('includes Supabase in connect-src', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain('https://*.supabase.co');
  });

  test('includes Anthropic in connect-src', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain('https://api.anthropic.com');
  });

  test('sets object-src to none', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain("object-src 'none'");
  });

  test('sets frame-ancestors to none', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('includes report-uri when configured', () => {
    const nonce = 'testNonce123';
    const csp = buildCSPHeader(nonce, {
      reportUri: '/api/csp-report',
    });
    expect(csp).toContain('report-uri /api/csp-report');
  });
});

describe('getEnvironmentCSP', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('development CSP includes localhost', () => {
    process.env.NODE_ENV = 'development';
    const nonce = 'testNonce123';
    const csp = getEnvironmentCSP(nonce);
    expect(csp).toContain('ws://localhost:*');
    expect(csp).toContain('http://localhost:*');
  });

  test('production CSP includes report-uri', () => {
    process.env.NODE_ENV = 'production';
    const nonce = 'testNonce123';
    const csp = getEnvironmentCSP(nonce);
    expect(csp).toContain('report-uri /api/csp-report');
  });

  test('production CSP does not include localhost', () => {
    process.env.NODE_ENV = 'production';
    const nonce = 'testNonce123';
    const csp = getEnvironmentCSP(nonce);
    expect(csp).not.toContain('ws://localhost');
  });
});

describe('CSP Integration', () => {
  test('full CSP workflow', () => {
    // Step 1: Generate nonce
    const nonce = generateNonce();
    expect(isValidNonce(nonce)).toBe(true);

    // Step 2: Build CSP header
    const csp = buildCSPHeader(nonce);

    // Step 3: Verify CSP contains nonce
    expect(csp).toContain(`'nonce-${nonce}'`);

    // Step 4: Verify CSP security properties
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('nonce uniqueness across requests', () => {
    const nonces = new Set<string>();

    // Simulate 100 requests
    for (let i = 0; i < 100; i++) {
      const nonce = generateNonce();
      const csp = buildCSPHeader(nonce);

      // Each nonce should be unique
      expect(nonces.has(nonce)).toBe(false);
      nonces.add(nonce);

      // Each CSP should include the unique nonce
      expect(csp).toContain(`'nonce-${nonce}'`);
    }

    expect(nonces.size).toBe(100);
  });
});
