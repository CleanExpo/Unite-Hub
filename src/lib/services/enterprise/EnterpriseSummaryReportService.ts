/**
 * EnterpriseSummaryReportService
 * Phase 12 Week 9: Unified enterprise reporting across billing, analytics, teams, workspaces
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface EnterpriseSummary {
  org_id: string;
  org_name: string;
  generated_at: string;
  health_score: number;
  billing: BillingSummary;
  usage: UsageSummary;
  teams: TeamsSummary;
  workspaces: WorkspacesSummary;
  audit: AuditSummary;
  alerts: Alert[];
}

export interface BillingSummary {
  plan_name: string;
  plan_tier: string;
  billing_cycle: string;
  current_period_cost: number;
  projected_cost: number;
  usage_percentage: number;
  days_until_renewal: number;
  overage_risk: 'none' | 'low' | 'medium' | 'high';
}

export interface UsageSummary {
  total_events: number;
  emails_sent: number;
  ai_requests: number;
  contacts_created: number;
  api_calls: number;
  storage_used_gb: number;
  growth_rate: number;
}

export interface TeamsSummary {
  total_teams: number;
  total_members: number;
  active_users_30d: number;
  roles_distribution: { [role: string]: number };
}

export interface WorkspacesSummary {
  total_workspaces: number;
  active_workspaces: number;
  workspaces_by_usage: WorkspaceUsage[];
}

export interface WorkspaceUsage {
  id: string;
  name: string;
  usage_percentage: number;
  cost: number;
}

export interface AuditSummary {
  total_events_30d: number;
  critical_events: number;
  security_incidents: number;
  compliance_status: 'compliant' | 'warning' | 'non_compliant';
}

export interface Alert {
  type: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  action_required: boolean;
}

export class EnterpriseSummaryReportService {
  /**
   * Generate comprehensive enterprise summary
   */
  async generateSummary(orgId: string): Promise<EnterpriseSummary> {
    const supabase = await getSupabaseServer();

    // Get org details
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    // Gather all summaries in parallel
    const [billing, usage, teams, workspaces, audit] = await Promise.all([
      this.getBillingSummary(orgId),
      this.getUsageSummary(orgId),
      this.getTeamsSummary(orgId),
      this.getWorkspacesSummary(orgId),
      this.getAuditSummary(orgId),
    ]);

    // Generate alerts
    const alerts = this.generateAlerts(billing, usage, teams, audit);

    // Calculate health score
    const healthScore = this.calculateHealthScore(billing, usage, teams, audit, alerts);

    return {
      org_id: orgId,
      org_name: org?.name || 'Unknown',
      generated_at: new Date().toISOString(),
      health_score: healthScore,
      billing,
      usage,
      teams,
      workspaces,
      audit,
      alerts,
    };
  }

  /**
   * Get billing summary
   */
  private async getBillingSummary(orgId: string): Promise<BillingSummary> {
    const supabase = await getSupabaseServer();

    // Get subscription and plan
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        billing_cycle,
        current_period_start,
        current_period_end,
        plan:billing_plans(name, tier, price_monthly, price_yearly)
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single();

    if (!subscription || !subscription.plan) {
      return {
        plan_name: 'Free',
        plan_tier: 'free',
        billing_cycle: 'monthly',
        current_period_cost: 0,
        projected_cost: 0,
        usage_percentage: 0,
        days_until_renewal: 30,
        overage_risk: 'none',
      };
    }

    const plan = subscription.plan as any;
    const periodEnd = new Date(subscription.current_period_end);
    const daysUntilRenewal = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Get current usage
    const { data: usage } = await supabase
      .from('usage_events')
      .select('quantity')
      .eq('org_id', orgId)
      .gte('created_at', subscription.current_period_start);

    const totalUsage = (usage || []).reduce((sum, e) => sum + e.quantity, 0);

    // Calculate costs
    const currentCost = subscription.billing_cycle === 'monthly'
      ? plan.price_monthly
      : plan.price_yearly / 12;

    // Determine overage risk based on usage patterns
    let overageRisk: 'none' | 'low' | 'medium' | 'high' = 'none';
    const usagePercentage = Math.min(100, (totalUsage / 10000) * 100); // Assuming 10k limit

    if (usagePercentage > 90) overageRisk = 'high';
    else if (usagePercentage > 75) overageRisk = 'medium';
    else if (usagePercentage > 50) overageRisk = 'low';

    return {
      plan_name: plan.name,
      plan_tier: plan.tier,
      billing_cycle: subscription.billing_cycle,
      current_period_cost: currentCost,
      projected_cost: currentCost * 1.1, // Simple projection
      usage_percentage: usagePercentage,
      days_until_renewal: Math.max(0, daysUntilRenewal),
      overage_risk: overageRisk,
    };
  }

  /**
   * Get usage summary for last 30 days
   */
  private async getUsageSummary(orgId: string): Promise<UsageSummary> {
    const supabase = await getSupabaseServer();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events } = await supabase
      .from('usage_events')
      .select('event_category, quantity')
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const summary: UsageSummary = {
      total_events: 0,
      emails_sent: 0,
      ai_requests: 0,
      contacts_created: 0,
      api_calls: 0,
      storage_used_gb: 0,
      growth_rate: 0,
    };

    (events || []).forEach((event: any) => {
      summary.total_events += event.quantity;
      switch (event.event_category) {
        case 'email_sent':
          summary.emails_sent += event.quantity;
          break;
        case 'ai_request':
          summary.ai_requests += event.quantity;
          break;
        case 'contact_created':
          summary.contacts_created += event.quantity;
          break;
        case 'api_call':
          summary.api_calls += event.quantity;
          break;
      }
    });

    // Calculate growth rate (compare to previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: prevEvents } = await supabase
      .from('usage_events')
      .select('quantity')
      .eq('org_id', orgId)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const prevTotal = (prevEvents || []).reduce((sum, e) => sum + e.quantity, 0);
    if (prevTotal > 0) {
      summary.growth_rate = ((summary.total_events - prevTotal) / prevTotal) * 100;
    }

    return summary;
  }

  /**
   * Get teams summary
   */
  private async getTeamsSummary(orgId: string): Promise<TeamsSummary> {
    const supabase = await getSupabaseServer();

    // Get teams count
    const { count: teamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Get members
    const { data: members } = await supabase
      .from('user_organizations')
      .select('user_id, role')
      .eq('org_id', orgId);

    const rolesDistribution: { [role: string]: number } = {};
    (members || []).forEach((m: any) => {
      rolesDistribution[m.role] = (rolesDistribution[m.role] || 0) + 1;
    });

    // Get active users (simplified - would check activity logs in production)
    const activeUsers = members?.length || 0;

    return {
      total_teams: teamsCount || 0,
      total_members: members?.length || 0,
      active_users_30d: activeUsers,
      roles_distribution: rolesDistribution,
    };
  }

  /**
   * Get workspaces summary
   */
  private async getWorkspacesSummary(orgId: string): Promise<WorkspacesSummary> {
    const supabase = await getSupabaseServer();

    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId);

    if (!workspaces || workspaces.length === 0) {
      return {
        total_workspaces: 0,
        active_workspaces: 0,
        workspaces_by_usage: [],
      };
    }

    // Get usage per workspace
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workspaceUsages: WorkspaceUsage[] = [];
    let totalUsage = 0;

    for (const ws of workspaces) {
      const { data: events } = await supabase
        .from('usage_events')
        .select('quantity')
        .eq('org_id', orgId)
        .eq('workspace_id', ws.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const wsUsage = (events || []).reduce((sum, e) => sum + e.quantity, 0);
      totalUsage += wsUsage;

      workspaceUsages.push({
        id: ws.id,
        name: ws.name,
        usage_percentage: 0,
        cost: wsUsage * 0.001, // Simple cost calculation
      });
    }

    // Calculate percentages
    workspaceUsages.forEach((ws) => {
      ws.usage_percentage = totalUsage > 0 ? (ws.cost / (totalUsage * 0.001)) * 100 : 0;
    });

    // Sort by usage
    workspaceUsages.sort((a, b) => b.usage_percentage - a.usage_percentage);

    const activeWorkspaces = workspaceUsages.filter((ws) => ws.usage_percentage > 0).length;

    return {
      total_workspaces: workspaces.length,
      active_workspaces: activeWorkspaces,
      workspaces_by_usage: workspaceUsages.slice(0, 5),
    };
  }

  /**
   * Get audit summary
   */
  private async getAuditSummary(orgId: string): Promise<AuditSummary> {
    const supabase = await getSupabaseServer();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events } = await supabase
      .from('audit_events')
      .select('severity, event_category')
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const criticalEvents = (events || []).filter((e) => e.severity === 'critical').length;
    const securityIncidents = (events || []).filter(
      (e) => e.event_category === 'security' && (e.severity === 'error' || e.severity === 'critical')
    ).length;

    let complianceStatus: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
    if (criticalEvents > 5 || securityIncidents > 3) {
      complianceStatus = 'non_compliant';
    } else if (criticalEvents > 0 || securityIncidents > 0) {
      complianceStatus = 'warning';
    }

    return {
      total_events_30d: events?.length || 0,
      critical_events: criticalEvents,
      security_incidents: securityIncidents,
      compliance_status: complianceStatus,
    };
  }

  /**
   * Generate alerts based on summaries
   */
  private generateAlerts(
    billing: BillingSummary,
    usage: UsageSummary,
    teams: TeamsSummary,
    audit: AuditSummary
  ): Alert[] {
    const alerts: Alert[] = [];

    // Billing alerts
    if (billing.overage_risk === 'high') {
      alerts.push({
        type: 'critical',
        category: 'billing',
        message: 'High risk of usage overage this billing period',
        action_required: true,
      });
    } else if (billing.overage_risk === 'medium') {
      alerts.push({
        type: 'warning',
        category: 'billing',
        message: 'Usage approaching plan limits',
        action_required: false,
      });
    }

    if (billing.days_until_renewal <= 7) {
      alerts.push({
        type: 'info',
        category: 'billing',
        message: `Subscription renewal in ${billing.days_until_renewal} days`,
        action_required: false,
      });
    }

    // Usage alerts
    if (usage.growth_rate > 50) {
      alerts.push({
        type: 'info',
        category: 'usage',
        message: `Rapid usage growth: ${usage.growth_rate.toFixed(1)}% increase`,
        action_required: false,
      });
    }

    // Team alerts
    if (teams.total_members === 0) {
      alerts.push({
        type: 'warning',
        category: 'teams',
        message: 'No team members configured',
        action_required: true,
      });
    }

    // Audit alerts
    if (audit.critical_events > 0) {
      alerts.push({
        type: 'critical',
        category: 'security',
        message: `${audit.critical_events} critical security events require review`,
        action_required: true,
      });
    }

    if (audit.compliance_status === 'non_compliant') {
      alerts.push({
        type: 'error',
        category: 'compliance',
        message: 'Organization is non-compliant with security policies',
        action_required: true,
      });
    }

    return alerts;
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(
    billing: BillingSummary,
    usage: UsageSummary,
    teams: TeamsSummary,
    audit: AuditSummary,
    alerts: Alert[]
  ): number {
    let score = 100;

    // Billing factors (-20 max)
    if (billing.overage_risk === 'high') score -= 15;
    else if (billing.overage_risk === 'medium') score -= 8;
    else if (billing.overage_risk === 'low') score -= 3;

    // Usage factors (-15 max)
    if (usage.total_events === 0) score -= 10;
    if (usage.growth_rate < -20) score -= 5;

    // Team factors (-15 max)
    if (teams.total_members === 0) score -= 15;
    else if (teams.total_members === 1) score -= 5;

    // Audit factors (-30 max)
    score -= Math.min(15, audit.critical_events * 3);
    score -= Math.min(10, audit.security_incidents * 2);
    if (audit.compliance_status === 'non_compliant') score -= 10;
    else if (audit.compliance_status === 'warning') score -= 5;

    // Alerts (-20 max)
    const criticalAlerts = alerts.filter((a) => a.type === 'critical').length;
    const errorAlerts = alerts.filter((a) => a.type === 'error').length;
    score -= Math.min(10, criticalAlerts * 5);
    score -= Math.min(10, errorAlerts * 3);

    return Math.max(0, Math.min(100, score));
  }
}

// Export singleton
export const enterpriseSummaryReportService = new EnterpriseSummaryReportService();
