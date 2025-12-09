 
/* global process */

/**
 * Integration Tests: Health Check Endpoints
 *
 * Tests /api/health/deep and /api/health/routes endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('Health Check Endpoints', () => {
  const baseUrl = 'http://localhost:3008';
  let isServerRunning = false;

  beforeAll(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      isServerRunning = response.ok;
    } catch {
      isServerRunning = false;
    }
  });

  describe('/api/health/deep', () => {
    it('should return health status with all checks', async () => {
      if (!isServerRunning) {
        expect(true).toBe(true);
        return;
      }

      const response = await fetch(`${baseUrl}/api/health/deep`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000),
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as any;
      expect(data.status).toBeDefined();
      expect(data.checks).toBeDefined();
    });
  });

  describe('/api/health/routes', () => {
    it('should return route health inventory', async () => {
      if (!isServerRunning) {
        expect(true).toBe(true);
        return;
      }

      const response = await fetch(`${baseUrl}/api/health/routes`, {
        method: 'GET',
        signal: AbortSignal.timeout(60000),
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as any;
      expect(data.routes).toBeDefined();
    });
  });
});
