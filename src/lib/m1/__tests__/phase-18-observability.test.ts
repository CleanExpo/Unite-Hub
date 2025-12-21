/**
 * M1 Phase 18: Advanced Observability & Distributed Operations Tests
 *
 * Comprehensive test suite for observability orchestration and
 * distributed system operations
 *
 * Total: 40+ tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObservabilityOrchestrator } from '../observability/observability-orchestrator';
import { DistributedOperationsManager } from '../observability/distributed-operations';

describe('Phase 18: Advanced Observability & Distributed Operations', () => {
  // ============================================================================
  // ObservabilityOrchestrator Tests
  // ============================================================================

  describe('ObservabilityOrchestrator - Trace Context', () => {
    let orchestrator: ObservabilityOrchestrator;

    beforeEach(() => {
      orchestrator = new ObservabilityOrchestrator();
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should create trace context', () => {
      const context = orchestrator.createTraceContext('request');

      expect(context).toBeDefined();
      expect(context.traceId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(context.scope).toBe('request');
      expect(context.samplingDecision).toBeDefined();
    });

    it('should support trace context hierarchy', () => {
      const parent = orchestrator.createTraceContext('request');
      const child = orchestrator.createTraceContext('transaction', parent.traceId, parent.spanId);

      expect(child.traceId).toBe(parent.traceId);
      expect(child.parentSpanId).toBe(parent.spanId);
      expect(child.spanId).not.toBe(parent.spanId);
    });

    it('should add tags to trace context', () => {
      const context = orchestrator.createTraceContext('session');

      const success = orchestrator.addTag(context.traceId, 'user.id', 'user123');
      expect(success).toBe(true);
      expect(context.tags.has('user.id')).toBe(true);
    });

    it('should add baggage items', () => {
      const context = orchestrator.createTraceContext('request');

      const success = orchestrator.addBaggageItem(context.traceId, 'tenant', 'acme');
      expect(success).toBe(true);
      expect(context.baggage.has('tenant')).toBe(true);
    });

    it('should respect baggage size limit', () => {
      const orchestratorWithSmallLimit = new ObservabilityOrchestrator({
        maxBaggageSize: 50,
      });
      const context = orchestratorWithSmallLimit.createTraceContext('request');

      // Add item that fits
      const canAdd = orchestratorWithSmallLimit.addBaggageItem(context.traceId, 'a', 'b');
      expect(canAdd).toBe(true);

      // Try to add very large item that exceeds limit
      const cannotAdd = orchestratorWithSmallLimit.addBaggageItem(
        context.traceId,
        'large_key',
        'x'.repeat(100)
      );
      expect(cannotAdd).toBe(false);
      orchestratorWithSmallLimit.shutdown();
    });
  });

  describe('ObservabilityOrchestrator - Telemetry Events', () => {
    let orchestrator: ObservabilityOrchestrator;

    beforeEach(() => {
      orchestrator = new ObservabilityOrchestrator({
        samplingRate: 1.0, // Always sample in tests
      });
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should record telemetry events', () => {
      const context = orchestrator.createTraceContext('request');

      const eventId = orchestrator.recordEvent('metric', 'http.requests', context.traceId, {
        method: 'GET',
        status: 200,
      });

      expect(eventId).toBeDefined();
      expect(eventId).not.toBe('');
    });

    it('should record events with duration', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent(
        'trace',
        'db.query',
        context.traceId,
        { query: 'SELECT *' },
        150
      );

      const events = orchestrator.getTraceEvents(context.traceId);
      expect(events.length).toBe(1);
      expect(events[0].duration).toBe(150);
    });

    it('should record error events', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent(
        'log',
        'error.occurred',
        context.traceId,
        { service: 'api' },
        undefined,
        { type: 'DatabaseError', message: 'Connection failed' }
      );

      const events = orchestrator.getTraceEvents(context.traceId);
      expect(events.length).toBe(1);
      expect(events[0].error?.type).toBe('DatabaseError');
    });

    it('should retrieve trace events', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent('metric', 'event1', context.traceId, {});
      orchestrator.recordEvent('log', 'event2', context.traceId, {});
      orchestrator.recordEvent('trace', 'event3', context.traceId, {});

      const events = orchestrator.getTraceEvents(context.traceId);
      expect(events.length).toBe(3);
      expect(events[0].type).toBe('metric');
      expect(events[1].type).toBe('log');
      expect(events[2].type).toBe('trace');
    });

    it('should calculate trace latency', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent('metric', 'event1', context.traceId, {}, 50);
      orchestrator.recordEvent('metric', 'event2', context.traceId, {}, 75);
      orchestrator.recordEvent('metric', 'event3', context.traceId, {}, 100);
      orchestrator.recordEvent('log', 'log1', context.traceId, {}, 25);

      const latency = orchestrator.calculateTraceLatency(context.traceId);
      // Total is based on first and last event timestamps, which might be same
      expect(latency.byType).toBeDefined();
      expect(latency.byType.metric).toBe(225); // 50 + 75 + 100
      expect(latency.byType.log).toBe(25);
    });
  });

  describe('ObservabilityOrchestrator - Service Topology', () => {
    let orchestrator: ObservabilityOrchestrator;

    beforeEach(() => {
      orchestrator = new ObservabilityOrchestrator({
        enableServiceTopology: true,
      });
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should register service nodes', () => {
      const serviceId = orchestrator.registerServiceNode('auth-service', '1.0.0', 'production', 'us-east-1');

      expect(serviceId).toBeDefined();
      const topology = orchestrator.getServiceTopology();
      expect(topology.nodes.size).toBe(1);
    });

    it('should update service health', () => {
      const serviceId = orchestrator.registerServiceNode(
        'api-service',
        '2.1.0',
        'staging',
        'eu-west-1'
      );

      const success = orchestrator.updateServiceHealth(serviceId, 'degraded');
      expect(success).toBe(true);

      const topology = orchestrator.getServiceTopology();
      const node = topology.nodes.get(serviceId);
      expect(node?.health).toBe('degraded');
    });

    it('should record service dependencies', () => {
      const apiServiceId = orchestrator.registerServiceNode('api', '1.0.0', 'prod', 'us-east-1');
      const dbServiceId = orchestrator.registerServiceNode('database', '2.0.0', 'prod', 'us-east-1');

      const success = orchestrator.recordDependency(
        apiServiceId,
        dbServiceId,
        'database',
        50,
        100,
        200,
        0.01,
        1000
      );

      expect(success).toBe(true);
      const topology = orchestrator.getServiceTopology();
      expect(topology.edges.size).toBeGreaterThan(0);
    });

    it('should detect unhealthy services', () => {
      const serviceId = orchestrator.registerServiceNode('web', '1.0.0', 'prod', 'us-east-1');

      orchestrator.updateServiceHealth(serviceId, 'unhealthy');

      const anomalies = orchestrator.detectTopologyAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('unhealthy_services');
      expect(anomalies[0].severity).toBe('critical');
    });

    it('should detect high error rates', () => {
      const svcId1 = orchestrator.registerServiceNode('svc1', '1.0.0', 'prod', 'us-east-1');
      const svcId2 = orchestrator.registerServiceNode('svc2', '1.0.0', 'prod', 'us-east-1');

      // Record dependency with high error rate
      orchestrator.recordDependency(svcId1, svcId2, 'sync', 100, 200, 300, 0.15, 500);

      const anomalies = orchestrator.detectTopologyAnomalies();
      const errorAnomalies = anomalies.filter((a) => a.type === 'high_error_rate');
      expect(errorAnomalies.length).toBeGreaterThan(0);
    });
  });

  describe('ObservabilityOrchestrator - Correlation Context', () => {
    let orchestrator: ObservabilityOrchestrator;

    beforeEach(() => {
      orchestrator = new ObservabilityOrchestrator({
        enableCorrelation: true,
      });
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should create correlation context', () => {
      const contextId = orchestrator.createCorrelationContext();

      expect(contextId).toBeDefined();
      expect(contextId).not.toBe('');
    });

    it('should bind values to correlation context', () => {
      const contextId = orchestrator.createCorrelationContext();

      orchestrator.bindToContext(contextId, 'request.id', 'req123');
      orchestrator.bindToContext(contextId, 'user.id', 'user456');

      expect(orchestrator.getContextValue(contextId, 'request.id')).toBe('req123');
      expect(orchestrator.getContextValue(contextId, 'user.id')).toBe('user456');
    });

    it('should return undefined for missing context values', () => {
      const contextId = orchestrator.createCorrelationContext();

      expect(orchestrator.getContextValue(contextId, 'nonexistent')).toBeUndefined();
    });

    it('should handle context value overrides', () => {
      const contextId = orchestrator.createCorrelationContext();

      orchestrator.bindToContext(contextId, 'status', 'active');
      orchestrator.bindToContext(contextId, 'status', 'inactive');

      expect(orchestrator.getContextValue(contextId, 'status')).toBe('inactive');
    });
  });

  describe('ObservabilityOrchestrator - Statistics', () => {
    let orchestrator: ObservabilityOrchestrator;

    beforeEach(() => {
      orchestrator = new ObservabilityOrchestrator({
        samplingRate: 1.0,
      });
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should generate observability statistics', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent('metric', 'event1', context.traceId, {});
      orchestrator.recordEvent('log', 'event2', context.traceId, {});
      orchestrator.recordEvent('trace', 'event3', context.traceId, {});

      const stats = orchestrator.getStatistics();

      expect(stats.totalTraces).toBe(1);
      expect(stats.totalEvents).toBe(3);
      expect(stats.errorRate).toBe(0);
    });

    it('should track error rate in statistics', () => {
      const context = orchestrator.createTraceContext('request');

      orchestrator.recordEvent('metric', 'ok', context.traceId, {});
      orchestrator.recordEvent('log', 'error', context.traceId, {}, undefined, {
        type: 'Error',
        message: 'test',
      });

      const stats = orchestrator.getStatistics();
      expect(stats.totalErrors).toBe(1);
      expect((stats.errorRate as number) > 0).toBe(true);
    });
  });

  // ============================================================================
  // DistributedOperationsManager Tests
  // ============================================================================

  describe('DistributedOperationsManager - Cluster Management', () => {
    let manager: DistributedOperationsManager;

    beforeEach(() => {
      manager = new DistributedOperationsManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should register cluster nodes', () => {
      const nodeId = manager.registerNode('localhost', 8080, 1);

      expect(nodeId).toBeDefined();
      const status = manager.getClusterStatus();
      expect(status.followers.length + (status.leader ? 1 : 0)).toBe(1);
    });

    it('should update node state', () => {
      const nodeId = manager.registerNode('localhost', 8081, 1);

      const success = manager.updateNodeState(nodeId, 'follower');
      expect(success).toBe(true);

      const status = manager.getClusterStatus();
      expect(status.followers.length).toBeGreaterThan(0);
    });

    it('should perform leader election', () => {
      manager.registerNode('localhost', 8080, 3);
      manager.registerNode('localhost', 8081, 2);
      manager.registerNode('localhost', 8082, 1);

      const result = manager.startLeaderElection();

      expect(result.elected).toBe(true);
      expect(result.leaderId).toBeDefined();

      const status = manager.getClusterStatus();
      expect(status.leader).toBeDefined();
      expect(status.followers.length).toBe(2);
    });

    it('should maintain consensus state', () => {
      manager.registerNode('localhost', 8080, 1);

      const electionResult = manager.startLeaderElection();
      expect(electionResult.elected).toBe(true);

      const status = manager.getClusterStatus();
      expect(status.currentTerm).toBeGreaterThan(0);
    });
  });

  describe('DistributedOperationsManager - Consensus & Replication', () => {
    let manager: DistributedOperationsManager;

    beforeEach(() => {
      manager = new DistributedOperationsManager();
      manager.registerNode('localhost', 8080, 1);
      manager.startLeaderElection();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should append log entries', () => {
      const success = manager.appendLogEntry({ command: 'set', key: 'x', value: 10 });

      expect(success).toBe(true);
    });

    it('should commit log entries', () => {
      manager.appendLogEntry({ command: 'set' });
      manager.appendLogEntry({ command: 'set' });
      manager.appendLogEntry({ command: 'set' });

      const committed = manager.commitLogEntries(2);
      expect(committed).toBe(2);
    });

    it('should replicate data', () => {
      const replicationId = manager.replicateData('user:123', { name: 'Alice', age: 30 });

      expect(replicationId).toBeDefined();
      const status = manager.getReplicationStatus('user:123');
      expect(status.totalSequences).toBeGreaterThan(0);
    });

    it('should confirm replication on nodes', () => {
      const nodeId = manager.registerNode('localhost', 8081, 1);
      manager.replicateData('config:global', { maxConnections: 1000 });

      const success = manager.confirmReplication('config:global', 0, nodeId);
      expect(success).toBe(true);

      const status = manager.getReplicationStatus('config:global');
      expect(status.replicatedSequences).toBeGreaterThan(0);
    });
  });

  describe('DistributedOperationsManager - Distributed Locking', () => {
    let manager: DistributedOperationsManager;

    beforeEach(() => {
      manager = new DistributedOperationsManager();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should acquire exclusive lock', () => {
      const lockId = manager.acquireLock('resource:db', 'client1', 'exclusive');

      expect(lockId).toBeDefined();
      expect(lockId).not.toBeNull();
    });

    it('should acquire shared locks', () => {
      const lock1 = manager.acquireLock('resource:file', 'client1', 'shared');
      const lock2 = manager.acquireLock('resource:file', 'client2', 'shared');

      expect(lock1).not.toBeNull();
      expect(lock2).not.toBeNull();
    });

    it('should block exclusive lock when exclusive lock held', () => {
      const lock1 = manager.acquireLock('resource:cache', 'client1', 'exclusive');
      const lock2 = manager.acquireLock('resource:cache', 'client2', 'exclusive');

      expect(lock1).not.toBeNull();
      expect(lock2).toBeNull(); // Should be blocked
    });

    it('should release locks', () => {
      const lockId = manager.acquireLock('resource:mutex', 'client1', 'exclusive');

      expect(lockId).not.toBeNull();

      if (lockId) {
        const released = manager.releaseLock(lockId);
        expect(released).toBe(true);
      }
    });

    it('should process lock wait queue', () => {
      // First client acquires lock
      const lock1 = manager.acquireLock('resource:queue', 'client1', 'exclusive');
      expect(lock1).not.toBeNull();

      // Get initial lock count
      let stats = manager.getStatistics();
      const locksBefore = stats.activeLocks;

      // Second client tries but is blocked (added to wait queue)
      const lock2 = manager.acquireLock('resource:queue', 'client2', 'exclusive');
      expect(lock2).toBeNull(); // Should be blocked

      stats = manager.getStatistics();
      const locksAfterBlock = stats.activeLocks;
      // One lock held, one blocked lock in map
      expect(locksAfterBlock).toBeGreaterThan(locksBefore);

      // Release first lock
      if (lock1) {
        const released = manager.releaseLock(lock1);
        expect(released).toBe(true);
      }

      // After releasing, the wait queue processing attempts to grant to next waiter
      stats = manager.getStatistics();
      // The released lock should be gone
      expect(stats.activeLocks).toBeLessThan(locksAfterBlock);
    });
  });

  describe('DistributedOperationsManager - Two-Phase Commit', () => {
    let manager: DistributedOperationsManager;

    beforeEach(() => {
      manager = new DistributedOperationsManager();
      const svc1 = manager.registerNode('svc1', 8080, 1);
      const svc2 = manager.registerNode('svc2', 8081, 1);
      manager.startLeaderElection();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should start distributed transaction', () => {
      const participants = new Set(['node1', 'node2', 'node3']);
      const operations = [
        { id: 'op1', type: 'write' as const, resource: 'table1', data: { row: 1 } },
        { id: 'op2', type: 'write' as const, resource: 'table2', data: { row: 2 } },
      ];

      const txnId = manager.startDistributedTransaction(participants, operations);

      expect(txnId).toBeDefined();
    });

    it('should prepare transaction (Phase 1)', () => {
      const participants = new Set(['node1', 'node2']);
      const txnId = manager.startDistributedTransaction(participants, []);

      const result = manager.prepareTransaction(txnId);

      expect(result.nodeVotes).toBeDefined();
      expect(result.nodeVotes.size).toBe(2);
    });

    it('should commit transaction (Phase 2)', () => {
      const participants = new Set(['node1', 'node2']);
      const txnId = manager.startDistributedTransaction(participants, []);

      manager.prepareTransaction(txnId);
      const success = manager.commitTransaction(txnId);

      expect(success).toBe(true);
    });

    it('should abort transaction', () => {
      const participants = new Set(['node1', 'node2']);
      const txnId = manager.startDistributedTransaction(participants, []);

      const success = manager.abortTransaction(txnId, 'Participant unavailable');

      expect(success).toBe(true);
    });
  });

  describe('DistributedOperationsManager - Statistics', () => {
    let manager: DistributedOperationsManager;

    beforeEach(() => {
      manager = new DistributedOperationsManager();
      manager.registerNode('localhost', 8080, 1);
      manager.registerNode('localhost', 8081, 1);
      manager.startLeaderElection();
    });

    afterEach(() => {
      manager.shutdown();
    });

    it('should generate operations statistics', () => {
      manager.appendLogEntry({ command: 'set' });
      manager.acquireLock('resource:test', 'client1', 'exclusive');
      manager.startDistributedTransaction(new Set(['node1', 'node2']), []);

      const stats = manager.getStatistics();

      expect(stats.registeredNodes).toBeGreaterThan(0);
      expect(stats.currentTerm).toBeGreaterThan(0);
      expect(stats.logSize).toBeGreaterThan(0);
      expect(stats.activeLocks).toBeGreaterThan(0);
      expect(stats.activeTransactions).toBeGreaterThan(0);
    });

    it('should track completed and aborted transactions', () => {
      const txn1 = manager.startDistributedTransaction(new Set(['n1']), []);
      const txn2 = manager.startDistributedTransaction(new Set(['n1']), []);

      manager.commitTransaction(txn1);
      manager.abortTransaction(txn2);

      const stats = manager.getStatistics();

      expect(stats.completedTransactions).toBe(1);
      expect(stats.abortedTransactions).toBe(1);
    });
  });
});
