/**
 * APM Integration Tests
 *
 * Tests for Application Performance Monitoring components:
 * - Datadog integration
 * - Sentry integration
 * - Metrics exporter
 * - APM middleware
 * - Configuration management
 */

/* eslint-disable no-undef, no-console, @typescript-eslint/no-unused-vars */


import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { datadogIntegration } from '@/lib/apm/datadog-integration';
import { sentryIntegration } from '@/lib/apm/sentry-integration';
import { metricsExporter } from '@/lib/apm/metrics-exporter';
import { getAPMConfig, validateAPMConfig } from '@/config/apm-config';

describe('APM Integration', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should load APM configuration', () => {
      getAPMConfig();

      expect(config).toBeDefined();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('serviceName');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('datadog');
      expect(config).toHaveProperty('sentry');
      expect(config).toHaveProperty('sampling');
      expect(config).toHaveProperty('tags');
      expect(config).toHaveProperty('features');
    });

    it('should validate APM configuration', () => {
      getAPMConfig();
      const validation = validateAPMConfig(config);

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(Array.isArray(validation.errors)).toBe(true);
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should have correct environment detection', () => {
      getAPMConfig();

      expect(['development', 'staging', 'production', 'test']).toContain(
        config.environment
      );
    });

    it('should have appropriate sampling rates for test environment', () => {
      getAPMConfig();

      if (config.environment === 'test') {
        expect(config.sampling.traces).toBe(0);
        expect(config.sampling.sessionReplay).toBe(0);
        expect(config.sampling.metrics).toBe(0);
      }
    });

    it('should include required service tags', () => {
      getAPMConfig();

      expect(config.tags).toHaveProperty('service');
      expect(config.tags).toHaveProperty('environment');
      expect(config.tags).toHaveProperty('platform');
      expect(config.tags.service).toBe('unite-hub');
    });
  });

  describe('Datadog Integration', () => {
    it('should have singleton instance', () => {
      const instance1 = datadogIntegration;
      const instance2 = datadogIntegration;

      expect(instance1).toBe(instance2);
    });

    it('should not initialize without required config', async () => {
      const isInitialized = datadogIntegration.isInitialized();

      // In test environment without keys, should not be initialized
      if (!process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID) {
        expect(isInitialized).toBe(false);
      }
    });

    it('should handle user context setting safely when not initialized', () => {
      // Should not throw when setting user context
      expect(() => {
        datadogIntegration.setUser({
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
        });
      }).not.toThrow();
    });

    it('should handle event tracking safely when not initialized', () => {
      expect(() => {
        datadogIntegration.trackEvent({
          name: 'test_event',
          attributes: { foo: 'bar' },
        });
      }).not.toThrow();
    });

    it('should handle metric tracking safely when not initialized', () => {
      expect(() => {
        datadogIntegration.trackMetric({
          name: 'test.metric',
          value: 100,
          tags: { source: 'test' },
        });
      }).not.toThrow();
    });

    it('should handle error tracking safely when not initialized', () => {
      expect(() => {
        datadogIntegration.trackError({
          message: 'Test error',
          type: 'TestError',
          source: 'test',
        });
      }).not.toThrow();
    });
  });

  describe('Sentry Integration', () => {
    it('should have singleton instance', () => {
      const instance1 = sentryIntegration;
      const instance2 = sentryIntegration;

      expect(instance1).toBe(instance2);
    });

    it('should not initialize without DSN', () => {
      const isInitialized = sentryIntegration.isInitialized();

      // In test environment without DSN, should not be initialized
      if (!process.env.SENTRY_DSN) {
        expect(isInitialized).toBe(false);
      }
    });

    it('should handle user context setting safely when not initialized', () => {
      expect(() => {
        sentryIntegration.setUser({
          id: 'test-user',
          email: 'test@example.com',
        });
      }).not.toThrow();
    });

    it('should handle exception capture safely when not initialized', () => {
      expect(() => {
        sentryIntegration.captureException(new Error('Test error'), {
          tags: { source: 'test' },
        });
      }).not.toThrow();
    });

    it('should handle message capture safely when not initialized', () => {
      expect(() => {
        sentryIntegration.captureMessage('Test message', 'info');
      }).not.toThrow();
    });

    it('should handle breadcrumb addition safely when not initialized', () => {
      expect(() => {
        sentryIntegration.addBreadcrumb({
          type: 'default',
          message: 'Test breadcrumb',
          level: 'info',
        });
      }).not.toThrow();
    });
  });

  describe('Metrics Exporter', () => {
    beforeEach(() => {
      metricsExporter.clearQueue();
    });

    afterEach(async () => {
      metricsExporter.stopFlushTimer();
      await metricsExporter.flush();
    });

    it('should have singleton instance', () => {
      const instance1 = metricsExporter;
      const instance2 = metricsExporter;

      expect(instance1).toBe(instance2);
    });

    it('should not export metrics without API key', () => {
      const isEnabled = metricsExporter.isEnabled();

      // In test environment without API key, should not be enabled
      if (!process.env.DATADOG_API_KEY) {
        expect(isEnabled).toBe(false);
      }
    });

    it('should handle HTTP metrics export safely', () => {
      expect(() => {
        metricsExporter.exportHttpMetrics({
          method: 'POST',
          path: '/api/test',
          statusCode: 200,
          duration: 100,
          timestamp: Date.now() / 1000,
        });
      }).not.toThrow();
    });

    it('should handle database metrics export safely', () => {
      expect(() => {
        metricsExporter.exportDatabaseMetrics({
          operation: 'select',
          table: 'contacts',
          duration: 50,
          rowCount: 10,
          timestamp: Date.now() / 1000,
        });
      }).not.toThrow();
    });

    it('should handle cache metrics export safely', () => {
      expect(() => {
        metricsExporter.exportCacheMetrics({
          operation: 'hit',
          key: 'test-key',
          duration: 5,
          timestamp: Date.now() / 1000,
        });
      }).not.toThrow();
    });

    it('should handle AI token metrics export safely', () => {
      expect(() => {
        metricsExporter.exportAITokenMetrics({
          model: 'claude-sonnet-4-5',
          inputTokens: 100,
          outputTokens: 200,
          cost: 0.05,
          operation: 'test',
          timestamp: Date.now() / 1000,
        });
      }).not.toThrow();
    });

    it('should track queue size', () => {
      const initialSize = metricsExporter.getQueueSize();
      expect(typeof initialSize).toBe('number');
      expect(initialSize).toBeGreaterThanOrEqual(0);
    });

    it('should clear queue', () => {
      metricsExporter.exportHttpMetrics({
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now() / 1000,
      });

      metricsExporter.clearQueue();
      expect(metricsExporter.getQueueSize()).toBe(0);
    });
  });

  describe('APM Middleware', () => {
    it('should import middleware without errors', async () => {
      const { withAPMMiddleware } = await import('@/middleware/apm-middleware');
      expect(withAPMMiddleware).toBeDefined();
      expect(typeof withAPMMiddleware).toBe('function');
    });

    it('should import apm middleware function', async () => {
      const { apmMiddleware } = await import('@/middleware/apm-middleware');
      expect(apmMiddleware).toBeDefined();
      expect(typeof apmMiddleware).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should initialize all APM components without errors', () => {
      expect(() => {
        getAPMConfig();
        // Components should handle missing config gracefully
      }).not.toThrow();
    });

    it('should handle full APM workflow', () => {
      expect(() => {
        // 1. Load config
        getAPMConfig();

        // 2. Track metrics
        metricsExporter.exportHttpMetrics({
          method: 'GET',
          path: '/api/test',
          statusCode: 200,
          duration: 100,
          timestamp: Date.now() / 1000,
        });

        // 3. Track event
        datadogIntegration.trackEvent({
          name: 'test_workflow',
          attributes: { step: 'integration_test' },
        });

        // 4. Track error
        sentryIntegration.captureMessage('Test workflow complete', 'info');
      }).not.toThrow();
    });

    it('should not cause circular dependencies', async () => {
      // Import all modules to check for circular dependencies
      const modules = await Promise.all([
        import('@/lib/apm/datadog-integration'),
        import('@/lib/apm/sentry-integration'),
        import('@/lib/apm/metrics-exporter'),
        import('@/config/apm-config'),
        import('@/middleware/apm-middleware'),
      ]);

      modules.forEach((module) => {
        expect(module).toBeDefined();
      });
    });

    it('should have consistent configuration across modules', () => {
      getAPMConfig();
      datadogIntegration.getConfig();
      sentryIntegration.getConfig();

      // All configs should be accessible (even if null)
      expect(config).toBeDefined();
      // datadogConfig and sentryConfig may be null if not initialized
    });
  });

  describe('Performance', () => {
    it('should track metrics with minimal overhead', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        metricsExporter.exportHttpMetrics({
          method: 'GET',
          path: '/api/test',
          statusCode: 200,
          duration: 10,
          timestamp: Date.now() / 1000,
        });
      }

      const duration = Date.now() - start;

      // Should process 100 metrics in less than 100ms (1ms per metric)
      expect(duration).toBeLessThan(100);
    });

    it('should handle high-volume event tracking', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        datadogIntegration.trackEvent({
          name: 'test_event',
          attributes: { iteration: i },
        });
      }

      const duration = Date.now() - start;

      // Should process 100 events in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid metric data', () => {
      expect(() => {
        metricsExporter.exportHttpMetrics({
          method: '',
          path: '',
          statusCode: 0,
          duration: -1,
          timestamp: 0,
        });
      }).not.toThrow();
    });

    it('should not throw on null user context', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        datadogIntegration.setUser(null);
      }).not.toThrow();
    });

    it('should not throw on undefined event', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        datadogIntegration.trackEvent(undefined);
      }).not.toThrow();
    });
  });
});
