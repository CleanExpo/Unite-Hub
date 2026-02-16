/**
 * Integration Tests for API Endpoints
 * Tests full request/response flow with database
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthCheck } from '@/app/api/health/route';
import { GET as metricsEndpoint } from '@/app/api/metrics/route';

describe('API Integration Tests', () => {
  describe('Health Check Endpoint', () => {
    it('should return healthy status with all checks', async () => {
      const request = new NextRequest('http://localhost:3008/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('checks');
      expect(data.checks).toHaveProperty('redis');
      expect(data.checks).toHaveProperty('database');
    });

    it('should include latency measurements', async () => {
      const request = new NextRequest('http://localhost:3008/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      if (data.checks.redis.status === 'healthy') {
        expect(data.checks.redis).toHaveProperty('latency');
        expect(typeof data.checks.redis.latency).toBe('number');
      }

      if (data.checks.database.status === 'healthy') {
        expect(data.checks.database).toHaveProperty('latency');
        expect(typeof data.checks.database.latency).toBe('number');
      }
    });

    it('should handle multiple rapid requests gracefully', async () => {
      const request = new NextRequest('http://localhost:3008/api/health');

      // Make multiple rapid requests
      const requests = Array(5).fill(null).map(() => healthCheck(request));
      const responses = await Promise.all(requests);

      // All responses should have a valid status code
      for (const r of responses) {
        expect([200, 429, 503]).toContain(r.status);
      }
    });

    it('should respond to HEAD requests', async () => {
      const { HEAD } = await import('@/app/api/health/route');
      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return Prometheus-formatted metrics', async () => {
      const request = new NextRequest('http://localhost:3008/api/metrics');
      const response = await metricsEndpoint(request);
      const metrics = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/plain');

      // Check for default Node.js metrics
      expect(metrics).toContain('process_cpu_user_seconds_total');
      expect(metrics).toContain('nodejs_heap_size_total_bytes');

      // Check for custom metrics
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('cache_hits_total');
      expect(metrics).toContain('ai_tokens_used_total');
    });

    it('should return valid Prometheus format', async () => {
      const request = new NextRequest('http://localhost:3008/api/metrics');
      const response = await metricsEndpoint(request);
      const metrics = await response.text();

      // Prometheus metrics should have HELP and TYPE comments
      const lines = metrics.split('\n');
      const helpLines = lines.filter(l => l.startsWith('# HELP'));
      const typeLines = lines.filter(l => l.startsWith('# TYPE'));

      expect(helpLines.length).toBeGreaterThan(0);
      expect(typeLines.length).toBeGreaterThan(0);
    });
  });
});
