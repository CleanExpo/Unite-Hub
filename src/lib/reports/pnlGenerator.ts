/**
 * P&L (Profit & Loss) Generator - Phase 3 Step 9
 *
 * Generates comprehensive Profit & Loss statements:
 * - Per project P&L
 * - Per client P&L
 * - Per tenant P&L
 * - Organization-wide P&L
 *
 * Includes:
 * - Revenue breakdown (billable time, payments, subscriptions)
 * - Cost breakdown (labor, AI costs, infrastructure, overhead)
 * - Gross profit and margins
 * - Time-based comparisons (MoM, YoY)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfitAndLossStatement {
  // Period
  periodStart: string;
  periodEnd: string;
  periodLabel: string; // e.g., "January 2025", "Q1 2025"

  // Revenue
  revenue: {
    billableTime: number;
    payments: number;
    subscriptions: number;
    other: number;
    total: number;
  };

  // Costs
  costs: {
    labor: number;
    aiCosts: number;
    infrastructure: number;
    marketing: number;
    overhead: number;
    other: number;
    total: number;
  };

  // Profit metrics
  grossProfit: number;
  grossMargin: number; // Percentage
  netProfit: number;
  netMargin: number; // Percentage

  // Operational metrics
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  utilizationRate: number; // Percentage
  averageHourlyRate: number;

  // Comparison (if available)
  comparison?: {
    previousPeriod: ProfitAndLossStatement;
    revenueGrowth: number; // Percentage
    profitGrowth: number; // Percentage
    marginChange: number; // Percentage points
  };
}

export interface ProjectPnL {
  projectId: string;
  projectName: string;
  contactId: string | null;
  contactName: string | null;
  statement: ProfitAndLossStatement;
}

export interface ClientPnL {
  contactId: string;
  contactName: string;
  projects: ProjectPnL[];
  aggregatedStatement: ProfitAndLossStatement;
}

export interface TenantPnL {
  tenantId: string;
  tenantName: string;
  organizationId: string;
  statement: ProfitAndLossStatement;
  resourceCosts: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    total: number;
  };
}

// ============================================================================
// ORGANIZATION P&L
// ============================================================================

/**
 * Generate organization-wide P&L statement
 */
export async function generateOrganizationPnL(
  organizationId: string,
  startDate: string,
  endDate: string,
  includePrevious = false
): Promise<{ success: boolean; data?: ProfitAndLossStatement; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Fetch financial transactions
    const { data: transactions, error: txError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed');

    if (txError) {
      return { success: false, error: txError.message };
    }

    // Fetch time entries
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'approved');

    if (timeError) {
      return { success: false, error: timeError.message };
    }

    // Calculate revenue
    const revenue = {
      billableTime: timeEntries
        ?.filter((e) => e.billable)
        .reduce((sum, e) => sum + e.hours * e.hourly_rate, 0) || 0,
      payments:
        transactions
          ?.filter((t) => t.transaction_type === 'stripe_payment')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
      subscriptions:
        transactions
          ?.filter((t) => t.revenue_type === 'subscription')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
      other:
        transactions
          ?.filter((t) => t.transaction_type === 'adjustment' && parseFloat(t.amount) > 0)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
      total: 0,
    };
    revenue.total = revenue.billableTime + revenue.payments + revenue.subscriptions + revenue.other;

    // Calculate costs
    const costs = {
      labor: timeEntries?.reduce((sum, e) => sum + e.hours * 50, 0) || 0, // $50/hr internal cost
      aiCosts:
        Math.abs(
          transactions
            ?.filter((t) => t.transaction_type === 'ai_cost')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        ),
      infrastructure:
        Math.abs(
          transactions
            ?.filter((t) => t.cost_type === 'infrastructure')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        ),
      marketing:
        Math.abs(
          transactions
            ?.filter((t) => t.cost_type === 'marketing')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        ),
      overhead:
        Math.abs(
          transactions
            ?.filter((t) => t.cost_type === 'other')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        ),
      other: 0,
      total: 0,
    };
    costs.total = costs.labor + costs.aiCosts + costs.infrastructure + costs.marketing + costs.overhead;

    // Calculate hours
    const billableHours = timeEntries?.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0) || 0;
    const nonBillableHours = timeEntries?.filter((e) => !e.billable).reduce((sum, e) => sum + e.hours, 0) || 0;
    const totalHours = billableHours + nonBillableHours;

    // Build statement
    const statement: ProfitAndLossStatement = {
      periodStart: startDate,
      periodEnd: endDate,
      periodLabel: `${format(new Date(startDate), 'MMM yyyy')} - ${format(new Date(endDate), 'MMM yyyy')}`,
      revenue,
      costs,
      grossProfit: revenue.total - costs.total,
      grossMargin: revenue.total > 0 ? ((revenue.total - costs.total) / revenue.total) * 100 : 0,
      netProfit: revenue.total - costs.total,
      netMargin: revenue.total > 0 ? ((revenue.total - costs.total) / revenue.total) * 100 : 0,
      billableHours,
      nonBillableHours,
      totalHours,
      utilizationRate: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
      averageHourlyRate: billableHours > 0 ? revenue.billableTime / billableHours : 0,
    };

    // Add comparison to previous period if requested
    if (includePrevious) {
      const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime();
      const prevStart = new Date(new Date(startDate).getTime() - periodLength).toISOString();
      const prevEnd = new Date(new Date(startDate).getTime() - 1).toISOString();

      const prevResult = await generateOrganizationPnL(organizationId, prevStart, prevEnd, false);

      if (prevResult.success && prevResult.data) {
        statement.comparison = {
          previousPeriod: prevResult.data,
          revenueGrowth:
            prevResult.data.revenue.total > 0
              ? ((revenue.total - prevResult.data.revenue.total) / prevResult.data.revenue.total) * 100
              : 0,
          profitGrowth:
            prevResult.data.netProfit !== 0
              ? ((statement.netProfit - prevResult.data.netProfit) / Math.abs(prevResult.data.netProfit)) * 100
              : 0,
          marginChange: statement.netMargin - prevResult.data.netMargin,
        };
      }
    }

    return { success: true, data: statement };
  } catch (error) {
    console.error('[PNL GENERATOR] Error generating organization P&L:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PROJECT P&L
// ============================================================================

/**
 * Generate P&L statement for a specific project
 */
export async function generateProjectPnL(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: ProjectPnL; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, contact_id, organization_id, contacts(name)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found' };
    }

    // Fetch time entries
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'approved');

    if (timeError) {
      return { success: false, error: timeError.message };
    }

    // Fetch AI costs
    const { data: aiCosts, error: aiError } = await supabase
      .from('ai_cost_tracking')
      .select('total_cost')
      .eq('project_id', projectId)
      .gte('usage_date', startDate)
      .lte('usage_date', endDate);

    if (aiError) {
      return { success: false, error: aiError.message };
    }

    // Calculate revenue
    const billableTime = timeEntries
      ?.filter((e) => e.billable)
      .reduce((sum, e) => sum + e.hours * e.hourly_rate, 0) || 0;

    const revenue = {
      billableTime,
      payments: 0, // Project-level payments tracked separately if needed
      subscriptions: 0,
      other: 0,
      total: billableTime,
    };

    // Calculate costs
    const laborCost = timeEntries?.reduce((sum, e) => sum + e.hours * 50, 0) || 0;
    const aiCostTotal = aiCosts?.reduce((sum, c) => sum + parseFloat(c.total_cost), 0) || 0;

    const costs = {
      labor: laborCost,
      aiCosts: aiCostTotal,
      infrastructure: 0,
      marketing: 0,
      overhead: 0,
      other: 0,
      total: laborCost + aiCostTotal,
    };

    // Calculate hours
    const billableHours = timeEntries?.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0) || 0;
    const nonBillableHours = timeEntries?.filter((e) => !e.billable).reduce((sum, e) => sum + e.hours, 0) || 0;
    const totalHours = billableHours + nonBillableHours;

    const statement: ProfitAndLossStatement = {
      periodStart: startDate,
      periodEnd: endDate,
      periodLabel: `${project.name} - ${format(new Date(startDate), 'MMM yyyy')} - ${format(new Date(endDate), 'MMM yyyy')}`,
      revenue,
      costs,
      grossProfit: revenue.total - costs.total,
      grossMargin: revenue.total > 0 ? ((revenue.total - costs.total) / revenue.total) * 100 : 0,
      netProfit: revenue.total - costs.total,
      netMargin: revenue.total > 0 ? ((revenue.total - costs.total) / revenue.total) * 100 : 0,
      billableHours,
      nonBillableHours,
      totalHours,
      utilizationRate: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
      averageHourlyRate: billableHours > 0 ? revenue.billableTime / billableHours : 0,
    };

    return {
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        contactId: project.contact_id,
        contactName: (project.contacts as any)?.name || null,
        statement,
      },
    };
  } catch (error) {
    console.error('[PNL GENERATOR] Error generating project P&L:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CLIENT P&L
// ============================================================================

/**
 * Generate aggregated P&L for a client (all their projects)
 */
export async function generateClientPnL(
  contactId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: ClientPnL; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, organization_id')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Fetch all projects for this contact
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('contact_id', contactId);

    if (projectsError) {
      return { success: false, error: projectsError.message };
    }

    // Generate P&L for each project
    const projectPnLs: ProjectPnL[] = [];

    for (const project of projects || []) {
      const result = await generateProjectPnL(project.id, startDate, endDate);
      if (result.success && result.data) {
        projectPnLs.push(result.data);
      }
    }

    // Aggregate across all projects
    const aggregatedRevenue = {
      billableTime: 0,
      payments: 0,
      subscriptions: 0,
      other: 0,
      total: 0,
    };

    const aggregatedCosts = {
      labor: 0,
      aiCosts: 0,
      infrastructure: 0,
      marketing: 0,
      overhead: 0,
      other: 0,
      total: 0,
    };

    let totalBillableHours = 0;
    let totalNonBillableHours = 0;

    projectPnLs.forEach((pnl) => {
      aggregatedRevenue.billableTime += pnl.statement.revenue.billableTime;
      aggregatedRevenue.payments += pnl.statement.revenue.payments;
      aggregatedRevenue.subscriptions += pnl.statement.revenue.subscriptions;
      aggregatedRevenue.other += pnl.statement.revenue.other;

      aggregatedCosts.labor += pnl.statement.costs.labor;
      aggregatedCosts.aiCosts += pnl.statement.costs.aiCosts;
      aggregatedCosts.infrastructure += pnl.statement.costs.infrastructure;
      aggregatedCosts.marketing += pnl.statement.costs.marketing;
      aggregatedCosts.overhead += pnl.statement.costs.overhead;
      aggregatedCosts.other += pnl.statement.costs.other;

      totalBillableHours += pnl.statement.billableHours;
      totalNonBillableHours += pnl.statement.nonBillableHours;
    });

    aggregatedRevenue.total =
      aggregatedRevenue.billableTime +
      aggregatedRevenue.payments +
      aggregatedRevenue.subscriptions +
      aggregatedRevenue.other;

    aggregatedCosts.total =
      aggregatedCosts.labor +
      aggregatedCosts.aiCosts +
      aggregatedCosts.infrastructure +
      aggregatedCosts.marketing +
      aggregatedCosts.overhead +
      aggregatedCosts.other;

    const totalHours = totalBillableHours + totalNonBillableHours;

    const aggregatedStatement: ProfitAndLossStatement = {
      periodStart: startDate,
      periodEnd: endDate,
      periodLabel: `${contact.name} - ${format(new Date(startDate), 'MMM yyyy')} - ${format(new Date(endDate), 'MMM yyyy')}`,
      revenue: aggregatedRevenue,
      costs: aggregatedCosts,
      grossProfit: aggregatedRevenue.total - aggregatedCosts.total,
      grossMargin:
        aggregatedRevenue.total > 0
          ? ((aggregatedRevenue.total - aggregatedCosts.total) / aggregatedRevenue.total) * 100
          : 0,
      netProfit: aggregatedRevenue.total - aggregatedCosts.total,
      netMargin:
        aggregatedRevenue.total > 0
          ? ((aggregatedRevenue.total - aggregatedCosts.total) / aggregatedRevenue.total) * 100
          : 0,
      billableHours: totalBillableHours,
      nonBillableHours: totalNonBillableHours,
      totalHours,
      utilizationRate: totalHours > 0 ? (totalBillableHours / totalHours) * 100 : 0,
      averageHourlyRate: totalBillableHours > 0 ? aggregatedRevenue.billableTime / totalBillableHours : 0,
    };

    return {
      success: true,
      data: {
        contactId: contact.id,
        contactName: contact.name,
        projects: projectPnLs,
        aggregatedStatement,
      },
    };
  } catch (error) {
    console.error('[PNL GENERATOR] Error generating client P&L:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TENANT P&L
// ============================================================================

/**
 * Generate P&L for a tenant container
 */
export async function generateTenantPnL(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: TenantPnL; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Fetch tenant container details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_containers')
      .select('id, tenant_name, organization_id, cpu_limit, memory_limit_mb')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    // Fetch resource usage
    const { data: resourceUsage, error: resourceError } = await supabase
      .from('tenant_resource_usage')
      .select('*')
      .eq('container_id', tenantId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate);

    if (resourceError) {
      return { success: false, error: resourceError.message };
    }

    // Calculate resource costs (simplified pricing)
    const cpuCost = (tenant.cpu_limit * 0.04 * 730) / 30; // $0.04/core/hour
    const memoryCost = (tenant.memory_limit_mb / 1024) * 0.005 * 730 / 30; // $0.005/GB/hour
    const storageCost = 2; // $2/month for 2GB storage
    const bandwidthCost = 1; // $1/month estimated

    const resourceCosts = {
      cpu: cpuCost,
      memory: memoryCost,
      storage: storageCost,
      bandwidth: bandwidthCost,
      total: cpuCost + memoryCost + storageCost + bandwidthCost,
    };

    // Generate organization P&L for this tenant's org
    const orgPnLResult = await generateOrganizationPnL(tenant.organization_id, startDate, endDate, false);

    if (!orgPnLResult.success || !orgPnLResult.data) {
      return { success: false, error: 'Failed to generate organization P&L' };
    }

    // Add infrastructure costs to the statement
    const statement = { ...orgPnLResult.data };
    statement.costs.infrastructure += resourceCosts.total;
    statement.costs.total += resourceCosts.total;
    statement.grossProfit = statement.revenue.total - statement.costs.total;
    statement.grossMargin = statement.revenue.total > 0 ? (statement.grossProfit / statement.revenue.total) * 100 : 0;
    statement.netProfit = statement.grossProfit;
    statement.netMargin = statement.grossMargin;

    return {
      success: true,
      data: {
        tenantId: tenant.id,
        tenantName: tenant.tenant_name,
        organizationId: tenant.organization_id,
        statement,
        resourceCosts,
      },
    };
  } catch (error) {
    console.error('[PNL GENERATOR] Error generating tenant P&L:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MONTHLY COMPARISON
// ============================================================================

/**
 * Generate monthly P&L comparison for last N months
 */
export async function generateMonthlyComparison(
  organizationId: string,
  months = 6
): Promise<{ success: boolean; data?: ProfitAndLossStatement[]; error?: string }> {
  try {
    const statements: ProfitAndLossStatement[] = [];

    for (let i = 0; i < months; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));

      const result = await generateOrganizationPnL(
        organizationId,
        monthStart.toISOString(),
        monthEnd.toISOString(),
        false
      );

      if (result.success && result.data) {
        statements.push(result.data);
      }
    }

    return { success: true, data: statements.reverse() };
  } catch (error) {
    console.error('[PNL GENERATOR] Error generating monthly comparison:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
