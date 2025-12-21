/**
 * M1 Phase 23: Distributed Transactions & Saga Patterns Tests
 *
 * Comprehensive test suite covering:
 * - SagaOrchestrator with step execution and compensation
 * - CompensationEngine with automatic rollback
 * - IdempotencyFramework with request deduplication
 * - EventStore with snapshots and replay
 *
 * Version: v1.0.0
 * Phase: 23 - Distributed Transactions & Saga Patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SagaOrchestrator, type SagaDefinition } from '../transactions/saga-orchestrator';
import { CompensationEngine } from '../transactions/compensation';
import { IdempotencyFramework } from '../transactions/idempotency';
import { EventStore, type Event } from '../events/event-store';

/**
 * ============================================
 * SagaOrchestrator Tests (12 tests)
 * ============================================
 */
describe('SagaOrchestrator', () => {
  let orchestrator: SagaOrchestrator;

  beforeEach(() => {
    orchestrator = new SagaOrchestrator();
  });

  afterEach(() => {
    orchestrator.shutdown();
  });

  it('should register saga definition', () => {
    const saga: SagaDefinition = {
      sagaId: 'test-saga',
      name: 'Test Saga',
      steps: [],
    };

    const registered = orchestrator.registerSaga(saga);
    expect(registered).toBe('test-saga');

    const retrieved = orchestrator.getSagaDefinition('test-saga');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Test Saga');
  });

  it('should execute saga with sequential steps', async () => {
    const executionOrder: string[] = [];

    const saga: SagaDefinition = {
      sagaId: 'seq-saga',
      name: 'Sequential Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async (data) => {
            executionOrder.push('step1');
            return { ...data, step1: true };
          },
        },
        {
          stepId: 'step2',
          name: 'Step 2',
          action: async (data) => {
            executionOrder.push('step2');
            return { ...data, step2: true };
          },
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('seq-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('completed');
    expect(executionOrder).toEqual(['step1', 'step2']);
    expect(instance?.data.step1).toBe(true);
    expect(instance?.data.step2).toBe(true);
  });

  it('should execute saga with parallel steps', async () => {
    const saga: SagaDefinition = {
      sagaId: 'parallel-saga',
      name: 'Parallel Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async (data) => ({ ...data, step1: true }),
        },
        {
          stepId: 'step2',
          name: 'Step 2',
          action: async (data) => ({ ...data, step2: true }),
        },
      ],
      parallelSteps: [['step1', 'step2']],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('parallel-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('completed');
    expect(instance?.executedSteps).toContain('step1');
    expect(instance?.executedSteps).toContain('step2');
  });

  it('should handle saga failure and compensation', async () => {
    const compensated: string[] = [];

    const saga: SagaDefinition = {
      sagaId: 'fail-saga',
      name: 'Failing Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async (data) => ({ ...data, step1: true }),
          compensation: async () => {
            compensated.push('step1');
          },
        },
        {
          stepId: 'step2',
          name: 'Step 2',
          action: async () => {
            throw new Error('Step 2 failed');
          },
          compensation: async () => {
            compensated.push('step2');
          },
        },
      ],
      compensationOrder: 'lifo',
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('fail-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('compensated');
    expect(instance?.failedStep).toBe('step2');
    expect(compensated).toEqual(['step1']); // Only step1 was executed
  });

  it('should support step timeout', async () => {
    const saga: SagaDefinition = {
      sagaId: 'timeout-saga',
      name: 'Timeout Saga',
      steps: [
        {
          stepId: 'timeout-step',
          name: 'Timeout Step',
          action: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
            return {};
          },
          timeout: 100, // 100ms timeout
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('timeout-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('compensated'); // Should fail due to timeout
    expect(instance?.failedStep).toBe('timeout-step');
  });

  it('should support step retry policy', async () => {
    let attempts = 0;
    const saga: SagaDefinition = {
      sagaId: 'retry-saga',
      name: 'Retry Saga',
      steps: [
        {
          stepId: 'retry-step',
          name: 'Retry Step',
          action: async () => {
            attempts++;
            if (attempts < 3) {
throw new Error('Retry me');
}
            return { retried: true };
          },
          retryPolicy: {
            maxAttempts: 3,
            backoffMs: 10,
          },
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('retry-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('completed');
    expect(attempts).toBe(3);
  });

  it('should track saga statistics', async () => {
    const saga: SagaDefinition = {
      sagaId: 'stat-saga',
      name: 'Statistic Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async (data) => ({ ...data, success: true }),
        },
      ],
    };

    orchestrator.registerSaga(saga);
    await orchestrator.startSaga('stat-saga');
    await orchestrator.startSaga('stat-saga');

    const stats = orchestrator.getStatistics();
    expect(stats.totalSagas).toBe(2);
    expect(stats.completed).toBe(2);
    expect(stats.registeredSagas).toBe(1);
  });

  it('should retrieve execution results', async () => {
    const saga: SagaDefinition = {
      sagaId: 'results-saga',
      name: 'Results Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async () => ({ result: 'value1' }),
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('results-saga');

    const results = orchestrator.getExecutionResults(instanceId);
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].stepId).toBe('step1');
  });

  it('should filter instances by status', async () => {
    const saga: SagaDefinition = {
      sagaId: 'filter-saga',
      name: 'Filter Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async () => ({ done: true }),
        },
      ],
    };

    orchestrator.registerSaga(saga);
    await orchestrator.startSaga('filter-saga');

    const completed = orchestrator.getAllInstances({ status: 'completed' });
    expect(completed).toHaveLength(1);

    const failed = orchestrator.getAllInstances({ status: 'failed' });
    expect(failed).toHaveLength(0);
  });

  it('should pass data through saga steps', async () => {
    const saga: SagaDefinition = {
      sagaId: 'data-saga',
      name: 'Data Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async (data) => ({ ...data, value: 10 }),
        },
        {
          stepId: 'step2',
          name: 'Step 2',
          action: async (data) => ({ ...data, value: (data.value as number) + 5 }),
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('data-saga', { initial: true });

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.data.initial).toBe(true);
    expect(instance?.data.value).toBe(15);
  });

  it('should measure saga duration', async () => {
    const saga: SagaDefinition = {
      sagaId: 'duration-saga',
      name: 'Duration Saga',
      steps: [
        {
          stepId: 'step1',
          name: 'Step 1',
          action: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return {};
          },
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('duration-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.durationMs).toBeGreaterThanOrEqual(50);
  });
});

/**
 * ============================================
 * CompensationEngine Tests (10 tests)
 * ============================================
 */
describe('CompensationEngine', () => {
  let engine: CompensationEngine;

  beforeEach(() => {
    engine = new CompensationEngine();
  });

  afterEach(() => {
    engine.shutdown();
  });

  it('should register compensation action', () => {
    const actionId = engine.registerCompensation('step1', async () => {});
    expect(actionId).toBeDefined();
    expect(actionId).toMatch(/^comp_/);
  });

  it('should execute compensation chain in LIFO order', async () => {
    const order: string[] = [];

    const comp1 = engine.registerCompensation('step1', async () => {
      order.push('comp1');
    });
    const comp2 = engine.registerCompensation('step2', async () => {
      order.push('comp2');
    });

    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp1);
    engine.addToChain(instanceId, comp2);

    const results = await engine.executeChain(instanceId, {});
    expect(results).toHaveLength(2);
    expect(order).toEqual(['comp2', 'comp1']); // LIFO order
  });

  it('should execute partial compensation', async () => {
    const executed: string[] = [];

    const comp1 = engine.registerCompensation('step1', async () => {
      executed.push('comp1');
    });
    const comp2 = engine.registerCompensation('step2', async () => {
      executed.push('comp2');
    });

    const results = await engine.partialCompensate('instance1', [comp1], {});
    expect(results).toHaveLength(1);
    expect(executed).toEqual(['comp1']);
  });

  it('should prevent concurrent compensation', async () => {
    const comp = engine.registerCompensation('step1', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp);

    // Start first compensation
    const promise1 = engine.executeChain(instanceId, {});

    // Try to start second while first is running
    await expect(engine.executeChain(instanceId, {})).rejects.toThrow('already running');

    // Wait for first to complete
    await promise1;

    // Should work after first completes
    const results = await engine.executeChain(instanceId, {});
    expect(results).toHaveLength(1);
  });

  it('should support compensation retry policy', async () => {
    let attempts = 0;
    const comp = engine.registerCompensation(
      'step1',
      async () => {
        attempts++;
        if (attempts < 2) {
throw new Error('Retry');
}
      },
      { retryPolicy: { maxAttempts: 2, backoffMs: 10 } }
    );

    const results = await engine.partialCompensate('instance1', [comp], {});
    expect(results[0].success).toBe(true);
    expect(results[0].retryCount).toBe(1);
  });

  it('should continue compensation on failure', async () => {
    const executed: string[] = [];

    const comp1 = engine.registerCompensation('step1', async () => {
      throw new Error('Compensation failed');
    });
    const comp2 = engine.registerCompensation('step2', async () => {
      executed.push('comp2');
    });

    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp1);
    engine.addToChain(instanceId, comp2);

    const results = await engine.executeChain(instanceId, {});
    // comp1 is in position 0 after addToChain (LIFO: comp2 added first, then comp1)
    // So it's comp2 then comp1 in execution order
    const failedResult = results.find((r) => !r.success);
    const successResult = results.find((r) => r.success);
    expect(failedResult).toBeDefined();
    expect(successResult).toBeDefined();
    expect(executed).toContain('comp2');
  });

  it('should track compensation history', async () => {
    const comp = engine.registerCompensation('step1', async () => {});

    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp);

    await engine.executeChain(instanceId, {});

    const history = engine.getHistory({ stepId: 'step1', success: true });
    expect(history).toHaveLength(1);
    expect(history[0].stepId).toBe('step1');
  });

  it('should provide compensation status', async () => {
    const comp = engine.registerCompensation('step1', async () => {});
    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp);

    const status = engine.getStatus(instanceId);
    expect(status.isLocked).toBe(false);
    expect(status.chainLength).toBe(1);
  });

  it('should clear compensation chain', async () => {
    const comp = engine.registerCompensation('step1', async () => {});
    const instanceId = 'instance1';
    engine.addToChain(instanceId, comp);

    engine.clearChain(instanceId);

    const status = engine.getStatus(instanceId);
    expect(status.chainLength).toBe(0);
  });

  it('should collect compensation statistics', async () => {
    const comp1 = engine.registerCompensation('step1', async () => {});
    const comp2 = engine.registerCompensation('step2', async () => {
      throw new Error('Failed');
    });

    await engine.partialCompensate('inst1', [comp1], {});
    await engine.partialCompensate('inst2', [comp2], {});

    const stats = engine.getStatistics();
    expect(stats.totalCompensations).toBe(2);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(1);
  });
});

/**
 * ============================================
 * IdempotencyFramework Tests (10 tests)
 * ============================================
 */
describe('IdempotencyFramework', () => {
  let framework: IdempotencyFramework;

  beforeEach(() => {
    framework = new IdempotencyFramework();
  });

  afterEach(() => {
    framework.shutdown();
  });

  it('should check new request as non-duplicate', () => {
    const result = framework.checkIdempotency('key1', 'operation1');
    expect(result.isDuplicate).toBe(false);
    expect(result.shouldExecute).toBe(true);
  });

  it('should detect duplicate request', () => {
    framework.checkIdempotency('key1', 'operation1');
    framework.markProcessing('key1');

    const result = framework.checkIdempotency('key1', 'operation1');
    expect(result.isDuplicate).toBe(true);
    expect(result.shouldExecute).toBe(false);
  });

  it('should return previous result for completed operation', () => {
    framework.checkIdempotency('key1', 'operation1');
    framework.markCompleted('key1', { result: 'value' });

    const result = framework.checkIdempotency('key1', 'operation1');
    expect(result.isDuplicate).toBe(true);
    expect(result.previousResult).toEqual({ result: 'value' });
  });

  it('should mark operation lifecycle', () => {
    const check1 = framework.checkIdempotency('key1', 'operation1');
    expect(check1.shouldExecute).toBe(true);

    framework.markProcessing('key1');
    const check2 = framework.checkIdempotency('key1', 'operation1');
    expect(check2.reason).toContain('already processing');

    framework.markCompleted('key1', { done: true });
    const result = framework.getPreviousResult('key1');
    expect(result).toEqual({ done: true });
  });

  it('should support operation expiration', (done) => {
    framework.checkIdempotency('key1', 'operation1', 100); // 100ms TTL
    framework.markCompleted('key1', { value: 'result' });

    setTimeout(() => {
      const result = framework.checkIdempotency('key1', 'operation1');
      expect(result.isDuplicate).toBe(false);
      expect(result.shouldExecute).toBe(true);
      done();
    }, 150);
  });

  it('should deduplicate concurrent identical requests', async () => {
    let callCount = 0;

    const promise1 = framework.deduplicateConcurrentRequest('key1', async () => {
      callCount++;
      return 'result';
    });

    const promise2 = framework.deduplicateConcurrentRequest('key1', async () => {
      callCount++;
      return 'result';
    });

    const [r1, r2] = await Promise.all([promise1, promise2]);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(callCount).toBe(1); // Called only once
  });

  it('should track operation statistics', () => {
    framework.checkIdempotency('key1', 'op1');
    framework.markCompleted('key1', { result: 'value' });

    framework.checkIdempotency('key2', 'op1');
    framework.markFailed('key2', new Error('Failed'));

    const stats = framework.getOperationStats('op1');
    expect(stats.totalRequests).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
  });

  it('should handle failed operation marking', () => {
    framework.checkIdempotency('key1', 'operation1');
    framework.markFailed('key1', new Error('Operation failed'));

    const result = framework.checkIdempotency('key1', 'operation1');
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toContain('failed');
  });

  it('should provide comprehensive statistics', () => {
    framework.checkIdempotency('key1', 'op1');
    framework.markCompleted('key1', { value: 1 });

    framework.checkIdempotency('key2', 'op2');
    framework.markFailed('key2', new Error('Failed'));

    const stats = framework.getStatistics();
    expect(stats.totalKeys).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.successRate).toBe(50);
  });
});

/**
 * ============================================
 * EventStore Tests (12 tests)
 * ============================================
 */
describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  afterEach(() => {
    store.shutdown();
  });

  it('should append event to log', () => {
    const event = store.appendEvent('aggregate1', 'UserCreated', { name: 'John', email: 'john@example.com' });

    expect(event.eventId).toBeDefined();
    expect(event.eventType).toBe('UserCreated');
    expect(event.version).toBe(1);
    expect(event.data.name).toBe('John');
  });

  it('should increment version for each event', () => {
    const event1 = store.appendEvent('aggregate1', 'EventA', {});
    const event2 = store.appendEvent('aggregate1', 'EventB', {});
    const event3 = store.appendEvent('aggregate1', 'EventC', {});

    expect(event1.version).toBe(1);
    expect(event2.version).toBe(2);
    expect(event3.version).toBe(3);
  });

  it('should retrieve events by aggregate', () => {
    store.appendEvent('agg1', 'EventA', {});
    store.appendEvent('agg1', 'EventB', {});
    store.appendEvent('agg2', 'EventC', {});

    const agg1Events = store.getEvents('agg1');
    expect(agg1Events).toHaveLength(2);
    expect(agg1Events[0].eventType).toBe('EventA');
    expect(agg1Events[1].eventType).toBe('EventB');

    const agg2Events = store.getEvents('agg2');
    expect(agg2Events).toHaveLength(1);
  });

  it('should filter events by type', () => {
    store.appendEvent('agg1', 'Created', {});
    store.appendEvent('agg1', 'Updated', {});
    store.appendEvent('agg1', 'Updated', {});

    const createdEvents = store.getEventsByType('agg1', 'Created');
    expect(createdEvents).toHaveLength(1);

    const updatedEvents = store.getEventsByType('agg1', 'Updated');
    expect(updatedEvents).toHaveLength(2);
  });

  it('should retrieve events in version range', () => {
    store.appendEvent('agg1', 'E1', {});
    store.appendEvent('agg1', 'E2', {});
    store.appendEvent('agg1', 'E3', {});
    store.appendEvent('agg1', 'E4', {});

    const rangeEvents = store.getEventsInRange('agg1', 2, 3);
    expect(rangeEvents).toHaveLength(2);
    expect(rangeEvents[0].version).toBe(2);
    expect(rangeEvents[1].version).toBe(3);
  });

  it('should create and retrieve snapshots', () => {
    store.appendEvent('agg1', 'Event1', {});
    store.appendEvent('agg1', 'Event2', {});

    const snapshot = store.createSnapshot('agg1', { state: 'current' });
    expect(snapshot.version).toBe(2);
    expect(snapshot.state.state).toBe('current');

    const retrieved = store.getSnapshot('agg1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.state.state).toBe('current');
  });

  it('should rebuild state from events', () => {
    const applyEvent = (state: Record<string, unknown>, event: Event) => {
      if (event.eventType === 'Incremented') {
        return { ...state, value: ((state.value as number) || 0) + (event.data.amount as number) };
      }
      return state;
    };

    store.appendEvent('counter', 'Incremented', { amount: 5 });
    store.appendEvent('counter', 'Incremented', { amount: 3 });

    const state = store.rebuildState('counter', applyEvent);
    expect(state.value).toBe(8);
  });

  it('should use snapshot for efficient replay', () => {
    const applyEvent = (state: Record<string, unknown>, event: Event) => {
      if (event.eventType === 'Added') {
        return { ...state, items: ((state.items as number) || 0) + 1 };
      }
      return state;
    };

    // Create events before snapshot
    store.appendEvent('agg1', 'Added', {});
    store.appendEvent('agg1', 'Added', {});

    // Create snapshot at version 2
    store.createSnapshot('agg1', { items: 2 });

    // Add more events after snapshot
    store.appendEvent('agg1', 'Added', {});

    const state = store.rebuildState('agg1', applyEvent);
    expect(state.items).toBe(3); // Snapshot (2) + 1 event after = 3
  });

  it('should get current state via projection', () => {
    const applyEvent = (state: Record<string, unknown>, event: Event) => {
      return { ...state, eventCount: ((state.eventCount as number) || 0) + 1 };
    };

    store.appendEvent('agg1', 'Event1', {});
    store.appendEvent('agg1', 'Event2', {});

    const projection = store.getCurrentState('agg1', applyEvent);
    expect(projection.eventCount).toBe(2);
    expect(projection.version).toBe(2);
  });

  it('should verify event store consistency', () => {
    store.appendEvent('agg1', 'E1', {});
    store.appendEvent('agg1', 'E2', {});

    const consistency = store.verifyConsistency();
    expect(consistency.consistent).toBe(true);
    expect(consistency.issues).toHaveLength(0);
  });

  it('should provide event store statistics', () => {
    store.appendEvent('agg1', 'Created', {});
    store.appendEvent('agg1', 'Updated', {});
    store.appendEvent('agg2', 'Created', {});

    const stats = store.getStatistics();
    expect(stats.aggregates).toBe(2);
    expect(stats.totalEvents).toBe(3);
    expect(stats.eventTypeDistribution.Created).toBe(2);
    expect(stats.eventTypeDistribution.Updated).toBe(1);
  });

  it('should get filtered event history', () => {
    store.appendEvent('agg1', 'EventA', {});
    store.appendEvent('agg2', 'EventB', {});
    store.appendEvent('agg1', 'EventC', {});

    const agg1History = store.getHistory({ aggregateId: 'agg1' });
    expect(agg1History).toHaveLength(2);

    const eventBHistory = store.getHistory({ eventType: 'EventB' });
    expect(eventBHistory).toHaveLength(1);
  });
});

/**
 * ============================================
 * Integration Tests (6 tests)
 * ============================================
 */
describe('Phase 23 Integration', () => {
  it('should combine saga with event sourcing', async () => {
    const orchestrator = new SagaOrchestrator();
    const store = new EventStore();

    const saga: SagaDefinition = {
      sagaId: 'order-saga',
      name: 'Order Processing',
      steps: [
        {
          stepId: 'create-order',
          name: 'Create Order',
          action: async (data) => {
            const orderId = 'order-' + Date.now();
            store.appendEvent(orderId, 'OrderCreated', { orderId, amount: 100 });
            return { ...data, orderId };
          },
        },
        {
          stepId: 'charge-payment',
          name: 'Charge Payment',
          action: async (data) => {
            store.appendEvent(data.orderId as string, 'PaymentCharged', { amount: 100 });
            return { ...data, charged: true };
          },
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('order-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('completed');
    expect(instance?.data.charged).toBe(true);

    const events = store.getHistory();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should use idempotency with saga compensation', async () => {
    const orchestrator = new SagaOrchestrator();
    const framework = new IdempotencyFramework();

    const idempotencyKey = 'order-123';
    const check1 = framework.checkIdempotency(idempotencyKey, 'process-order');
    expect(check1.shouldExecute).toBe(true);

    framework.markProcessing(idempotencyKey);

    const saga: SagaDefinition = {
      sagaId: 'order-saga',
      name: 'Order',
      steps: [
        {
          stepId: 'process',
          name: 'Process Order',
          action: async () => ({ processed: true }),
        },
      ],
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('order-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    framework.markCompleted(idempotencyKey, instance?.data);

    // Retry with same key
    const check2 = framework.checkIdempotency(idempotencyKey, 'process-order');
    expect(check2.isDuplicate).toBe(true);
    expect(check2.previousResult).toBeDefined();
  });

  it('should track compensation with event sourcing', async () => {
    const engine = new CompensationEngine();
    const store = new EventStore();

    const compensations: string[] = [];

    const comp = engine.registerCompensation('step1', async () => {
      compensations.push('compensated');
      store.appendEvent('saga-1', 'CompensationExecuted', { step: 'step1' });
    });

    const instanceId = 'saga-1';
    engine.addToChain(instanceId, comp);

    await engine.executeChain(instanceId, {});

    expect(compensations).toContain('compensated');
    const events = store.getEventsByType('saga-1', 'CompensationExecuted');
    expect(events).toHaveLength(1);
  });

  it('should support distributed saga with multiple aggregates', async () => {
    const orchestrator = new SagaOrchestrator();
    const store = new EventStore();

    const saga: SagaDefinition = {
      sagaId: 'transaction-saga',
      name: 'Distributed Transaction',
      steps: [
        {
          stepId: 'debit-account',
          name: 'Debit Account',
          action: async (data) => {
            store.appendEvent('account-1', 'Debited', { amount: 50 });
            return { ...data, debited: true };
          },
          compensation: async () => {
            store.appendEvent('account-1', 'DebitsReversed', { amount: 50 });
          },
        },
        {
          stepId: 'credit-account',
          name: 'Credit Account',
          action: async (data) => {
            store.appendEvent('account-2', 'Credited', { amount: 50 });
            return { ...data, credited: true };
          },
          compensation: async () => {
            store.appendEvent('account-2', 'CreditsReversed', { amount: 50 });
          },
        },
      ],
      compensationOrder: 'lifo',
    };

    orchestrator.registerSaga(saga);
    const instanceId = await orchestrator.startSaga('transaction-saga');

    const instance = orchestrator.getSagaInstance(instanceId);
    expect(instance?.status).toBe('completed');

    // Verify events across both accounts
    const account1Events = store.getEvents('account-1');
    const account2Events = store.getEvents('account-2');
    expect(account1Events.length).toBeGreaterThan(0);
    expect(account2Events.length).toBeGreaterThan(0);
  });

  it('should provide complete audit trail with snapshots', () => {
    const store = new EventStore();

    // Create series of events
    store.appendEvent('user-1', 'Created', { name: 'Alice' });
    store.appendEvent('user-1', 'Updated', { email: 'alice@example.com' });
    store.appendEvent('user-1', 'Updated', { city: 'New York' });

    // Create snapshot
    store.createSnapshot('user-1', { name: 'Alice', email: 'alice@example.com', city: 'New York' });

    // More events
    store.appendEvent('user-1', 'Updated', { country: 'USA' });

    const stats = store.getStatistics();
    expect(stats.totalEvents).toBe(4);
    expect(stats.snapshots).toBe(1);

    const consistency = store.verifyConsistency();
    expect(consistency.consistent).toBe(true);
  });
});
