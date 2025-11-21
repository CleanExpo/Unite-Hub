// UCSCEL - Unified Compliance, SLA & Contract Enforcement Layer (Phase 95)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class UCSCELEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkContractCompliance(
    tenantId: string,
    action: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const { data: contract } = await this.supabase
      .from('ucscel_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!contract) {
      return { compliant: true, violations: [] };
    }

    const violations: string[] = [];
    const complianceTerms = contract.compliance_terms || {};

    if (complianceTerms.prohibited_actions?.includes(action)) {
      violations.push(`Action '${action}' prohibited by contract`);
    }

    if (violations.length > 0) {
      await this.logEnforcement(tenantId, 'compliance_violation', {
        action,
        violations,
        contract_id: contract.id
      });
    }

    return { compliant: violations.length === 0, violations };
  }

  async checkSLAAdherence(
    tenantId: string,
    metric: string,
    value: number
  ): Promise<{ within_sla: boolean; threshold: number; deviation?: number }> {
    const { data: contract } = await this.supabase
      .from('ucscel_contracts')
      .select('sla_terms')
      .eq('tenant_id', tenantId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!contract?.sla_terms?.[metric]) {
      return { within_sla: true, threshold: 0 };
    }

    const threshold = contract.sla_terms[metric];
    const within_sla = value <= threshold;

    if (!within_sla) {
      await this.logEnforcement(tenantId, 'sla_breach', {
        metric,
        value,
        threshold,
        deviation: value - threshold
      });
    }

    return {
      within_sla,
      threshold,
      deviation: within_sla ? undefined : value - threshold
    };
  }

  async getActiveContract(tenantId: string): Promise<any | null> {
    const { data } = await this.supabase
      .from('ucscel_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  async logEnforcement(
    tenantId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.supabase.from('ucscel_enforcement_log').insert({
      tenant_id: tenantId,
      event_type: eventType,
      details
    });
  }

  async getEnforcementHistory(tenantId: string, limit = 50): Promise<any[]> {
    const { data } = await this.supabase
      .from('ucscel_enforcement_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

export const ucscelEngine = new UCSCELEngine();
