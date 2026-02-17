// ASRS - Autonomous Safety & Risk Supervisor (Phase 83)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SafetyEvent {
  tenant_id: string;
  event_type: string;
  risk_score: number;
  source_agent: string;
  payload: Record<string, any>;
}

interface BlockDecision {
  blocked: boolean;
  reason?: string;
  risk_score: number;
}

export class ASRSEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }

  async evaluateRisk(tenantId: string, action: string, context: Record<string, any>): Promise<BlockDecision> {
    // Get policy rules
    const { data: rules } = await this.supabase
      .from('asrs_policy_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('active', true);

    let maxRisk = 0;
    let blockReason: string | undefined;

    for (const rule of rules || []) {
      if (this.matchesRule(action, context, rule)) {
        const riskScore = this.calculateRisk(context, rule);
        if (riskScore > maxRisk) {
          maxRisk = riskScore;
          if (riskScore >= rule.block_threshold) {
            blockReason = `Rule ${rule.rule_name}: ${rule.description}`;
          }
        }
      }
    }

    // Log the event
    await this.logEvent({
      tenant_id: tenantId,
      event_type: blockReason ? 'blocked' : 'allowed',
      risk_score: maxRisk,
      source_agent: context.agent || 'unknown',
      payload: { action, context, blocked: !!blockReason }
    });

    return {
      blocked: !!blockReason,
      reason: blockReason,
      risk_score: maxRisk
    };
  }

  async logEvent(event: SafetyEvent): Promise<void> {
    await this.supabase.from('asrs_events').insert(event);
  }

  async getBlockLog(tenantId: string, limit = 50): Promise<any[]> {
    const { data } = await this.supabase
      .from('asrs_block_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  private matchesRule(action: string, context: Record<string, any>, rule: any): boolean {
    const conditions = rule.conditions || {};
    if (conditions.actions && !conditions.actions.includes(action)) return false;
    return true;
  }

  private calculateRisk(context: Record<string, any>, rule: any): number {
    const baseRisk = rule.base_risk_score || 50;
    let risk = baseRisk;

    // Adjust based on context factors
    if (context.sensitive_data) risk += 20;
    if (context.external_request) risk += 15;
    if (context.high_volume) risk += 10;

    return Math.min(100, risk);
  }
}

export const asrsEngine = new ASRSEngine();
