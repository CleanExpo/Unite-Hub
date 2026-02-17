// AGLBASE - Autonomous Global Load Balancing & Agent Scaling Engine (Phase 93)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class AGLBASEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  async assessCapacity(tenantId: string): Promise<{
    pools: any[];
    overall_health: number;
  }> {
    const { data: pools } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!pools || pools.length === 0) {
      return { pools: [], overall_health: 100 };
    }

    const assessed = pools.map(pool => {
      const utilization = (pool.desired_capacity / pool.max_capacity) * 100;
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
    });

    const optimalCount = assessed.filter(p => p.status === 'optimal').length;
    const overall_health = (optimalCount / assessed.length) * 100;

    return { pools: assessed, overall_health };
  }

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

    if (!pool) throw new Error('Pool not found');

    const validCapacity = Math.max(pool.min_capacity, Math.min(newCapacity, pool.max_capacity));

    await this.supabase
      .from('aglbase_agent_pools')
      .update({ desired_capacity: validCapacity, updated_at: new Date().toISOString() })
      .eq('id', poolId);

    await this.supabase.from('aglbase_scaling_events').insert({
      tenant_id: tenantId,
      region: pool.region,
      agent_type: pool.agent_type,
      previous_capacity: pool.desired_capacity,
      new_capacity: validCapacity,
      reason,
      trigger_source: triggerSource
    });
  }

  async selectRegionForWorkload(
    tenantId: string,
    workloadType: string,
    agentType: string,
    preferredRegions: string[]
  ): Promise<{ region: string; reason: string }> {
    let bestRegion = preferredRegions[0];
    let bestScore = 0;

    for (const region of preferredRegions) {
      const { data: pool } = await this.supabase
        .from('aglbase_agent_pools')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('region', region)
        .eq('agent_type', agentType)
        .single();

      if (pool) {
        const available = pool.max_capacity - pool.desired_capacity;
        const score = available * 10;
        if (score > bestScore) {
          bestScore = score;
          bestRegion = region;
        }
      }
    }

    await this.supabase.from('aglbase_routing_decisions').insert({
      tenant_id: tenantId,
      region: bestRegion,
      agent_type: agentType,
      workload_type: workloadType,
      selected_region: bestRegion,
      decision_reason: `Best capacity score: ${bestScore}`,
      sla_context: { preferred_regions: preferredRegions },
      performance_context: { score: bestScore }
    });

    return { region: bestRegion, reason: `Best capacity score: ${bestScore}` };
  }

  async rebalanceLoad(tenantId: string): Promise<{ rebalanced: number; actions: string[] }> {
    const { data: pools } = await this.supabase
      .from('aglbase_agent_pools')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!pools || pools.length === 0) {
      return { rebalanced: 0, actions: [] };
    }

    const actions: string[] = [];
    let rebalanced = 0;

    const totalCapacity = pools.reduce((sum, p) => sum + p.desired_capacity, 0);
    const avgCapacity = totalCapacity / pools.length;

    for (const pool of pools) {
      const target = Math.round(avgCapacity);
      const valid = Math.max(pool.min_capacity, Math.min(target, pool.max_capacity));

      if (valid !== pool.desired_capacity) {
        await this.applyScaling(tenantId, pool.id, valid, 'Rebalancing', 'rebalance');
        actions.push(`${pool.region}/${pool.agent_type}: ${pool.desired_capacity} → ${valid}`);
        rebalanced++;
      }
    }

    return { rebalanced, actions };
  }
}

export const aglbasEngine = new AGLBASEngine();
