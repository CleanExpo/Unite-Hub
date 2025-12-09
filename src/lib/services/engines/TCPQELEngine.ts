// TCPQEL - Tenant Commercial Plans, Quotas & Engine Licensing (Phase 94)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class TCPQELEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkQuota(
    tenantId: string,
    engine: string,
    amount: number
  ): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('*, tcpqel_plans(*)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    if (!tenantPlan) {
      return { allowed: false, remaining: 0, reason: 'No active plan' };
    }

    const limits = tenantPlan.tcpqel_plans?.usage_limits || {};
    const usage = tenantPlan.quota_usage || {};
    const limit = limits[engine] || 0;
    const used = usage[engine] || 0;
    const remaining = limit - used;

    if (amount > remaining) {
      return { allowed: false, remaining, reason: 'Quota exceeded' };
    }

    return { allowed: true, remaining: remaining - amount };
  }

  async allocatePlan(tenantId: string, planId: string): Promise<void> {
    // Deactivate current plan
    await this.supabase
      .from('tcpqel_tenant_plans')
      .update({ active: false })
      .eq('tenant_id', tenantId);

    // Create new plan allocation
    await this.supabase.from('tcpqel_tenant_plans').insert({
      tenant_id: tenantId,
      plan_id: planId,
      active: true,
      quota_usage: {}
    });
  }

  async chargeUsage(tenantId: string, engine: string, amount: number): Promise<void> {
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('id, quota_usage')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    if (!tenantPlan) {
return;
}

    const usage = tenantPlan.quota_usage || {};
    usage[engine] = (usage[engine] || 0) + amount;

    await this.supabase
      .from('tcpqel_tenant_plans')
      .update({ quota_usage: usage })
      .eq('id', tenantPlan.id);
  }

  async isEngineLicensed(tenantId: string, engineName: string): Promise<boolean> {
    // Check plan includes engine
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('tcpqel_plans(included_engines)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    const included = tenantPlan?.tcpqel_plans?.included_engines || [];
    if (included.includes('all') || included.includes(engineName)) {
      return true;
    }

    // Check additional license
    const { data: license } = await this.supabase
      .from('tcpqel_engine_licenses')
      .select('licensed')
      .eq('tenant_id', tenantId)
      .eq('engine_name', engineName)
      .single();

    return license?.licensed || false;
  }

  async getUsageStats(tenantId: string): Promise<{
    plan: string;
    usage: Record<string, { used: number; limit: number; percentage: number }>;
  }> {
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('*, tcpqel_plans(*)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    if (!tenantPlan) {
      return { plan: 'none', usage: {} };
    }

    const limits = tenantPlan.tcpqel_plans?.usage_limits || {};
    const used = tenantPlan.quota_usage || {};
    const usage: Record<string, { used: number; limit: number; percentage: number }> = {};

    for (const [engine, limit] of Object.entries(limits)) {
      const usedAmount = used[engine] || 0;
      usage[engine] = {
        used: usedAmount,
        limit: limit as number,
        percentage: ((usedAmount / (limit as number)) * 100) || 0
      };
    }

    return { plan: tenantPlan.tcpqel_plans?.plan_name || 'unknown', usage };
  }
}

export const tcpqelEngine = new TCPQELEngine();
