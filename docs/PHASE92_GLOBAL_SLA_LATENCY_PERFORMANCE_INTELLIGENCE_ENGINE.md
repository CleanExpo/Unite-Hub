# Phase 92: Global SLA, Latency & Performance Intelligence Engine (GSLPIE)

## Overview

The Global SLA, Latency & Performance Intelligence Engine (GSLPIE) implements a real-time global performance and SLA intelligence layer that measures latency, throughput, uptime, failures, and region performance. GSLPIE dynamically routes tasks to optimal regions, forecasts SLA breaches, and provides global performance insights for multi-region tenants and enterprise clients.

## Database Schema

### Tables

#### gslpie_region_metrics
Live regional performance metrics for latency, throughput, and error rates.

```sql
CREATE TABLE gslpie_region_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  latency_ms NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL DEFAULT 0,
  throughput NUMERIC NOT NULL DEFAULT 0,
  signal_source TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### gslpie_sla_profiles
Defines SLA requirements per tenant, product, or region.

```sql
CREATE TABLE gslpie_sla_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  sla_type TEXT NOT NULL,
  latency_threshold_ms NUMERIC NOT NULL,
  uptime_target NUMERIC NOT NULL DEFAULT 99.9,
  max_error_rate NUMERIC NOT NULL DEFAULT 0.01,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT gslpie_sla_profiles_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

#### gslpie_performance_history
Immutable historical performance snapshots used for forecasting and SLA verification.

```sql
CREATE TABLE gslpie_performance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  latency_ms NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL DEFAULT 0,
  throughput NUMERIC NOT NULL DEFAULT 0,
  uptime NUMERIC NOT NULL DEFAULT 100,
  snapshot_period TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

## TypeScript Service

### GSLPIEEngine.ts

```typescript
import { createClient } from '@supabase/supabase-js';

interface RegionMetric {
  id: string;
  region: string;
  latency_ms: number;
  error_rate: number;
  throughput: number;
  signal_source: string;
  captured_at: string;
}

interface SLAProfile {
  id: string;
  tenant_id: string;
  region: string;
  sla_type: string;
  latency_threshold_ms: number;
  uptime_target: number;
  max_error_rate: number;
}

interface PerformanceSnapshot {
  region: string;
  latency_ms: number;
  error_rate: number;
  throughput: number;
  uptime: number;
  snapshot_period: string;
}

interface SLAForecast {
  region: string;
  breach_probability: number;
  predicted_latency: number;
  predicted_error_rate: number;
  risk_factors: string[];
  recommended_actions: string[];
}

interface RouteDecision {
  primary_region: string;
  fallback_region: string;
  reason: string;
  latency_score: number;
  reliability_score: number;
}

export class GSLPIEEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Capture performance metrics for a region
   */
  async captureMetrics(
    region: string,
    metrics: {
      latency_ms: number;
      error_rate: number;
      throughput: number;
      signal_source: string;
    }
  ): Promise<void> {
    await this.supabase.from('gslpie_region_metrics').insert({
      region,
      latency_ms: metrics.latency_ms,
      error_rate: metrics.error_rate,
      throughput: metrics.throughput,
      signal_source: metrics.signal_source,
      captured_at: new Date().toISOString()
    });
  }

  /**
   * Analyse performance for a region over a time window
   */
  async analysePerformance(
    region: string,
    windowMinutes: number = 60
  ): Promise<{
    avg_latency: number;
    p95_latency: number;
    p99_latency: number;
    avg_error_rate: number;
    avg_throughput: number;
    trend: 'improving' | 'stable' | 'degrading';
    anomalies: string[];
  }> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { data: metrics } = await this.supabase
      .from('gslpie_region_metrics')
      .select('*')
      .eq('region', region)
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: true });

    if (!metrics || metrics.length === 0) {
      return {
        avg_latency: 0,
        p95_latency: 0,
        p99_latency: 0,
        avg_error_rate: 0,
        avg_throughput: 0,
        trend: 'stable',
        anomalies: []
      };
    }

    const latencies = metrics.map(m => m.latency_ms).sort((a, b) => a - b);
    const avg_latency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95_latency = latencies[Math.floor(latencies.length * 0.95)] || avg_latency;
    const p99_latency = latencies[Math.floor(latencies.length * 0.99)] || p95_latency;

    const avg_error_rate = metrics.reduce((sum, m) => sum + m.error_rate, 0) / metrics.length;
    const avg_throughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;

    // Determine trend
    const halfPoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, halfPoint);
    const secondHalf = metrics.slice(halfPoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.latency_ms, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.latency_ms, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondAvg < firstAvg * 0.9) trend = 'improving';
    else if (secondAvg > firstAvg * 1.1) trend = 'degrading';

    // Detect anomalies
    const anomalies: string[] = [];
    const stdDev = Math.sqrt(
      latencies.reduce((sum, l) => sum + Math.pow(l - avg_latency, 2), 0) / latencies.length
    );

    metrics.forEach(m => {
      if (m.latency_ms > avg_latency + 3 * stdDev) {
        anomalies.push(`Latency spike at ${m.captured_at}: ${m.latency_ms}ms`);
      }
      if (m.error_rate > avg_error_rate * 3) {
        anomalies.push(`Error rate spike at ${m.captured_at}: ${(m.error_rate * 100).toFixed(2)}%`);
      }
    });

    return {
      avg_latency,
      p95_latency,
      p99_latency,
      avg_error_rate,
      avg_throughput,
      trend,
      anomalies
    };
  }

  /**
   * Forecast potential SLA breaches
   */
  async forecastSLA(tenantId: string, region: string): Promise<SLAForecast> {
    // Get SLA profile
    const { data: profile } = await this.supabase
      .from('gslpie_sla_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('region', region)
      .single();

    // Get current performance
    const performance = await this.analysePerformance(region, 60);

    // Get historical trends
    const { data: history } = await this.supabase
      .from('gslpie_performance_history')
      .select('*')
      .eq('region', region)
      .order('captured_at', { ascending: false })
      .limit(24);

    const risk_factors: string[] = [];
    const recommended_actions: string[] = [];

    // Calculate breach probability
    let breach_probability = 0;

    if (profile) {
      // Latency breach risk
      if (performance.avg_latency > profile.latency_threshold_ms * 0.8) {
        breach_probability += 0.3;
        risk_factors.push(`Latency at ${(performance.avg_latency / profile.latency_threshold_ms * 100).toFixed(0)}% of threshold`);
        recommended_actions.push('Consider routing to alternate region');
      }

      // Error rate breach risk
      if (performance.avg_error_rate > profile.max_error_rate * 0.7) {
        breach_probability += 0.3;
        risk_factors.push(`Error rate at ${(performance.avg_error_rate / profile.max_error_rate * 100).toFixed(0)}% of threshold`);
        recommended_actions.push('Investigate error sources');
      }

      // Trend-based risk
      if (performance.trend === 'degrading') {
        breach_probability += 0.2;
        risk_factors.push('Performance trend is degrading');
        recommended_actions.push('Scale resources or optimize workload');
      }
    }

    // Historical pattern analysis
    if (history && history.length > 0) {
      const avgHistoricalLatency = history.reduce((sum, h) => sum + h.latency_ms, 0) / history.length;
      if (performance.avg_latency > avgHistoricalLatency * 1.5) {
        breach_probability += 0.2;
        risk_factors.push('Current latency significantly higher than historical average');
      }
    }

    return {
      region,
      breach_probability: Math.min(breach_probability, 1),
      predicted_latency: performance.p95_latency * 1.1,
      predicted_error_rate: performance.avg_error_rate * 1.1,
      risk_factors,
      recommended_actions
    };
  }

  /**
   * Route to optimal region based on current performance
   */
  async routeToOptimalRegion(
    tenantId: string,
    preferredRegions: string[]
  ): Promise<RouteDecision> {
    const regionScores: Array<{
      region: string;
      latency_score: number;
      reliability_score: number;
      total_score: number;
    }> = [];

    for (const region of preferredRegions) {
      const performance = await this.analysePerformance(region, 30);

      // Calculate latency score (lower is better, inverted to 0-100)
      const latency_score = Math.max(0, 100 - (performance.avg_latency / 10));

      // Calculate reliability score
      const reliability_score = (1 - performance.avg_error_rate) * 100;

      // Combined score (weighted)
      const total_score = latency_score * 0.6 + reliability_score * 0.4;

      regionScores.push({
        region,
        latency_score,
        reliability_score,
        total_score
      });
    }

    // Sort by total score
    regionScores.sort((a, b) => b.total_score - a.total_score);

    const primary = regionScores[0];
    const fallback = regionScores[1] || regionScores[0];

    return {
      primary_region: primary.region,
      fallback_region: fallback.region,
      reason: `${primary.region} has best combined score (${primary.total_score.toFixed(1)})`,
      latency_score: primary.latency_score,
      reliability_score: primary.reliability_score
    };
  }

  /**
   * Trigger failover to alternate region
   */
  async triggerFailover(
    tenantId: string,
    fromRegion: string,
    reason: string
  ): Promise<{
    success: boolean;
    target_region: string;
    failover_time_ms: number;
    actions_taken: string[];
  }> {
    const startTime = Date.now();
    const actions_taken: string[] = [];

    // Get available regions excluding failed one
    const { data: profiles } = await this.supabase
      .from('gslpie_sla_profiles')
      .select('region')
      .eq('tenant_id', tenantId)
      .neq('region', fromRegion);

    if (!profiles || profiles.length === 0) {
      return {
        success: false,
        target_region: fromRegion,
        failover_time_ms: Date.now() - startTime,
        actions_taken: ['No alternate regions available']
      };
    }

    const alternateRegions = profiles.map(p => p.region);
    const routeDecision = await this.routeToOptimalRegion(tenantId, alternateRegions);

    actions_taken.push(`Selected ${routeDecision.primary_region} as failover target`);
    actions_taken.push(`Reason: ${reason}`);
    actions_taken.push(`Fallback: ${routeDecision.fallback_region}`);

    // Log failover event
    await this.captureMetrics(fromRegion, {
      latency_ms: 0,
      error_rate: 1,
      throughput: 0,
      signal_source: 'failover_trigger'
    });

    return {
      success: true,
      target_region: routeDecision.primary_region,
      failover_time_ms: Date.now() - startTime,
      actions_taken
    };
  }

  /**
   * Get global performance overview
   */
  async getGlobalOverview(): Promise<{
    regions: Array<{
      region: string;
      status: 'healthy' | 'warning' | 'critical';
      avg_latency: number;
      error_rate: number;
      throughput: number;
    }>;
    global_health_score: number;
  }> {
    const { data: allMetrics } = await this.supabase
      .from('gslpie_region_metrics')
      .select('region')
      .gte('captured_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    const uniqueRegions = [...new Set(allMetrics?.map(m => m.region) || [])];
    const regions: Array<{
      region: string;
      status: 'healthy' | 'warning' | 'critical';
      avg_latency: number;
      error_rate: number;
      throughput: number;
    }> = [];

    for (const region of uniqueRegions) {
      const perf = await this.analysePerformance(region, 60);

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (perf.avg_error_rate > 0.05 || perf.avg_latency > 1000) {
        status = 'critical';
      } else if (perf.avg_error_rate > 0.01 || perf.avg_latency > 500) {
        status = 'warning';
      }

      regions.push({
        region,
        status,
        avg_latency: perf.avg_latency,
        error_rate: perf.avg_error_rate,
        throughput: perf.avg_throughput
      });
    }

    // Calculate global health score
    const healthyCount = regions.filter(r => r.status === 'healthy').length;
    const global_health_score = regions.length > 0
      ? (healthyCount / regions.length) * 100
      : 100;

    return { regions, global_health_score };
  }

  /**
   * Create performance snapshot for history
   */
  async createSnapshot(region: string, period: string): Promise<void> {
    const performance = await this.analysePerformance(region, 60);

    // Calculate uptime based on error rate
    const uptime = (1 - performance.avg_error_rate) * 100;

    await this.supabase.from('gslpie_performance_history').insert({
      region,
      latency_ms: performance.avg_latency,
      error_rate: performance.avg_error_rate,
      throughput: performance.avg_throughput,
      uptime,
      snapshot_period: period,
      captured_at: new Date().toISOString()
    });
  }
}

export const gslpieEngine = new GSLPIEEngine();
```

## API Endpoints

### POST /api/gslpie/capture
Capture performance metrics for a region.

### GET /api/gslpie/analyse/:region
Analyse performance for a specific region.

### GET /api/gslpie/forecast/:tenantId/:region
Forecast SLA breach probability.

### POST /api/gslpie/route
Route to optimal region based on performance.

### POST /api/gslpie/failover
Trigger failover to alternate region.

### GET /api/gslpie/overview
Get global performance overview.

## Integration Points

### RAAOE Integration
- RAAOE requests optimal region routing from GSLPIE
- SLA profiles inform regional operational adjustments
- Performance metrics influence safety thresholds

### ASRS Integration
- Performance degradation triggers safety alerts
- Error rate spikes escalate to ASRS
- Latency anomalies treated as safety signals

### UPEWE Integration
- Latency metrics fed as predictive signals
- Performance forecasts inform early warnings
- Historical data enables trend prediction

### AIRE Integration
- SLA breaches trigger incident creation
- Failover actions logged as remediation
- Performance recovery tracked

### SORIE Integration
- Performance insights influence strategic objectives
- Regional performance affects roadmap priorities
- SLA adherence tracked as KPI

## CLI Commands

```bash
# Get region metrics
unite gslp:region-metrics --region eu --window 60

# View SLA profiles
unite gslp:sla --tenant-id <uuid>

# Forecast SLA breach
unite gslp:forecast --tenant-id <uuid> --region us

# Route to optimal region
unite gslp:route --regions eu,us,apac
```

## Dashboard Components

### Live Latency Map
Global map showing real-time latency by region with color coding:
- Green: < 100ms
- Yellow: 100-500ms
- Red: > 500ms

### SLA Adherence Graph
Time-series graph showing:
- Actual latency vs SLA threshold
- Error rate vs maximum allowed
- Uptime percentage

### Region Routing Matrix
Table showing:
- Current routing decisions
- Primary and fallback regions
- Score breakdowns

### Outage Detector
Alert panel showing:
- Active outages by region
- Failover status
- Recovery time estimates

## Performance Monitoring Flow

```
1. Service Operation Completes
   ↓
2. Metrics Captured (latency, errors, throughput)
   ↓
3. GSLPIE Analyses Performance
   ↓
4. SLA Forecast Generated
   │
   ├─→ [Breach Probability > 0.7] → Trigger Alert
   │                              → Notify ASRS
   │                              → Consider Failover
   │
   └─→ [Breach Probability < 0.3] → Continue Monitoring
   ↓
5. Routing Decisions Updated
   ↓
6. RAAOE Receives Optimal Routing
   ↓
7. Next Operations Routed Accordingly
```

## SLA Types

- **standard**: Default SLA for general operations
- **premium**: Enhanced SLA for priority tenants
- **enterprise**: Strict SLA for enterprise clients
- **critical**: Ultra-strict SLA for mission-critical operations

## Migration

See `supabase/migrations/144_global_sla_latency_performance_intelligence_engine.sql`
