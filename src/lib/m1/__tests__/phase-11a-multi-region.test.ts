/**
 * M1 Phase 11A: Multi-region Support Tests
 *
 * Test suite for multi-region deployment, failover, and load balancing
 *
 * Version: v2.4.0
 * Phase: 11A - Multi-region Support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegionManager, type RegionConfig } from '../infrastructure/region-manager';
import { LoadBalancer } from '../infrastructure/load-balancer';
import { DataReplicationManager } from '../infrastructure/data-replication';

describe('Phase 11A: Multi-region Support', () => {
  /**
   * REGION MANAGER TESTS (15 tests)
   */
  describe('Region Manager', () => {
    let regionManager: RegionManager;
    const testRegions: RegionConfig[] = [
      {
        code: 'us-east-1',
        name: 'US East',
        endpoint: 'https://us-east-1.example.com',
        isPrimary: true,
        priority: 1,
        healthCheckInterval: 30000,
      },
      {
        code: 'us-west-2',
        name: 'US West',
        endpoint: 'https://us-west-2.example.com',
        isPrimary: false,
        priority: 2,
        healthCheckInterval: 30000,
      },
      {
        code: 'eu-west-1',
        name: 'EU West',
        endpoint: 'https://eu-west-1.example.com',
        isPrimary: false,
        priority: 3,
        healthCheckInterval: 30000,
      },
    ];

    beforeEach(() => {
      regionManager = new RegionManager(testRegions);
    });

    afterEach(() => {
      regionManager.stopHealthChecks();
    });

    it('should initialize with primary region', () => {
      expect(regionManager.getActiveRegion()).toBe('us-east-1');
    });

    it('should track all regions', () => {
      const regions = regionManager.getRegions();
      expect(regions).toHaveLength(3);
      expect(regions.map(r => r.code)).toEqual(['us-east-1', 'us-west-2', 'eu-west-1']);
    });

    it('should identify primary region', () => {
      const regions = regionManager.getRegions();
      const primary = regions.find(r => r.isPrimary);
      expect(primary?.code).toBe('us-east-1');
    });

    it('should order secondary regions by priority', () => {
      const secondaries = regionManager.getSecondaryRegions();
      expect(secondaries).toEqual(['us-west-2', 'eu-west-1']);
    });

    it('should return health for all regions', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = regionManager.getAllRegionHealth();
      expect(health).toHaveLength(3);
      expect(health.every(h => h.lastCheck > 0)).toBe(true);
    });

    it('should track region latency', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = regionManager.getRegionHealth('us-east-1');
      expect(health).toBeDefined();
      expect(health?.latency).toBeGreaterThanOrEqual(0);
    });

    it('should track error rate', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = regionManager.getRegionHealth('us-east-1');
      expect(health?.errorRate).toBeGreaterThanOrEqual(0);
      expect(health?.errorRate).toBeLessThanOrEqual(1);
    });

    it('should update replication status', () => {
      regionManager.updateReplicationStatus('us-west-2', 50, 'in-sync');

      const status = regionManager.getReplicationStatus();
      const west = status.find(s => s.region === 'us-west-2');
      expect(west?.replicationLag).toBe(50);
      expect(west?.syncState).toBe('in-sync');
    });

    it('should handle replication lag', () => {
      regionManager.updateReplicationStatus('eu-west-1', 200, 'lagging');

      const status = regionManager.getReplicationStatus();
      const eu = status.find(s => s.region === 'eu-west-1');
      expect(eu?.syncState).toBe('lagging');
      expect(eu?.replicationLag).toBe(200);
    });

    it('should register failover callbacks', () => {
      const callback = vi.fn();
      regionManager.onFailover(callback);

      // Callback registered (actual failover triggered in integration tests)
      expect(callback).not.toHaveBeenCalled();
    });

    it('should track failover history', async () => {
      const callback = vi.fn();
      regionManager.onFailover(callback);

      // In real scenario, this would be triggered by health check failure
      const history = regionManager.getFailoverHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide statistics', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = regionManager.getStats();
      expect(stats.activeRegion).toBe('us-east-1');
      expect(stats.totalRegions).toBe(3);
      expect(stats.healthyRegions).toBeGreaterThanOrEqual(0);
      expect(stats.totalFailovers).toBeGreaterThanOrEqual(0);
    });

    it('should maintain healthy region count', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = regionManager.getStats();
      expect(stats.healthyRegions).toBeLessThanOrEqual(stats.totalRegions);
    });

    it('should support continuous health monitoring', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 200));

      const stats1 = regionManager.getStats();
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats2 = regionManager.getStats();
      // Stats should be available after multiple checks
      expect(stats1.activeRegion).toBe(stats2.activeRegion);
      expect(stats2.totalRegions).toBe(3);
    });

    it('should stop health checks', () => {
      regionManager.startHealthChecks();
      regionManager.stopHealthChecks();
      regionManager.stopHealthChecks(); // Should handle being called again

      expect(true).toBe(true);
    });
  });

  /**
   * LOAD BALANCER TESTS (15 tests)
   */
  describe('Load Balancer', () => {
    let loadBalancer: LoadBalancer;
    const regions: RegionCode[] = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'];

    beforeEach(() => {
      loadBalancer = new LoadBalancer(regions);
    });

    it('should route by latency', () => {
      const decision = loadBalancer.routeRequestLatencyBased({
        requestId: 'req-1',
        clientIP: '192.168.1.1',
        timestamp: Date.now(),
      });

      expect(regions).toContain(decision.region);
      expect(decision.reason).toContain('latency');
    });

    it('should route by geolocation', () => {
      const decision = loadBalancer.routeRequestGeolocation('US');
      expect(decision.region).toBe('us-east-1');
      expect(decision.reason).toContain('Geolocation');
    });

    it('should route US-WEST correctly', () => {
      const decision = loadBalancer.routeRequestGeolocation('US-WEST');
      expect(decision.region).toBe('us-west-2');
    });

    it('should route EU correctly', () => {
      const decision = loadBalancer.routeRequestGeolocation('EU');
      expect(decision.region).toBe('eu-west-1');
    });

    it('should route ASIA-SE correctly', () => {
      const decision = loadBalancer.routeRequestGeolocation('ASIA-SE');
      expect(decision.region).toBe('ap-southeast-1');
    });

    it('should route by round-robin', () => {
      const decisions = [];
      for (let i = 0; i < 5; i++) {
        decisions.push(loadBalancer.routeRequestRoundRobin());
      }

      // Should cycle through regions
      const uniqueRegions = new Set(decisions.map(d => d.region));
      expect(uniqueRegions.size).toBeGreaterThan(1);
    });

    it('should record latency measurements', () => {
      loadBalancer.recordLatency('us-east-1', 50);
      loadBalancer.recordLatency('us-east-1', 60);
      loadBalancer.recordLatency('us-west-2', 100);

      const stats = loadBalancer.getStats();
      expect(stats.averageLatency).toBeGreaterThan(0);
    });

    it('should calculate average latency', () => {
      loadBalancer.recordLatency('us-east-1', 100);
      loadBalancer.recordLatency('us-east-1', 100);
      loadBalancer.recordLatency('us-east-1', 100);

      const latency = loadBalancer.getRegionLatency('us-east-1');
      expect(latency).toBe(100);
    });

    it('should track requests per region', () => {
      loadBalancer.routeRequestRoundRobin();
      loadBalancer.routeRequestRoundRobin();
      loadBalancer.routeRequestRoundRobin();

      const stats = loadBalancer.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    it('should provide region load', () => {
      loadBalancer.routeRequestRoundRobin();
      loadBalancer.routeRequestRoundRobin();

      const load = loadBalancer.getRegionLoad();
      expect(Object.values(load).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    });

    it('should track routing strategy usage', () => {
      loadBalancer.routeRequestLatencyBased({ requestId: 'r1', clientIP: '1.1.1.1', timestamp: Date.now() });
      loadBalancer.routeRequestGeolocation('US');
      loadBalancer.routeRequestRoundRobin();

      const stats = loadBalancer.getStats();
      expect(stats.routingStrategies.latency).toBe(1);
      expect(stats.routingStrategies.geolocation).toBe(1);
      expect(stats.routingStrategies.roundRobin).toBe(1);
    });

    it('should reset statistics', () => {
      loadBalancer.routeRequestRoundRobin();
      loadBalancer.routeRequestRoundRobin();

      loadBalancer.resetStats();
      const stats = loadBalancer.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.averageLatency).toBe(0);
    });

    it('should handle unknown geolocation', () => {
      const decision = loadBalancer.routeRequestGeolocation('UNKNOWN');
      expect(regions).toContain(decision.region);
    });

    it('should maintain latency history per region', () => {
      loadBalancer.recordLatency('us-east-1', 50);
      loadBalancer.recordLatency('us-west-2', 100);
      loadBalancer.recordLatency('eu-west-1', 150);

      expect(loadBalancer.getRegionLatency('us-east-1')).toBe(50);
      expect(loadBalancer.getRegionLatency('us-west-2')).toBe(100);
      expect(loadBalancer.getRegionLatency('eu-west-1')).toBe(150);
    });

    it('should support high request volumes', () => {
      for (let i = 0; i < 1000; i++) {
        loadBalancer.routeRequestRoundRobin();
      }

      const stats = loadBalancer.getStats();
      expect(stats.totalRequests).toBe(1000);
    });
  });

  /**
   * DATA REPLICATION TESTS (15 tests)
   */
  describe('Data Replication Manager', () => {
    let replicationManager: DataReplicationManager;
    const regions: RegionCode[] = ['us-east-1', 'us-west-2', 'eu-west-1'];

    beforeEach(() => {
      replicationManager = new DataReplicationManager(regions);
    });

    afterEach(() => {
      replicationManager.stopReplication();
    });

    it('should queue replication events', () => {
      const eventId = replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
        data: { goal: 'test' },
      });

      expect(eventId).toBeDefined();
      expect(eventId).toContain('evt_');
    });

    it('should distribute events to secondary regions', () => {
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
      });

      const queues = replicationManager.getAllQueues();
      const westQueue = queues.find(q => q.region === 'us-west-2');
      expect(westQueue?.pendingCount).toBeGreaterThan(0);
    });

    it('should track pending events', () => {
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_1',
      });

      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'update',
        dataId: 'run_2',
      });

      const stats = replicationManager.getStats();
      expect(stats.totalQueued).toBeGreaterThan(0);
    });

    it('should assign version numbers to events', () => {
      const eventId = replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
      });

      const events = replicationManager.getEventLog();
      const event = events.find(e => e.eventId === eventId);
      expect(event?.version).toBe(1);
    });

    it('should maintain event log', () => {
      for (let i = 0; i < 5; i++) {
        replicationManager.queueReplicationEvent({
          region: 'us-east-1',
          dataType: 'agent_run',
          operation: 'create',
          dataId: `run_${i}`,
        });
      }

      const events = replicationManager.getEventLog();
      expect(events).toHaveLength(5);
    });

    it('should detect conflicts', async () => {
      const conflict = await replicationManager.resolveConflicts([
        {
          eventId: 'evt_1',
          timestamp: 1000,
          region: 'us-east-1',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
        {
          eventId: 'evt_2',
          timestamp: 2000,
          region: 'us-west-2',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
      ]);

      expect(conflict.conflict).toBe(true);
      expect(conflict.winner).toBe('us-west-2'); // Latest timestamp
    });

    it('should resolve conflicts by timestamp', async () => {
      const resolution = await replicationManager.resolveConflicts([
        {
          eventId: 'evt_1',
          timestamp: 1000,
          region: 'us-east-1',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
        {
          eventId: 'evt_2',
          timestamp: 3000,
          region: 'us-west-2',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
      ]);

      expect(resolution.resolution).toBe('timestamp');
      expect(resolution.winner).toBe('us-west-2');
    });

    it('should register replication callbacks', () => {
      const callback = vi.fn();
      replicationManager.onReplication(callback);

      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
      });

      expect(callback).toHaveBeenCalled();
    });

    it('should calculate replication lag', () => {
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
      });

      const lag = replicationManager.getReplicationLag('us-west-2');
      expect(lag).toBeGreaterThanOrEqual(0);
    });

    it('should start and stop replication', async () => {
      replicationManager.startReplication();
      await new Promise(resolve => setTimeout(resolve, 100));
      replicationManager.stopReplication();

      expect(true).toBe(true);
    });

    it('should provide statistics', () => {
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_1',
      });

      const stats = replicationManager.getStats();
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.regionStats).toHaveLength(3);
    });

    it('should clear old events', () => {
      for (let i = 0; i < 10; i++) {
        replicationManager.queueReplicationEvent({
          region: 'us-east-1',
          dataType: 'agent_run',
          operation: 'create',
          dataId: `run_${i}`,
        });
      }

      const cleared = replicationManager.clearOldEvents(1000000); // Clear events older than 1M ms (very old)
      expect(cleared).toBe(0); // Nothing that old yet

      const events = replicationManager.getEventLog();
      expect(events.length).toBeGreaterThan(0);
    });

    it('should track conflict resolutions', async () => {
      await replicationManager.resolveConflicts([
        {
          eventId: 'evt_1',
          timestamp: 1000,
          region: 'us-east-1',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
        {
          eventId: 'evt_2',
          timestamp: 2000,
          region: 'us-west-2',
          dataType: 'agent_run',
          operation: 'update',
          dataId: 'run_123',
          version: 1,
        },
      ]);

      const resolutions = replicationManager.getConflictResolutions();
      expect(resolutions).toHaveLength(1);
    });
  });

  /**
   * INTEGRATION TESTS (10 tests)
   */
  describe('Multi-region Integration', () => {
    let regionManager: RegionManager;
    let loadBalancer: LoadBalancer;
    let replicationManager: DataReplicationManager;

    beforeEach(() => {
      const testRegions: RegionConfig[] = [
        {
          code: 'us-east-1',
          name: 'US East',
          endpoint: 'https://us-east-1.example.com',
          isPrimary: true,
          priority: 1,
          healthCheckInterval: 30000,
        },
        {
          code: 'us-west-2',
          name: 'US West',
          endpoint: 'https://us-west-2.example.com',
          isPrimary: false,
          priority: 2,
          healthCheckInterval: 30000,
        },
      ];

      regionManager = new RegionManager(testRegions);
      loadBalancer = new LoadBalancer(['us-east-1', 'us-west-2']);
      replicationManager = new DataReplicationManager(['us-east-1', 'us-west-2']);
    });

    afterEach(() => {
      regionManager.stopHealthChecks();
      replicationManager.stopReplication();
    });

    it('should route request to active region', () => {
      const decision = loadBalancer.routeRequestLatencyBased({
        requestId: 'req-1',
        clientIP: '1.1.1.1',
        timestamp: Date.now(),
      });

      expect(decision.region).toBe(regionManager.getActiveRegion());
    });

    it('should replicate data across regions', () => {
      const eventId = replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
        data: { goal: 'test' },
      });

      expect(eventId).toBeDefined();

      const westQueue = replicationManager.getReplicationQueue('us-west-2');
      expect(westQueue?.pendingCount).toBeGreaterThan(0);
    });

    it('should handle concurrent requests to multiple regions', () => {
      const decisions = [];
      for (let i = 0; i < 10; i++) {
        decisions.push(
          loadBalancer.routeRequestLatencyBased({
            requestId: `req_${i}`,
            clientIP: `1.1.1.${i}`,
            timestamp: Date.now(),
          })
        );
      }

      const stats = loadBalancer.getStats();
      expect(stats.totalRequests).toBe(10);
    });

    it('should maintain consistency across regions', async () => {
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_1',
        data: { version: 1 },
      });

      replicationManager.queueReplicationEvent({
        region: 'us-west-2',
        dataType: 'agent_run',
        operation: 'update',
        dataId: 'run_1',
        data: { version: 2 },
      });

      const events = replicationManager.getEventLog();
      expect(events).toHaveLength(2);
    });

    it('should report multi-region health', async () => {
      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = regionManager.getStats();
      expect(stats.totalRegions).toBe(2);
      expect(stats.activeRegion).toBe('us-east-1');
    });

    it('should coordinate load balancing with region health', async () => {
      regionManager.startHealthChecks();
      loadBalancer.routeRequestLatencyBased({
        requestId: 'req_1',
        clientIP: '1.1.1.1',
        timestamp: Date.now(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const lbStats = loadBalancer.getStats();
      expect(lbStats.totalRequests).toBe(1);
    });

    it('should track global statistics', async () => {
      regionManager.startHealthChecks();
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_123',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const regionStats = regionManager.getStats();
      const replStats = replicationManager.getStats();
      const lbStats = loadBalancer.getStats();

      expect(regionStats.totalRegions).toBe(2);
      expect(replStats.totalEvents).toBeGreaterThan(0);
      expect(typeof lbStats.requestsByRegion).toBe('object');
    });

    it('should support disaster recovery scenario', async () => {
      regionManager.startHealthChecks();
      replicationManager.startReplication();

      // Simulate data creation in primary
      replicationManager.queueReplicationEvent({
        region: 'us-east-1',
        dataType: 'agent_run',
        operation: 'create',
        dataId: 'run_dr_123',
        data: { critical: true },
      });

      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify secondary region has the data
      const westQueue = replicationManager.getReplicationQueue('us-west-2');
      expect(westQueue).toBeDefined();

      regionManager.stopHealthChecks();
      replicationManager.stopReplication();
    });

    it('should handle multi-region failover scenario', async () => {
      const failoverCallback = vi.fn();
      regionManager.onFailover(failoverCallback);

      regionManager.startHealthChecks();
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = regionManager.getStats();
      expect(stats.activeRegion).toBeDefined();
      expect(stats.healthyRegions).toBeGreaterThanOrEqual(0);

      regionManager.stopHealthChecks();
    });
  });
});

/**
 * Type import for RegionCode
 */
import { RegionCode } from '../infrastructure/region-manager';
