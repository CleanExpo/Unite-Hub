# Phase 93: Autonomous Global Load Balancing & Agent Scaling Engine (AGLBASE)

## Overview

The Autonomous Global Load Balancing & Agent Scaling Engine (AGLBASE) implements an autonomous load balancing and agent scaling engine that uses global performance, SLA, and region profiles to automatically scale agent pools up/down and route workloads across regions while respecting regulatory, regional, and SLA constraints.

## Database Schema

### Tables

#### aglbase_agent_pools
Defines agent capacity targets and scaling bounds per region, agent type, and tenant scope.

```sql
CREATE TABLE aglbase_agent_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  desired_capacity INTEGER NOT NULL DEFAULT 1,
  scaling_policy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aglbase_agent_pools_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

#### aglbase_scaling_events
Logs all automatic and manual scaling actions for audit and forecasting.

```sql
CREATE TABLE aglbase_scaling_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  previous_capacity INTEGER NOT NULL,
  new_capacity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aglbase_scaling_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

#### aglbase_routing_decisions
Records routing choices made for workloads across regions and agent pools.

```sql
CREATE TABLE aglbase_routing_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  workload_type TEXT NOT NULL,
  selected_region TEXT NOT NULL,
  decision_reason TEXT NOT NULL,
  sla_context JSONB DEFAULT '{}'::jsonb,
  performance_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aglbase_routing_decisions_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## TypeScript Service

### AGLBASEngine.ts

```typescript
import { createClient } from '@supabase/supabase-js';

interface AgentPool {
  id: string;
  tenant_id: string;
  region: string;
  agent_type: string;
  min_capacity: number;
  max_capacity: number;
  desired_capacity: number;
  scaling_policy: {
    scale_up_threshold: number;
    scale_down_threshold: number;
    cooldown_seconds: number;
    increment: number;
  };
}

interface ScalingPlan {
  pool_id: string;
  current_capacity: number;
  target_capacity: number;
  reason: string;
  should_scale: boolean;
}

interface RoutingDecision {
  tenant_id: string;
  region: string;
  agent_type: string;
  workload_type: string;
  selected_region: string;
  decision_reason: string;
  sla_context: Record<string, any>;
  performance_context: Record<string, any>;
}

export class AGLBASEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Assess current capacity across all pools for a tenant
   */
  async assessCapacity(tenantId: string): Promise<{
    pools: Array<{
      pool_id: string;
      region: string;
      agent_type: string;
      current: number;
      min: number;
      max: number;
      utilization: number;
      status: 'under' | 'optimal' | 'over';
    }>;
    overall_health: number;
  }> {
    const { data: pools } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!pools || pools.length === 0) {
      return { pools: [], overall_health: 100 };
    }

    const assessedPools = await Promise.all(
      pools.map(async (pool) => {
        // Get recent metrics from GSLPIE
        const { data: metrics } = await this.supabase
          .from('gslpie_region_metrics')
          .select('throughput')
          .eq('region', pool.region)
          .gte('captured_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .order('captured_at', { ascending: false })
          .limit(10);

        const avgThroughput = metrics && metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length
          : 0;

        // Calculate utilization (throughput per capacity unit)
        const utilization = pool.desired_capacity > 0
          ? (avgThroughput / pool.desired_capacity) * 100
          : 0;

        let status: 'under' | 'optimal' | 'over' = 'optimal';
        if (utilization > 80) status = 'over';
        else if (utilization < 30) status = 'under';

        return {
          pool_id: pool.id,
          region: pool.region,
          agent_type: pool.agent_type,
          current: pool.desired_capacity,
          min: pool.min_capacity,
          max: pool.max_capacity,
          utilization,
          status
        };
      })
    );

    const optimalCount = assessedPools.filter(p => p.status === 'optimal').length;
    const overall_health = (optimalCount / assessedPools.length) * 100;

    return { pools: assessedPools, overall_health };
  }

  /**
   * Plan scaling actions based on current metrics and policies
   */
  async planScaling(tenantId: string, poolId: string): Promise<ScalingPlan> {
    const { data: pool } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('id', poolId)
      .eq('tenant_id', tenantId)
      .single();

    if (!pool) {
      throw new Error('Pool not found');
    }

    const policy = pool.scaling_policy || {
      scale_up_threshold: 80,
      scale_down_threshold: 30,
      cooldown_seconds: 300,
      increment: 1
    };

    // Check cooldown
    const { data: recentEvents } = await this.supabase
      .from('aglbase_scaling_events')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('region', pool.region)
      .eq('agent_type', pool.agent_type)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentEvents && recentEvents.length > 0) {
      const lastScale = new Date(recentEvents[0].created_at).getTime();
      const cooldownMs = policy.cooldown_seconds * 1000;
      if (Date.now() - lastScale < cooldownMs) {
        return {
          pool_id: poolId,
          current_capacity: pool.desired_capacity,
          target_capacity: pool.desired_capacity,
          reason: 'In cooldown period',
          should_scale: false
        };
      }
    }

    // Get utilization metrics
    const { data: metrics } = await this.supabase
      .from('gslpie_region_metrics')
      .select('throughput, error_rate')
      .eq('region', pool.region)
      .gte('captured_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (!metrics || metrics.length === 0) {
      return {
        pool_id: poolId,
        current_capacity: pool.desired_capacity,
        target_capacity: pool.desired_capacity,
        reason: 'No metrics available',
        should_scale: false
      };
    }

    const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
    const utilization = pool.desired_capacity > 0
      ? (avgThroughput / pool.desired_capacity) * 100
      : 0;

    let target_capacity = pool.desired_capacity;
    let reason = 'No scaling needed';
    let should_scale = false;

    if (utilization > policy.scale_up_threshold && pool.desired_capacity < pool.max_capacity) {
      target_capacity = Math.min(pool.desired_capacity + policy.increment, pool.max_capacity);
      reason = `Utilization ${utilization.toFixed(1)}% exceeds threshold ${policy.scale_up_threshold}%`;
      should_scale = true;
    } else if (utilization < policy.scale_down_threshold && pool.desired_capacity > pool.min_capacity) {
      target_capacity = Math.max(pool.desired_capacity - policy.increment, pool.min_capacity);
      reason = `Utilization ${utilization.toFixed(1)}% below threshold ${policy.scale_down_threshold}%`;
      should_scale = true;
    }

    return {
      pool_id: poolId,
      current_capacity: pool.desired_capacity,
      target_capacity,
      reason,
      should_scale
    };
  }

  /**
   * Apply scaling action to a pool
   */
  async applyScaling(
    tenantId: string,
    poolId: string,
    newCapacity: number,
    reason: string,
    triggerSource: string
  ): Promise<void> {
    const { data: pool } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('id', poolId)
      .eq('tenant_id', tenantId)
      .single();

    if (!pool) {
      throw new Error('Pool not found');
    }

    // Validate capacity bounds
    const validCapacity = Math.max(pool.min_capacity, Math.min(newCapacity, pool.max_capacity));

    // Update pool
    await this.supabase
      .from('aglbase_agent_pools')
      .update({
        desired_capacity: validCapacity,
        updated_at: new Date().toISOString()
      })
      .eq('id', poolId);

    // Log scaling event
    await this.supabase.from('aglbase_scaling_events').insert({
      tenant_id: tenantId,
      region: pool.region,
      agent_type: pool.agent_type,
      previous_capacity: pool.desired_capacity,
      new_capacity: validCapacity,
      reason,
      trigger_source: triggerSource,
      metadata: {
        min_capacity: pool.min_capacity,
        max_capacity: pool.max_capacity
      }
    });
  }

  /**
   * Select optimal region for a workload
   */
  async selectRegionForWorkload(
    tenantId: string,
    workloadType: string,
    agentType: string,
    preferredRegions: string[]
  ): Promise<RoutingDecision> {
    // Get region profiles from RAAOE
    const { data: regionProfiles } = await this.supabase
      .from('raaoe_region_profiles')
      .select('*')
      .in('region', preferredRegions);

    // Get GRH compliance constraints
    const { data: tenantRegion } = await this.supabase
      .from('raaoe_tenant_regions')
      .select('region, config_overrides')
      .eq('tenant_id', tenantId)
      .single();

    // Get performance metrics from GSLPIE
    const regionScores: Array<{
      region: string;
      score: number;
      latency: number;
      available_capacity: number;
      compliance_ok: boolean;
    }> = [];

    for (const region of preferredRegions) {
      // Check compliance
      const { data: grhPolicy } = await this.supabase
        .from('grh_region_policies')
        .select('policy_body')
        .eq('tenant_id', tenantId)
        .eq('region', region)
        .single();

      const compliance_ok = !grhPolicy?.policy_body?.restricted_workloads?.includes(workloadType);

      if (!compliance_ok) continue;

      // Get latency
      const { data: metrics } = await this.supabase
        .from('gslpie_region_metrics')
        .select('latency_ms')
        .eq('region', region)
        .order('captured_at', { ascending: false })
        .limit(10);

      const avgLatency = metrics && metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.latency_ms, 0) / metrics.length
        : 1000;

      // Get available capacity
      const { data: pool } = await this.supabase
        .from('aglbase_agent_pools')
        .select('desired_capacity, max_capacity')
        .eq('tenant_id', tenantId)
        .eq('region', region)
        .eq('agent_type', agentType)
        .single();

      const available_capacity = pool
        ? pool.max_capacity - pool.desired_capacity
        : 0;

      // Calculate score
      const latencyScore = Math.max(0, 100 - avgLatency / 10);
      const capacityScore = available_capacity * 10;
      const score = latencyScore * 0.6 + capacityScore * 0.4;

      regionScores.push({
        region,
        score,
        latency: avgLatency,
        available_capacity,
        compliance_ok
      });
    }

    if (regionScores.length === 0) {
      throw new Error('No compliant regions available');
    }

    // Sort by score
    regionScores.sort((a, b) => b.score - a.score);
    const selected = regionScores[0];

    const decision: RoutingDecision = {
      tenant_id: tenantId,
      region: tenantRegion?.region || 'global',
      agent_type: agentType,
      workload_type: workloadType,
      selected_region: selected.region,
      decision_reason: `Best score ${selected.score.toFixed(1)} (latency: ${selected.latency.toFixed(0)}ms, capacity: ${selected.available_capacity})`,
      sla_context: {
        preferred_regions: preferredRegions
      },
      performance_context: {
        latency: selected.latency,
        available_capacity: selected.available_capacity
      }
    };

    // Record the decision
    await this.recordRoutingDecision(decision);

    return decision;
  }

  /**
   * Rebalance load across all regions
   */
  async rebalanceLoad(tenantId: string): Promise<{
    rebalanced: number;
    actions: string[];
  }> {
    const actions: string[] = [];

    const { data: pools } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!pools || pools.length === 0) {
      return { rebalanced: 0, actions: ['No pools to rebalance'] };
    }

    // Group by agent type
    const poolsByType = pools.reduce((acc, pool) => {
      if (!acc[pool.agent_type]) acc[pool.agent_type] = [];
      acc[pool.agent_type].push(pool);
      return acc;
    }, {} as Record<string, typeof pools>);

    let rebalanced = 0;

    for (const [agentType, typePools] of Object.entries(poolsByType)) {
      // Calculate total and average capacity
      const totalCapacity = typePools.reduce((sum, p) => sum + p.desired_capacity, 0);
      const avgCapacity = totalCapacity / typePools.length;

      for (const pool of typePools) {
        const diff = pool.desired_capacity - avgCapacity;
        if (Math.abs(diff) > 1) {
          const targetCapacity = Math.round(avgCapacity);
          const validCapacity = Math.max(pool.min_capacity, Math.min(targetCapacity, pool.max_capacity));

          if (validCapacity !== pool.desired_capacity) {
            await this.applyScaling(
              tenantId,
              pool.id,
              validCapacity,
              `Rebalancing from ${pool.desired_capacity} to ${validCapacity}`,
              'rebalance'
            );
            rebalanced++;
            actions.push(`${pool.region}/${agentType}: ${pool.desired_capacity} → ${validCapacity}`);
          }
        }
      }
    }

    return { rebalanced, actions };
  }

  /**
   * Record a routing decision for audit
   */
  async recordRoutingDecision(decision: RoutingDecision): Promise<void> {
    await this.supabase.from('aglbase_routing_decisions').insert(decision);
  }
}

export const aglbasEngine = new AGLBASEngine();
```

## API Endpoints

### GET /api/aglbase/pools
List all agent pools for a tenant.

### POST /api/aglbase/scale
Apply scaling action to a pool.

### GET /api/aglbase/capacity
Assess capacity across all pools.

### POST /api/aglbase/route
Select optimal region for workload.

### POST /api/aglbase/rebalance
Rebalance load across regions.

### GET /api/aglbase/routing/:id
Inspect a routing decision.

## Integration Points

### GSLPIE Integration
- Uses real-time region metrics for scaling decisions
- Latency data informs routing choices
- Performance history enables capacity forecasting

### RAAOE Integration
- Region profiles influence capacity bounds
- SLA modes affect scaling thresholds
- Regional constraints respected in routing

### MAOS Integration
- Orchestrator uses AGLBASE for region+agent selection
- All orchestrator_runs routed through AGLBASE
- Capacity considered before dispatching

### Voice-First Layer Integration
- Low-latency routing for voice commands
- Regional voice processing preferences
- Capacity reserved for voice workloads

### ADRE Integration
- Heavy refactor jobs routed appropriately
- GRH regulatory constraints respected
- Capacity scaled for large operations

### GRH-RAPE Integration
- No cross-border routing where prohibited
- Compliance boundaries enforced
- Regional policies checked before routing

### EGCBI Integration
- Scaling actions tracked for governance
- Board reports include capacity metrics
- Compliance status affects routing

## CLI Commands

```bash
# List agent pools
unite aglb:pools --tenant-id <uuid>

# Scale a pool
unite aglb:scale <pool_id> --capacity 5 --reason "Manual scale"

# Inspect routing decision
unite aglb:routing:inspect <decision_id>

# Rebalance load
unite aglb:rebalance --tenant-id <uuid>
```

## Dashboard Components

### Agent Pool View
Table showing all pools with:
- Region and agent type
- Current/min/max capacity
- Utilization percentage
- Health status

### Scaling History Timeline
Time-series graph showing:
- Scaling events over time
- Capacity changes by region
- Trigger sources

### Routing Decision Explorer
Searchable list of routing decisions with:
- Workload type and agent type
- Selected region and reason
- SLA and performance context

### SLA-Capacity Alignment View
Visualization showing:
- SLA requirements vs available capacity
- Gap analysis by region
- Recommended actions

## Scaling Strategies

### Reactive Scaling
- Monitor utilization metrics
- Scale up when threshold exceeded
- Scale down during low utilization
- Respect cooldown periods

### Predictive Scaling
- Use GSLPIE historical data
- Forecast demand patterns
- Pre-scale before peaks
- Integrate with UPEWE predictions

### Policy-Based Scaling
- Define per-pool policies
- Custom thresholds and increments
- Region-specific bounds
- Compliance constraints

## Safety Constraints

- AGLBASE cannot override ASRS safety decisions
- Scaling respects GRH regulatory boundaries
- Cross-region routing only where allowed
- All actions logged for audit
- Compliance checks before routing

## Migration

See `supabase/migrations/145_autonomous_global_load_balancing_agent_scaling_engine.sql`
