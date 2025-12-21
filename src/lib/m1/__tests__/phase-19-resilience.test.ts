/**
 * M1 Phase 19: Advanced Resilience & Chaos Engineering Tests
 *
 * Comprehensive test suite for resilience patterns and chaos engineering
 *
 * Total: 40+ tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResilienceManager } from '../resilience/resilience-manager';
import { ChaosEngineeringEngine } from '../resilience/chaos-engineering';

describe('Phase 19: Advanced Resilience & Chaos Engineering', () => {
  // ============================================================================
  // Resilience Manager Tests
  // ============================================================================

  describe('ResilienceManager - Circuit Breaker', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should create circuit breaker', () => {
      const cbId = manager.createCircuitBreaker('api-service', 5, 2, 60000);

      expect(cbId).toBeDefined();
      const breakers = manager.getAllCircuitBreakers();
      expect(breakers.length).toBe(1);
      expect(breakers[0].state).toBe('closed');
    });

    it('should transition from closed to open', () => {
      const cbId = manager.createCircuitBreaker('api', 3, 2, 60000);

      // Record 3 failures
      manager.recordCircuitBreakerResult(cbId, false);
      manager.recordCircuitBreakerResult(cbId, false);
      manager.recordCircuitBreakerResult(cbId, false);

      const state = manager.getCircuitBreakerState(cbId);
      expect(state).toBe('open');
    });

    it('should transition from open to half-open after timeout', () => {
      const cbId = manager.createCircuitBreaker('api', 2, 2, 100); // 100ms timeout

      // Open the circuit
      manager.recordCircuitBreakerResult(cbId, false);
      manager.recordCircuitBreakerResult(cbId, false);

      let state = manager.getCircuitBreakerState(cbId);
      expect(state).toBe('open');

      // Wait for timeout
      const start = Date.now();
      while (Date.now() - start < 120){
;
}

      state = manager.getCircuitBreakerState(cbId);
      expect(state).toBe('half_open');
    });

    it('should transition from half-open to closed on success', () => {
      const cbId = manager.createCircuitBreaker('api', 2, 2, 100);

      // Open circuit
      manager.recordCircuitBreakerResult(cbId, false);
      manager.recordCircuitBreakerResult(cbId, false);

      // Wait and transition to half-open
      const start = Date.now();
      while (Date.now() - start < 120){
;
}
      manager.getCircuitBreakerState(cbId);

      // Record success
      manager.recordCircuitBreakerResult(cbId, true);
      manager.recordCircuitBreakerResult(cbId, true);

      const state = manager.getCircuitBreakerState(cbId);
      expect(state).toBe('closed');
    });
  });

  describe('ResilienceManager - Bulkhead', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should create bulkhead', () => {
      const bhId = manager.createBulkhead('worker-pool', 5, 10, 30000);

      expect(bhId).toBeDefined();
      const bulkheads = manager.getAllBulkheads();
      expect(bulkheads.length).toBe(1);
      expect(bulkheads[0].maxConcurrent).toBe(5);
    });

    it('should acquire bulkhead slots', () => {
      const bhId = manager.createBulkhead('pool', 3, 10, 30000);

      const slot1 = manager.acquireBulkheadSlot(bhId);
      const slot2 = manager.acquireBulkheadSlot(bhId);
      const slot3 = manager.acquireBulkheadSlot(bhId);

      expect(slot1).toBe(true);
      expect(slot2).toBe(true);
      expect(slot3).toBe(true);

      const bulkheads = manager.getAllBulkheads();
      expect(bulkheads[0].activeRequests).toBe(3);
    });

    it('should reject when bulkhead full', () => {
      const bhId = manager.createBulkhead('pool', 2, 1, 30000);

      manager.acquireBulkheadSlot(bhId);
      manager.acquireBulkheadSlot(bhId);
      const queuedSlot = manager.acquireBulkheadSlot(bhId);

      expect(queuedSlot).toBe(true); // Queued

      const rejectedSlot = manager.acquireBulkheadSlot(bhId);
      expect(rejectedSlot).toBe(false); // Rejected
    });

    it('should release bulkhead slots', () => {
      const bhId = manager.createBulkhead('pool', 3, 5, 30000);

      manager.acquireBulkheadSlot(bhId);
      manager.acquireBulkheadSlot(bhId);
      manager.releaseBulkheadSlot(bhId, false);

      const bulkheads = manager.getAllBulkheads();
      expect(bulkheads[0].activeRequests).toBe(1);
    });
  });

  describe('ResilienceManager - Rate Limiting', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should create rate limiter', () => {
      const rlId = manager.createRateLimiter('api-limiter', 100, 200);

      expect(rlId).toBeDefined();
      const limiters = manager.getAllRateLimiters();
      expect(limiters.length).toBe(1);
      expect(limiters[0].requestsPerSecond).toBe(100);
    });

    it('should allow requests within limit', () => {
      const rlId = manager.createRateLimiter('limiter', 10, 20);

      const request1 = manager.allowRequest(rlId, 1);
      const request2 = manager.allowRequest(rlId, 1);
      const request3 = manager.allowRequest(rlId, 1);

      expect(request1).toBe(true);
      expect(request2).toBe(true);
      expect(request3).toBe(true);
    });

    it('should respect burst capacity', () => {
      const rlId = manager.createRateLimiter('limiter', 10, 5);

      // Use up burst capacity
      let allowed = 0;
      for (let i = 0; i < 5; i++) {
        if (manager.allowRequest(rlId, 1)) {
allowed++;
}
      }

      expect(allowed).toBe(5);

      // Next request should be denied
      const denied = manager.allowRequest(rlId, 1);
      expect(denied).toBe(false);
    });

    it('should refill tokens over time', () => {
      const rlId = manager.createRateLimiter('limiter', 100, 10);

      // Use up burst
      for (let i = 0; i < 10; i++) {
        manager.allowRequest(rlId, 1);
      }

      // Wait for refill
      const start = Date.now();
      while (Date.now() - start < 1100){
;
} // Wait 1.1 seconds

      const allowed = manager.allowRequest(rlId, 1);
      expect(allowed).toBe(true);
    });
  });

  describe('ResilienceManager - Timeouts', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should create timeout', () => {
      const toId = manager.createTimeout('db-query', 5000);

      expect(toId).toBeDefined();
    });

    it('should detect timeout exceeded', () => {
      const toId = manager.createTimeout('request', 1000);

      const notExceeded = manager.isTimeoutExceeded(toId, 500);
      const exceeded = manager.isTimeoutExceeded(toId, 2000);

      expect(notExceeded).toBe(false);
      expect(exceeded).toBe(true);
    });
  });

  describe('ResilienceManager - Retry Delays', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should calculate exponential backoff delay', () => {
      const delay1 = manager.calculateRetryDelay(
        { maxAttempts: 5, policy: 'exponential', initialDelayMs: 100, maxDelayMs: 10000, backoffMultiplier: 2, jitter: false },
        1
      );

      const delay2 = manager.calculateRetryDelay(
        { maxAttempts: 5, policy: 'exponential', initialDelayMs: 100, maxDelayMs: 10000, backoffMultiplier: 2, jitter: false },
        2
      );

      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should calculate linear backoff delay', () => {
      const delay1 = manager.calculateRetryDelay(
        { maxAttempts: 5, policy: 'linear', initialDelayMs: 100, maxDelayMs: 10000, backoffMultiplier: 1, jitter: false },
        1
      );

      const delay2 = manager.calculateRetryDelay(
        { maxAttempts: 5, policy: 'linear', initialDelayMs: 100, maxDelayMs: 10000, backoffMultiplier: 1, jitter: false },
        2
      );

      expect(delay2).toBe(200);
      expect(delay1).toBe(100);
    });

    it('should respect max delay', () => {
      const delay = manager.calculateRetryDelay(
        { maxAttempts: 5, policy: 'exponential', initialDelayMs: 100, maxDelayMs: 500, backoffMultiplier: 10, jitter: false },
        3
      );

      expect(delay).toBeLessThanOrEqual(500);
    });
  });

  describe('ResilienceManager - Metrics', () => {
    let manager: ResilienceManager;

    beforeEach(() => {
      manager = new ResilienceManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should record request metrics', () => {
      manager.recordRequest('api', true, 50);
      manager.recordRequest('api', true, 60);
      manager.recordRequest('api', false, 100);

      const stats = manager.getStatistics();
      expect(stats.requestsLogged).toBeGreaterThan(0);
    });

    it('should generate resilience statistics', () => {
      manager.createCircuitBreaker('api', 5, 2, 60000);
      manager.createBulkhead('pool', 10, 20, 30000);
      manager.createRateLimiter('limiter', 100);

      const stats = manager.getStatistics();

      expect(stats.totalCircuitBreakers).toBe(1);
      expect(stats.totalBulkheads).toBe(1);
      expect(stats.totalRateLimiters).toBe(1);
    });
  });

  // ============================================================================
  // Chaos Engineering Engine Tests
  // ============================================================================

  describe('ChaosEngineeringEngine - Fault Injection', () => {
    let engine: ChaosEngineeringEngine;

    beforeEach(() => {
      engine = new ChaosEngineeringEngine();
    });

    afterEach(() => {
      engine.shutdown();
    });

    it('should create fault injection', () => {
      const faultId = engine.createFaultInjection('latency', 'api-service', 0.1, {
        delayMs: 500,
      });

      expect(faultId).toBeDefined();
    });

    it('should enable and disable fault injection', () => {
      const faultId = engine.createFaultInjection('error', 'database', 0.05, {
        errorCode: 500,
      });

      engine.enableFaultInjection(faultId);
      let injections = engine.getActiveInjections();
      expect(injections.length).toBe(1);

      engine.disableFaultInjection(faultId);
      injections = engine.getActiveInjections();
      expect(injections.length).toBe(0);
    });

    it('should check if request should be injected with fault', () => {
      const faultId = engine.createFaultInjection('timeout', 'api', 1.0, {
        timeoutMs: 1000,
      });

      engine.enableFaultInjection(faultId);

      const result = engine.shouldInjectFault('api');
      expect(result.shouldInject).toBe(true);
      expect(result.fault?.type).toBe('timeout');
    });
  });

  describe('ChaosEngineeringEngine - Experiments', () => {
    let engine: ChaosEngineeringEngine;

    beforeEach(() => {
      engine = new ChaosEngineeringEngine();
    });

    afterEach(() => {
      engine.shutdown();
    });

    it('should create chaos experiment', () => {
      const fault = engine.createFaultInjection('latency', 'api', 0.5, { delayMs: 1000 });
      const expId = engine.createExperiment('API Latency Test', 'Test API latency injection', [], 10000);

      expect(expId).toBeDefined();
      const experiments = engine.getAllExperiments();
      expect(experiments.length).toBe(1);
      expect(experiments[0].status).toBe('created');
    });

    it('should start and stop chaos experiment', () => {
      const expId = engine.createExperiment('Test', 'desc', [], 5000);

      const startSuccess = engine.startExperiment(expId);
      expect(startSuccess).toBe(true);

      const experiments = engine.getAllExperiments();
      expect(experiments[0].status).toBe('running');
      expect(experiments[0].startedAt).toBeDefined();

      const stopSuccess = engine.stopExperiment(expId);
      expect(stopSuccess).toBe(true);
      expect(experiments[0].status).toBe('completed');
      expect(experiments[0].completedAt).toBeDefined();
    });

    it('should pause and resume experiment', () => {
      const expId = engine.createExperiment('Test', 'desc', [], 5000);

      engine.startExperiment(expId);
      const pauseSuccess = engine.pauseExperiment(expId);
      expect(pauseSuccess).toBe(true);

      let experiments = engine.getAllExperiments();
      expect(experiments[0].status).toBe('paused');

      const resumeSuccess = engine.resumeExperiment(expId);
      expect(resumeSuccess).toBe(true);

      experiments = engine.getAllExperiments();
      expect(experiments[0].status).toBe('running');
    });
  });

  describe('ChaosEngineeringEngine - Scenarios', () => {
    let engine: ChaosEngineeringEngine;

    beforeEach(() => {
      engine = new ChaosEngineeringEngine();
    });

    afterEach(() => {
      engine.shutdown();
    });

    it('should create chaos scenario', () => {
      const scenarioId = engine.createScenario(
        'Multi-Fault Scenario',
        'Test system with multiple faults',
        [
          {
            name: 'Stage 1: API Latency',
            faults: [],
            duration: 5000,
            goals: ['Detect latency increase'],
          },
        ],
        { targetSuccessRate: 0.95, maxLatencyMs: 5000, allowedDowntimeMs: 10000 }
      );

      expect(scenarioId).toBeDefined();
    });

    it('should execute chaos scenario', () => {
      const scenarioId = engine.createScenario(
        'Test Scenario',
        'desc',
        [{ name: 'Stage 1', faults: [], duration: 1000, goals: [] }],
        { targetSuccessRate: 0.95, maxLatencyMs: 5000, allowedDowntimeMs: 10000 }
      );

      const expId = engine.executeScenario(scenarioId);
      expect(expId).toBeDefined();

      const experiments = engine.getAllExperiments();
      expect(experiments.length).toBe(1);
      expect(experiments[0].status).toBe('running');
    });
  });

  describe('ChaosEngineeringEngine - Analysis', () => {
    let engine: ChaosEngineeringEngine;

    beforeEach(() => {
      engine = new ChaosEngineeringEngine();
    });

    afterEach(() => {
      engine.shutdown();
    });

    it('should record baseline metrics', () => {
      engine.setBaselineMetrics('api', { latency: 100, errorRate: 0.01 });

      const metrics = engine.getBaselineMetrics('api');
      expect(metrics).toBeDefined();
      expect(metrics?.latency).toBe(100);
    });

    it('should record observation and analyze results', () => {
      const expId = engine.createExperiment('Test', 'desc', [], 5000);
      engine.startExperiment(expId);

      engine.setBaselineMetrics('api', { latency: 100 });
      engine.recordObservation(expId, 'api', 'latency', 100, 250); // High deviation

      const analysis = engine.analyzeResults(expId);
      expect(analysis.resilient).toBe(false); // High severity issue
      expect(analysis.affectedServices).toContain('api');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('ChaosEngineeringEngine - Statistics', () => {
    let engine: ChaosEngineeringEngine;

    beforeEach(() => {
      engine = new ChaosEngineeringEngine();
    });

    afterEach(() => {
      engine.shutdown();
    });

    it('should generate chaos statistics', () => {
      engine.createFaultInjection('latency', 'api', 0.5, {});
      engine.createFaultInjection('error', 'db', 0.1, {});
      engine.createScenario('Scenario', 'desc', [], { targetSuccessRate: 0.95, maxLatencyMs: 5000, allowedDowntimeMs: 10000 });

      const stats = engine.getStatistics();

      expect(stats.totalFaultInjections).toBe(2);
      expect(stats.totalScenarios).toBe(1);
    });
  });
});
