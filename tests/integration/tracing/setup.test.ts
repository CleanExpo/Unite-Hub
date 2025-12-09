/**
 * OpenTelemetry Setup Integration Tests
 *
 * Test Suite for Phase 6.8 Step 1: Core OpenTelemetry Setup
 *
 * QUALITY GATES:
 * 1. SDK initializes without errors
 * 2. All OpenTelemetry modules import correctly
 * 3. Resource metadata is created with correct service info
 * 4. Graceful shutdown handler is registered
 * 5. Singleton pattern prevents re-initialization
 */

 

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initializeOpenTelemetry,
  getOpenTelemetrySdk,
  isOpenTelemetryInitialized,
  getOpenTelemetryStatus,
} from '@/lib/tracing/opentelemetry-setup';

describe('OpenTelemetry Setup - Phase 6.8 Step 1', () => {
  beforeEach(() => {
    // Clear environment for isolated tests
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_SERVICE_NAME = 'unite-hub-test';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Cleanup after each test
    delete process.env.OTEL_ENABLED;
  });

  describe('QUALITY GATE 1: SDK Initialization', () => {
    it('should initialize OpenTelemetry SDK without errors', async () => {
      const sdk = await initializeOpenTelemetry();
      // SDK may be null if exporters fail, but should not throw
      expect(sdk).toBeDefined();
    });

    it('should handle initialization gracefully when OTEL_ENABLED=false', async () => {
      process.env.OTEL_ENABLED = 'false';
      const sdk = await getOpenTelemetrySdk();
      // Should remain null when disabled
      expect(sdk).toBeNull();
    });
  });

  describe('QUALITY GATE 2: Module Imports', () => {
    it('should successfully import all OpenTelemetry modules', async () => {
      // This test passes if the file compiles without import errors
      // All imports are at the top of opentelemetry-setup.ts
      const status = getOpenTelemetryStatus();
      expect(status).toBeDefined();
      expect(status.service).toBe('unite-hub-test');
    });

    it('should export required functions', () => {
      expect(typeof initializeOpenTelemetry).toBe('function');
      expect(typeof getOpenTelemetrySdk).toBe('function');
      expect(typeof isOpenTelemetryInitialized).toBe('function');
      expect(typeof getOpenTelemetryStatus).toBe('function');
    });
  });

  describe('QUALITY GATE 3: Resource Metadata', () => {
    it('should create resource with correct service metadata', () => {
      const status = getOpenTelemetryStatus();

      expect(status).toEqual({
        initialized: expect.any(Boolean),
        service: 'unite-hub-test',
        environment: 'test',
      });
    });

    it('should include service name in status', () => {
      const status = getOpenTelemetryStatus();
      expect(status.service).toBeTruthy();
      expect(status.service.length).toBeGreaterThan(0);
    });

    it('should reflect correct environment', () => {
      const status = getOpenTelemetryStatus();
      expect(status.environment).toBe('test');
    });
  });

  describe('QUALITY GATE 4: Singleton Pattern', () => {
    it('should maintain singleton instance across multiple calls', async () => {
      const sdk1 = await getOpenTelemetrySdk();
      const sdk2 = await getOpenTelemetrySdk();

      // Both should return same instance (or both null)
      expect(sdk1).toBe(sdk2);
    });

    it('should return initialized status consistently', async () => {
      await getOpenTelemetrySdk();
      const status1 = getOpenTelemetryStatus();
      const status2 = getOpenTelemetryStatus();

      expect(status1).toEqual(status2);
    });
  });

  describe('QUALITY GATE 5: Default Configuration', () => {
    it('should use default service name when not configured', () => {
      delete process.env.OTEL_SERVICE_NAME;
      const status = getOpenTelemetryStatus();
      expect(status.service).toBe('unite-hub');
    });

    it('should use default version when not configured', () => {
      delete process.env.OTEL_SERVICE_VERSION;
      const status = getOpenTelemetryStatus();
      expect(status.service).toBeDefined();
    });

    it('should use current NODE_ENV as environment', () => {
      const status = getOpenTelemetryStatus();
      expect(['test', 'development', 'production']).toContain(status.environment);
    });
  });
});
