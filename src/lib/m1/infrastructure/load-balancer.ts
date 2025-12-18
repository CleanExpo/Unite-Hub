/**
 * M1 Load Balancer
 *
 * Geographic load balancing with latency-based routing
 *
 * Version: v2.4.0
 * Phase: 11A - Multi-region Support
 */

import { RegionCode } from './region-manager';

export interface LoadBalancerRequest {
  requestId: string;
  clientIP: string;
  clientLocation?: string;
  timestamp: number;
}

export interface RoutingDecision {
  region: RegionCode;
  latencyEstimate: number;
  reason: string;
}

export interface LoadBalancerStats {
  totalRequests: number;
  requestsByRegion: Record<RegionCode, number>;
  averageLatency: number;
  routingStrategies: {
    geolocation: number;
    latency: number;
    roundRobin: number;
  };
}

/**
 * Load Balancer with multiple routing strategies
 */
export class LoadBalancer {
  private requestCount: number = 0;
  private requestsByRegion: Map<RegionCode, number> = new Map();
  private latencyHistory: Map<RegionCode, number[]> = new Map();
  private routingStats = {
    geolocation: 0,
    latency: 0,
    roundRobin: 0,
  };
  private roundRobinIndex: number = 0;

  constructor(private regions: RegionCode[]) {
    for (const region of regions) {
      this.requestsByRegion.set(region, 0);
      this.latencyHistory.set(region, []);
    }
  }

  /**
   * Route request to optimal region (latency-based)
   */
  routeRequestLatencyBased(request: LoadBalancerRequest): RoutingDecision {
    // Find region with lowest average latency
    let bestRegion = this.regions[0];
    let bestLatency = Infinity;

    for (const region of this.regions) {
      const history = this.latencyHistory.get(region) || [];
      const avgLatency = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;

      if (avgLatency < bestLatency) {
        bestLatency = avgLatency;
        bestRegion = region;
      }
    }

    this.recordRouting(bestRegion, 'latency');

    return {
      region: bestRegion,
      latencyEstimate: bestLatency,
      reason: `Lowest average latency: ${bestLatency.toFixed(2)}ms`,
    };
  }

  /**
   * Route request by geolocation
   */
  routeRequestGeolocation(clientLocation: string): RoutingDecision {
    // Map locations to regions
    const locationToRegion: Record<string, RegionCode> = {
      'US': 'us-east-1',
      'US-WEST': 'us-west-2',
      'EU': 'eu-west-1',
      'ASIA-SE': 'ap-southeast-1',
      'ASIA-NE': 'ap-northeast-1',
    };

    const region = locationToRegion[clientLocation] || this.regions[0];
    this.recordRouting(region, 'geolocation');

    return {
      region,
      latencyEstimate: 0,
      reason: `Geolocation-based routing for ${clientLocation}`,
    };
  }

  /**
   * Route request using round-robin
   */
  routeRequestRoundRobin(): RoutingDecision {
    const region = this.regions[this.roundRobinIndex % this.regions.length];
    this.roundRobinIndex++;
    this.recordRouting(region, 'roundRobin');

    return {
      region,
      latencyEstimate: 0,
      reason: 'Round-robin distribution',
    };
  }

  /**
   * Record actual latency for a request
   */
  recordLatency(region: RegionCode, latencyMs: number): void {
    const history = this.latencyHistory.get(region);
    if (history) {
      history.push(latencyMs);
      // Keep last 100 measurements
      if (history.length > 100) {
        history.shift();
      }
    }
  }

  /**
   * Record routing decision
   */
  private recordRouting(region: RegionCode, strategy: 'geolocation' | 'latency' | 'roundRobin'): void {
    this.requestCount++;
    const count = (this.requestsByRegion.get(region) || 0) + 1;
    this.requestsByRegion.set(region, count);
    this.routingStats[strategy]++;
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const regionStats: Record<RegionCode, number> = {} as Record<RegionCode, number>;
    for (const [region, count] of this.requestsByRegion) {
      regionStats[region] = count;
    }

    let totalLatency = 0;
    let latencyCount = 0;

    for (const history of this.latencyHistory.values()) {
      totalLatency += history.reduce((a, b) => a + b, 0);
      latencyCount += history.length;
    }

    return {
      totalRequests: this.requestCount,
      requestsByRegion: regionStats,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      routingStrategies: { ...this.routingStats },
    };
  }

  /**
   * Get region load (requests per region)
   */
  getRegionLoad(): Record<RegionCode, number> {
    const load: Record<RegionCode, number> = {} as Record<RegionCode, number>;
    for (const [region, count] of this.requestsByRegion) {
      load[region] = count;
    }
    return load;
  }

  /**
   * Get region average latency
   */
  getRegionLatency(region: RegionCode): number {
    const history = this.latencyHistory.get(region);
    if (!history || history.length === 0) {
return 0;
}
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0;
    this.requestsByRegion.clear();
    this.latencyHistory.clear();
    this.routingStats = { geolocation: 0, latency: 0, roundRobin: 0 };
    this.roundRobinIndex = 0;

    for (const region of this.regions) {
      this.requestsByRegion.set(region, 0);
      this.latencyHistory.set(region, []);
    }
  }
}

// Export singleton
export const loadBalancer = new LoadBalancer(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1']);
