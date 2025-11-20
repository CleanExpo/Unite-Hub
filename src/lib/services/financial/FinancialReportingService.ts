/**
 * FinancialReportingService
 * Phase 12 Week 7-8: Financial report generation and cost analysis
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom';
export type ReportStatus = 'draft' | 'generated' | 'finalized' | 'archived';

export interface FinancialReport {
  id: string;
  org_id: string;
  report_type: ReportType;
  report_name: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  subscription_revenue: number;
  overage_revenue: number;
  total_cost: number;
  usage_summary: UsageSummary;
  workspace_breakdown: WorkspaceBreakdown[];
  status: ReportStatus;
  generated_at?: string;
  finalized_at?: string;
}

export interface UsageSummary {
  emails: number;
  ai_requests: number;
  contacts: number;
  reports: number;
  campaigns: number;
  api_calls: number;
  storage_gb: number;
}

export interface WorkspaceBreakdown {
  workspace_id: string;
  workspace_name: string;
  usage: UsageSummary;
  cost: number;
  percentage: number;
}

export interface UsageRollup {
  id: string;
  org_id: string;
  workspace_id?: string;
  period_type: string;
  period_start: string;
  period_end: string;
  email_count: number;
  ai_request_count: number;
  contact_count: number;
  report_count: number;
  campaign_count: number;
  api_call_count: number;
  storage_bytes: number;
  total_cost: number;
  overage_cost: number;
}

export class FinancialReportingService {
  /**
   * Generate a financial report for a period
   */
  async generateReport(
    orgId: string,
    reportType: ReportType,
    periodStart: Date,
    periodEnd: Date,
    userId?: string
  ): Promise<FinancialReport> {
    const supabase = await getSupabaseServer();

    // Get usage summary
    const usageSummary = await this.getUsageSummary(orgId, periodStart, periodEnd);

    // Get workspace breakdown
    const workspaceBreakdown = await this.getWorkspaceBreakdown(orgId, periodStart, periodEnd);

    // Calculate revenues
    const subscriptionRevenue = await this.calculateSubscriptionRevenue(orgId, periodStart, periodEnd);
    const overageRevenue = await this.calculateOverageRevenue(orgId, periodStart, periodEnd);
    const totalRevenue = subscriptionRevenue + overageRevenue;

    // Generate report name
    const reportName = this.generateReportName(reportType, periodStart, periodEnd);

    const { data, error } = await supabase
      .from('financial_reports')
      .insert({
        org_id: orgId,
        report_type: reportType,
        report_name: reportName,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        total_revenue: totalRevenue,
        subscription_revenue: subscriptionRevenue,
        overage_revenue: overageRevenue,
        usage_summary: usageSummary,
        workspace_breakdown: workspaceBreakdown,
        status: 'generated',
        generated_at: new Date().toISOString(),
        generated_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate financial report');
    }

    return data;
  }

  /**
   * Get usage summary for period
   */
  async getUsageSummary(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageSummary> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_org_usage_summary', {
      p_org_id: orgId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    if (error) {
      console.error('Error getting usage summary:', error);
      throw new Error('Failed to get usage summary');
    }

    const summary: UsageSummary = {
      emails: 0,
      ai_requests: 0,
      contacts: 0,
      reports: 0,
      campaigns: 0,
      api_calls: 0,
      storage_gb: 0,
    };

    (data || []).forEach((row: any) => {
      switch (row.category) {
        case 'email_sent':
          summary.emails = row.total_count;
          break;
        case 'ai_request':
          summary.ai_requests = row.total_count;
          break;
        case 'contact_created':
          summary.contacts = row.total_count;
          break;
        case 'report_generated':
          summary.reports = row.total_count;
          break;
        case 'campaign_step':
          summary.campaigns = row.total_count;
          break;
        case 'api_call':
          summary.api_calls = row.total_count;
          break;
      }
    });

    return summary;
  }

  /**
   * Get workspace breakdown for period
   */
  async getWorkspaceBreakdown(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<WorkspaceBreakdown[]> {
    const supabase = await getSupabaseServer();

    // Get workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', orgId);

    if (!workspaces || workspaces.length === 0) {
      return [];
    }

    // Get usage for each workspace
    const breakdown: WorkspaceBreakdown[] = [];
    let totalCost = 0;

    for (const workspace of workspaces) {
      const { data: usage } = await supabase
        .from('usage_events')
        .select('event_category, quantity')
        .eq('org_id', orgId)
        .eq('workspace_id', workspace.id)
        .gte('created_at', periodStart.toISOString())
        .lt('created_at', periodEnd.toISOString());

      const workspaceUsage: UsageSummary = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
        storage_gb: 0,
      };

      (usage || []).forEach((event: any) => {
        switch (event.event_category) {
          case 'email_sent':
            workspaceUsage.emails += event.quantity;
            break;
          case 'ai_request':
            workspaceUsage.ai_requests += event.quantity;
            break;
          case 'contact_created':
            workspaceUsage.contacts += event.quantity;
            break;
          case 'report_generated':
            workspaceUsage.reports += event.quantity;
            break;
          case 'campaign_step':
            workspaceUsage.campaigns += event.quantity;
            break;
          case 'api_call':
            workspaceUsage.api_calls += event.quantity;
            break;
        }
      });

      const cost = this.calculateUsageCost(workspaceUsage);
      totalCost += cost;

      breakdown.push({
        workspace_id: workspace.id,
        workspace_name: workspace.name,
        usage: workspaceUsage,
        cost,
        percentage: 0, // Calculate after totals
      });
    }

    // Calculate percentages
    breakdown.forEach((ws) => {
      ws.percentage = totalCost > 0 ? (ws.cost / totalCost) * 100 : 0;
    });

    return breakdown;
  }

  /**
   * Get reports for organization
   */
  async getReports(
    orgId: string,
    options: {
      type?: ReportType;
      status?: ReportStatus;
      limit?: number;
    } = {}
  ): Promise<FinancialReport[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('financial_reports')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false });

    if (options.type) {
      query = query.eq('report_type', options.type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }

    return data || [];
  }

  /**
   * Finalize a report
   */
  async finalizeReport(reportId: string): Promise<FinancialReport> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('financial_reports')
      .update({
        status: 'finalized',
        finalized_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error finalizing report:', error);
      throw new Error('Failed to finalize report');
    }

    return data;
  }

  /**
   * Generate usage rollups
   */
  async generateRollups(
    orgId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Generate org-level rollup
    await supabase.rpc('generate_usage_rollup', {
      p_org_id: orgId,
      p_workspace_id: null,
      p_period_type: periodType,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    // Get workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', orgId);

    // Generate workspace-level rollups
    for (const workspace of workspaces || []) {
      await supabase.rpc('generate_usage_rollup', {
        p_org_id: orgId,
        p_workspace_id: workspace.id,
        p_period_type: periodType,
        p_period_start: periodStart.toISOString(),
        p_period_end: periodEnd.toISOString(),
      });
    }
  }

  /**
   * Get rollups for period
   */
  async getRollups(
    orgId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<UsageRollup[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('usage_rollups')
      .select('*')
      .eq('org_id', orgId)
      .eq('period_type', periodType)
      .gte('period_start', startDate.toISOString())
      .lte('period_start', endDate.toISOString())
      .order('period_start');

    if (error) {
      console.error('Error fetching rollups:', error);
      throw new Error('Failed to fetch rollups');
    }

    return data || [];
  }

  // Private helper methods

  private async calculateSubscriptionRevenue(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        billing_cycle,
        plan:billing_plans(price_monthly, price_yearly)
      `)
      .eq('org_id', orgId)
      .single();

    if (!subscription || !subscription.plan) return 0;

    const plan = subscription.plan as any;
    const days = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);

    if (subscription.billing_cycle === 'monthly') {
      return (plan.price_monthly / 30) * days;
    } else {
      return (plan.price_yearly / 365) * days;
    }
  }

  private async calculateOverageRevenue(
    orgId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('plan_overages')
      .select('total_charge')
      .eq('org_id', orgId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString());

    return (data || []).reduce((sum, o) => sum + (o.total_charge || 0), 0);
  }

  private calculateUsageCost(usage: UsageSummary): number {
    // Cost rates per unit
    const rates = {
      emails: 0.001,
      ai_requests: 0.01,
      contacts: 0.005,
      reports: 0.05,
      campaigns: 0.10,
      api_calls: 0.0001,
      storage_gb: 0.10,
    };

    return (
      usage.emails * rates.emails +
      usage.ai_requests * rates.ai_requests +
      usage.contacts * rates.contacts +
      usage.reports * rates.reports +
      usage.campaigns * rates.campaigns +
      usage.api_calls * rates.api_calls +
      usage.storage_gb * rates.storage_gb
    );
  }

  private generateReportName(type: ReportType, start: Date, end: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (type) {
      case 'monthly':
        return `${months[start.getMonth()]} ${start.getFullYear()} Report`;
      case 'quarterly':
        const quarter = Math.floor(start.getMonth() / 3) + 1;
        return `Q${quarter} ${start.getFullYear()} Report`;
      case 'annual':
        return `${start.getFullYear()} Annual Report`;
      default:
        return `Custom Report (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
    }
  }
}

// Export singleton
export const financialReportingService = new FinancialReportingService();
