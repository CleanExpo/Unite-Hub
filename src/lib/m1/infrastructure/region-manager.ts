/**
 * M1 Region Manager
 *
 * Manages multi-region deployment with automatic failover and replication.
 * Handles service distribution across AWS regions with health monitoring.
 *
 * Version: v2.4.0
 * Phase: 11A - Multi-region Support
 */

export type RegionCode = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'ap-southeast-1' | 'ap-northeast-1';

export interface RegionConfig {
  code: RegionCode;
  name: string;
  endpoint: string;
  isPrimary: boolean;
  priority: number;
  healthCheckInterval: number;
}

export interface RegionHealth {
  code: RegionCode;
  healthy: boolean;
  latency: number;
  errorRate: number;
  lastCheck: number;
  consecutiveFailures: number;
}

export interface FailoverEvent {
  timestamp: number;
  fromRegion: RegionCode;
  toRegion: RegionCode;
  reason: string;
  duration: number;
}

export interface ReplicationStatus {
  region: RegionCode;
  replicationLag: number;
  lastSync: number;
  syncState: 'in-sync' | 'lagging' | 'failed';
}

/**
 * Region Manager
 *
 * Manages multi-region deployment and automatic failover
 */
export class RegionManager {
  private regions: Map<RegionCode, RegionConfig> = new Map();
  private regionHealth: Map<RegionCode, RegionHealth> = new Map();
  private replicationStatus: Map<RegionCode, ReplicationStatus> = new Map();
  private failoverHistory: FailoverEvent[] = [];
  private activeRegion: RegionCode;
  private secondaryRegions: RegionCode[] = [];
  private healthCheckInterval: NodeJS.Timer | null = null;
  private failoverCallbacks: Array<(event: FailoverEvent) => void> = [];

  constructor(regions: RegionConfig[]) {
    for (const region of regions) {
      this.regions.set(region.code, region);
      this.regionHealth.set(region.code, {
        code: region.code,
        healthy: true,
        latency: 0,
        errorRate: 0,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
      });
      this.replicationStatus.set(region.code, {
        region: region.code,
        replicationLag: 0,
        lastSync: Date.now(),
        syncState: 'in-sync',
      });
    }

    // Set primary region
    const primary = regions.find(r => r.isPrimary);
    if (!primary) {
      throw new Error('No primary region configured');
    }
    this.activeRegion = primary.code;
    this.secondaryRegions = regions
      .filter(r => !r.isPrimary)
      .sort((a, b) => a.priority - b.priority)
      .map(r => r.code);
  }

  /**
   * Get active region
   */
  getActiveRegion(): RegionCode {
    return this.activeRegion;
  }

  /**
   * Get all regions
   */
  getRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get secondary regions in priority order
   */
  getSecondaryRegions(): RegionCode[] {
    return [...this.secondaryRegions];
  }

  /**
   * Start health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) {
return;
}

    this.healthCheckInterval = setInterval(async () => {
      await this.runHealthChecks();
    }, 30000); // Every 30 seconds

    // Run immediately
    this.runHealthChecks();
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Run health checks for all regions
   */
  private async runHealthChecks(): Promise<void> {
    for (const region of this.regions.values()) {
      const health = await this.checkRegionHealth(region.code);
      this.regionHealth.set(region.code, health);

      // Check if failover needed
      if (region.code === this.activeRegion && !health.healthy) {
        await this.failoverToNextRegion(health);
      }
    }
  }

  /**
   * Check health of specific region
   */
  private async checkRegionHealth(code: RegionCode): Promise<RegionHealth> {
    const region = this.regions.get(code);
    if (!region) {
      throw new Error(`Region ${code} not found`);
    }

    const currentHealth = this.regionHealth.get(code)!;
    const startTime = Date.now();

    try {
      // Simulate health check (in production: actual HTTP/gRPC check)
      const response = await this.performHealthCheck(region.endpoint);

      const latency = Date.now() - startTime;
      const errorRate = response.errorCount / response.totalRequests;

      return {
        code,
        healthy: errorRate < 0.05 && latency < 1000, // < 5% errors and < 1s latency
        latency,
        errorRate,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
      };
    } catch (error) {
      return {
        code,
        healthy: false,
        latency: Date.now() - startTime,
        errorRate: 1.0,
        lastCheck: Date.now(),
        consecutiveFailures: currentHealth.consecutiveFailures + 1,
      };
    }
  }

  /**
   * Perform actual health check (stub)
   */
  private async performHealthCheck(
    endpoint: string
  ): Promise<{ errorCount: number; totalRequests: number }> {
    // In production: implement actual health check to endpoint
    // Example: GET /health with timeout
    return {
      errorCount: Math.random() > 0.95 ? 1 : 0, // Simulate 5% error rate
      totalRequests: 100,
    };
  }

  /**
   * Failover to next region
   */
  private async failoverToNextRegion(failedHealth: RegionHealth): Promise<void> {
    const currentRegion = this.activeRegion;

    // Find next healthy region
    for (const secondary of this.secondaryRegions) {
      const secondaryHealth = this.regionHealth.get(secondary);
      if (secondaryHealth && secondaryHealth.healthy) {
        await this.executeFailover(currentRegion, secondary, 'Region unhealthy');
        return;
      }
    }

    console.error(
      `Failover failed: No healthy secondary regions available. Current region: ${currentRegion}`
    );
  }

  /**
   * Execute failover
   */
  private async executeFailover(
    fromRegion: RegionCode,
    toRegion: RegionCode,
    reason: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Update active region
      this.activeRegion = toRegion;

      // Update secondary regions (move old primary to secondary)
      this.secondaryRegions = this.secondaryRegions.filter(r => r !== toRegion);
      this.secondaryRegions.unshift(fromRegion);

      const duration = Date.now() - startTime;

      const event: FailoverEvent = {
        timestamp: Date.now(),
        fromRegion,
        toRegion,
        reason,
        duration,
      };

      this.failoverHistory.push(event);

      // Trigger callbacks
      for (const callback of this.failoverCallbacks) {
        callback(event);
      }

      console.log(
        `Failover completed: ${fromRegion} → ${toRegion} (${duration}ms): ${reason}`
      );
    } catch (error) {
      console.error(`Failover failed: ${error}`);
      throw error;
    }
  }

  /**
   * Register failover callback
   */
  onFailover(callback: (event: FailoverEvent) => void): void {
    this.failoverCallbacks.push(callback);
  }

  /**
   * Get region health
   */
  getRegionHealth(code: RegionCode): RegionHealth | null {
    return this.regionHealth.get(code) || null;
  }

  /**
   * Get all region health
   */
  getAllRegionHealth(): RegionHealth[] {
    return Array.from(this.regionHealth.values());
  }

  /**
   * Get replication status
   */
  getReplicationStatus(): ReplicationStatus[] {
    return Array.from(this.replicationStatus.values());
  }

  /**
   * Update replication status
   */
  updateReplicationStatus(region: RegionCode, lag: number, syncState: ReplicationStatus['syncState']): void {
    this.replicationStatus.set(region, {
      region,
      replicationLag: lag,
      lastSync: Date.now(),
      syncState,
    });
  }

  /**
   * Get failover history
   */
  getFailoverHistory(limit: number = 50): FailoverEvent[] {
    return this.failoverHistory.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeRegion: RegionCode;
    totalRegions: number;
    healthyRegions: number;
    totalFailovers: number;
    averageFailoverDuration: number;
  } {
    const healthyRegions = Array.from(this.regionHealth.values()).filter(h => h.healthy).length;
    const failovers = this.failoverHistory.length;
    const avgDuration =
      failovers > 0
        ? this.failoverHistory.reduce((sum, f) => sum + f.duration, 0) / failovers
        : 0;

    return {
      activeRegion: this.activeRegion,
      totalRegions: this.regions.size,
      healthyRegions,
      totalFailovers: failovers,
      averageFailoverDuration: avgDuration,
    };
  }
}

// Export singleton
export const regionManager = new RegionManager([
  {
    code: 'us-east-1',
    name: 'US East (N. Virginia)',
    endpoint: 'https://m1-us-east-1.example.com',
    isPrimary: true,
    priority: 1,
    healthCheckInterval: 30000,
  },
  {
    code: 'us-west-2',
    name: 'US West (Oregon)',
    endpoint: 'https://m1-us-west-2.example.com',
    isPrimary: false,
    priority: 2,
    healthCheckInterval: 30000,
  },
  {
    code: 'eu-west-1',
    name: 'EU (Ireland)',
    endpoint: 'https://m1-eu-west-1.example.com',
    isPrimary: false,
    priority: 3,
    healthCheckInterval: 30000,
  },
]);
