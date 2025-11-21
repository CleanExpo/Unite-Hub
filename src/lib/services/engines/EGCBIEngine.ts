/**
 * EGCBI Engine - Enterprise Governance, Compliance & Board Intelligence
 * Phase 89 - Multi-tenant RLS compliant
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GovernancePolicy {
  id: string;
  tenant_id: string;
  policy_name: string;
  policy_type: string;
  requirements: Record<string, any>;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
}

export interface ComplianceCheck {
  compliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
}

export interface BoardReport {
  tenant_id: string;
  report_type: string;
  period: string;
  metrics: Record<string, any>;
  insights: string[];
  generated_at: string;
}

export class EGCBIEngine {
  /**
   * Check compliance status for a tenant
   */
  async checkCompliance(tenantId: string, domain: string): Promise<ComplianceCheck> {
    // Get governance policies for this domain
    const { data: policies } = await supabase
      .from('egcbi_governance_policies')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('policy_type', domain)
      .eq('status', 'active');

    if (!policies || policies.length === 0) {
      return {
        compliant: true,
        score: 100,
        violations: [],
        recommendations: ['No policies defined for this domain']
      };
    }

    // Get compliance checks
    const { data: checks } = await supabase
      .from('egcbi_compliance_checks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('check_type', domain)
      .order('checked_at', { ascending: false })
      .limit(1);

    const latestCheck = checks?.[0];

    if (!latestCheck) {
      return {
        compliant: false,
        score: 0,
        violations: ['No compliance checks performed'],
        recommendations: ['Run initial compliance audit']
      };
    }

    return {
      compliant: latestCheck.passed,
      score: latestCheck.score || 0,
      violations: latestCheck.violations || [],
      recommendations: latestCheck.recommendations || []
    };
  }

  /**
   * Get governance policies for a tenant
   */
  async getPolicies(tenantId: string, policyType?: string): Promise<GovernancePolicy[]> {
    let query = supabase
      .from('egcbi_governance_policies')
      .select('*')
      .eq('tenant_id', tenantId);

    if (policyType) {
      query = query.eq('policy_type', policyType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[EGCBIEngine] Error fetching policies:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a governance policy
   */
  async createPolicy(
    tenantId: string,
    policyName: string,
    policyType: string,
    requirements: Record<string, any>
  ): Promise<GovernancePolicy | null> {
    const { data, error } = await supabase
      .from('egcbi_governance_policies')
      .insert({
        tenant_id: tenantId,
        policy_name: policyName,
        policy_type: policyType,
        requirements,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('[EGCBIEngine] Error creating policy:', error);
      return null;
    }

    return data;
  }

  /**
   * Generate board intelligence report
   */
  async generateBoardReport(
    tenantId: string,
    reportType: string,
    period: string
  ): Promise<BoardReport> {
    // Aggregate metrics from various sources
    const metrics: Record<string, any> = {};
    const insights: string[] = [];

    // Get compliance metrics
    const compliance = await this.checkCompliance(tenantId, 'overall');
    metrics.compliance_score = compliance.score;

    if (compliance.score < 80) {
      insights.push(`Compliance score (${compliance.score}%) needs attention`);
    }

    // Get policy count
    const policies = await this.getPolicies(tenantId);
    metrics.active_policies = policies.filter(p => p.status === 'active').length;
    metrics.draft_policies = policies.filter(p => p.status === 'draft').length;

    // Store report
    const { data } = await supabase
      .from('egcbi_board_reports')
      .insert({
        tenant_id: tenantId,
        report_type: reportType,
        period,
        metrics,
        insights,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    return {
      tenant_id: tenantId,
      report_type: reportType,
      period,
      metrics,
      insights,
      generated_at: data?.generated_at || new Date().toISOString()
    };
  }

  /**
   * Run compliance audit
   */
  async runAudit(tenantId: string, auditType: string): Promise<ComplianceCheck> {
    const policies = await this.getPolicies(tenantId, auditType);

    let score = 100;
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Simulate policy compliance checking
    for (const policy of policies) {
      // Check if policy requirements are met
      const requirementsMet = Object.keys(policy.requirements).length > 0;

      if (!requirementsMet) {
        score -= 10;
        violations.push(`Policy "${policy.policy_name}" has undefined requirements`);
        recommendations.push(`Define requirements for "${policy.policy_name}"`);
      }
    }

    if (policies.length === 0) {
      recommendations.push(`Create ${auditType} governance policies`);
    }

    // Store audit result
    await supabase
      .from('egcbi_compliance_checks')
      .insert({
        tenant_id: tenantId,
        check_type: auditType,
        passed: score >= 70,
        score,
        violations,
        recommendations,
        checked_at: new Date().toISOString()
      });

    return {
      compliant: score >= 70,
      score,
      violations,
      recommendations
    };
  }
}

export const egcbiEngine = new EGCBIEngine();
