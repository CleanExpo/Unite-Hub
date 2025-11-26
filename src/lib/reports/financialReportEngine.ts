/**
 * Financial Report Engine - Phase 3 Step 9
 *
 * Master engine for aggregating financial data from multiple sources:
 * - Time tracking (billable hours, labor costs)
 * - Stripe payments (revenue, refunds)
 * - Xero invoices (AR, invoicing)
 * - AI costs (API usage from Anthropic, OpenRouter, Google)
 * - Expenses and adjustments
 *
 * Generates consolidated reports for:
 * - Organization-wide financial summary
 * - Project-level P&L
 * - Client billing statements
 * - AI cost analysis
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  totalBillableHours: number;
  totalPayments: number;
  outstandingBalance: number;
  periodStart: string;
  periodEnd: string;
}

export interface ProjectFinancials {
  projectId: string;
  projectName: string;
  contactId: string | null;
  totalRevenue: number;
  laborCost: number;
  aiCost: number;
  grossProfit: number;
  profitMarginPercent: number;
  billableHours: number;
  nonBillableHours: number;
  billableUtilizationPercent: number;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
  projectStatus: string;
}

export interface ClientBilling {
  contactId: string;
  clientName: string;
  billableHours: number;
  nonBillableHours: number;
  totalBillableAmount: number;
  totalPayments: number;
  totalRefunds: number;
  outstandingBalance: number;
  firstBillableDate: string | null;
  lastBillableDate: string | null;
  lastPaymentDate: string | null;
  totalEntries: number;
  totalPaymentsCount: number;
}

export interface AICostBreakdown {
  provider: string;
  modelName: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
}

export interface TransactionRecord {
  id: string;
  transactionType: string;
  transactionDate: string;
  amount: number;
  currency: string;
  description: string | null;
  projectId: string | null;
  contactId: string | null;
  status: string;
}

export interface ReportFilters {
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  contactId?: string;
  startDate?: string;
  endDate?: string;
  transactionTypes?: string[];
}

// ============================================================================
// FINANCIAL SUMMARY
// ============================================================================

/**
 * Get organization-wide financial summary
 */
export async function getFinancialSummary(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Call database function for aggregated summary
    const { data, error } = await supabase.rpc('get_organization_financial_summary', {
      org_id_param: organizationId,
      start_date_param: startDate || null,
      end_date_param: endDate || new Date().toISOString(),
    });

    if (error) {
      console.error('[FINANCIAL REPORT] Error fetching summary:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          totalRevenue: 0,
          totalCosts: 0,
          grossProfit: 0,
          profitMargin: 0,
          totalBillableHours: 0,
          totalPayments: 0,
          outstandingBalance: 0,
          periodStart: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          periodEnd: endDate || new Date().toISOString(),
        },
      };
    }

    const summary = data[0];

    return {
      success: true,
      data: {
        totalRevenue: parseFloat(summary.total_revenue) || 0,
        totalCosts: Math.abs(parseFloat(summary.total_costs)) || 0,
        grossProfit: parseFloat(summary.gross_profit) || 0,
        profitMargin: parseFloat(summary.profit_margin) || 0,
        totalBillableHours: parseFloat(summary.total_billable_hours) || 0,
        totalPayments: parseFloat(summary.total_payments) || 0,
        outstandingBalance: parseFloat(summary.outstanding_balance) || 0,
        periodStart: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: endDate || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in getFinancialSummary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PROJECT FINANCIALS
// ============================================================================

/**
 * Get project-level financial data
 */
export async function getProjectFinancials(
  organizationId: string,
  projectId?: string
): Promise<{ success: boolean; data?: ProjectFinancials[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Query materialized view
    let query = supabase
      .from('project_profitability')
      .select('*')
      .eq('organization_id', organizationId)
      .order('total_revenue', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FINANCIAL REPORT] Error fetching project financials:', error);
      return { success: false, error: error.message };
    }

    const projects: ProjectFinancials[] = (data || []).map((row: any) => ({
      projectId: row.project_id,
      projectName: row.project_name,
      contactId: row.contact_id,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      laborCost: parseFloat(row.labor_cost) || 0,
      aiCost: parseFloat(row.ai_cost) || 0,
      grossProfit: parseFloat(row.gross_profit) || 0,
      profitMarginPercent: parseFloat(row.profit_margin_percent) || 0,
      billableHours: parseFloat(row.billable_hours) || 0,
      nonBillableHours: parseFloat(row.non_billable_hours) || 0,
      billableUtilizationPercent: parseFloat(row.billable_utilization_percent) || 0,
      firstEntryDate: row.first_entry_date,
      lastEntryDate: row.last_entry_date,
      projectStatus: row.project_status,
    }));

    return { success: true, data: projects };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in getProjectFinancials:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CLIENT BILLING
// ============================================================================

/**
 * Get client billing summary
 */
export async function getClientBilling(
  organizationId: string,
  contactId?: string
): Promise<{ success: boolean; data?: ClientBilling[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Query materialized view
    let query = supabase
      .from('client_billing_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .order('outstanding_balance', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FINANCIAL REPORT] Error fetching client billing:', error);
      return { success: false, error: error.message };
    }

    const clients: ClientBilling[] = (data || []).map((row: any) => ({
      contactId: row.contact_id,
      clientName: row.client_name,
      billableHours: parseFloat(row.billable_hours) || 0,
      nonBillableHours: parseFloat(row.non_billable_hours) || 0,
      totalBillableAmount: parseFloat(row.total_billable_amount) || 0,
      totalPayments: parseFloat(row.total_payments) || 0,
      totalRefunds: parseFloat(row.total_refunds) || 0,
      outstandingBalance: parseFloat(row.outstanding_balance) || 0,
      firstBillableDate: row.first_billable_date,
      lastBillableDate: row.last_billable_date,
      lastPaymentDate: row.last_payment_date,
      totalEntries: parseInt(row.total_entries) || 0,
      totalPaymentsCount: parseInt(row.total_payments_count) || 0,
    }));

    return { success: true, data: clients };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in getClientBilling:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// AI COST ANALYSIS
// ============================================================================

/**
 * Get AI cost breakdown by provider and model
 */
export async function getAICostBreakdown(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; data?: AICostBreakdown[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ai_cost_tracking')
      .select('*')
      .eq('organization_id', organizationId);

    if (startDate) {
      query = query.gte('usage_date', startDate);
    }
    if (endDate) {
      query = query.lte('usage_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FINANCIAL REPORT] Error fetching AI costs:', error);
      return { success: false, error: error.message };
    }

    // Group by provider and model
    const grouped = new Map<string, AICostBreakdown>();

    (data || []).forEach((row: any) => {
      const key = `${row.provider}:${row.model_name}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          provider: row.provider,
          modelName: row.model_name,
          totalRequests: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheReadTokens: 0,
          totalCacheWriteTokens: 0,
          totalCost: 0,
          averageCostPerRequest: 0,
        });
      }

      const breakdown = grouped.get(key)!;
      breakdown.totalRequests += 1;
      breakdown.totalInputTokens += row.input_tokens || 0;
      breakdown.totalOutputTokens += row.output_tokens || 0;
      breakdown.totalCacheReadTokens += row.cache_read_tokens || 0;
      breakdown.totalCacheWriteTokens += row.cache_write_tokens || 0;
      breakdown.totalCost += parseFloat(row.total_cost) || 0;
    });

    // Calculate averages
    const breakdowns = Array.from(grouped.values()).map((breakdown) => ({
      ...breakdown,
      averageCostPerRequest: breakdown.totalRequests > 0 ? breakdown.totalCost / breakdown.totalRequests : 0,
    }));

    // Sort by total cost descending
    breakdowns.sort((a, b) => b.totalCost - a.totalCost);

    return { success: true, data: breakdowns };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in getAICostBreakdown:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRANSACTION HISTORY
// ============================================================================

/**
 * Get transaction history with filters
 */
export async function getTransactionHistory(
  filters: ReportFilters
): Promise<{ success: boolean; data?: TransactionRecord[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('financial_transactions')
      .select('*')
      .eq('organization_id', filters.organizationId)
      .order('transaction_date', { ascending: false });

    if (filters.workspaceId) {
      query = query.eq('workspace_id', filters.workspaceId);
    }

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }

    if (filters.transactionTypes && filters.transactionTypes.length > 0) {
      query = query.in('transaction_type', filters.transactionTypes);
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      console.error('[FINANCIAL REPORT] Error fetching transactions:', error);
      return { success: false, error: error.message };
    }

    const transactions: TransactionRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      transactionType: row.transaction_type,
      transactionDate: row.transaction_date,
      amount: parseFloat(row.amount) || 0,
      currency: row.currency,
      description: row.description,
      projectId: row.project_id,
      contactId: row.contact_id,
      status: row.status,
    }));

    return { success: true, data: transactions };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in getTransactionHistory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// REFRESH MATERIALIZED VIEWS
// ============================================================================

/**
 * Refresh all financial reporting materialized views
 */
export async function refreshFinancialReports(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.rpc('refresh_financial_reports');

    if (error) {
      console.error('[FINANCIAL REPORT] Error refreshing views:', error);
      return { success: false, error: error.message };
    }

    console.log('[FINANCIAL REPORT] Materialized views refreshed successfully');
    return { success: true };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in refreshFinancialReports:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// RECORD AI COST
// ============================================================================

/**
 * Record AI API usage cost
 */
export async function recordAICost(params: {
  organizationId: string;
  workspaceId?: string;
  provider: 'anthropic' | 'openai' | 'google' | 'openrouter';
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  operationType?: string;
  contactId?: string;
  projectId?: string;
  requestId?: string;
}): Promise<{ success: boolean; costId?: string; totalCost?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Calculate cost using database function
    const { data: costData, error: costError } = await supabase.rpc('calculate_ai_cost', {
      provider_param: params.provider,
      model_param: params.modelName,
      input_tokens_param: params.inputTokens,
      output_tokens_param: params.outputTokens,
      cache_read_tokens_param: params.cacheReadTokens || 0,
      cache_write_tokens_param: params.cacheWriteTokens || 0,
    });

    if (costError) {
      console.error('[FINANCIAL REPORT] Error calculating AI cost:', costError);
      return { success: false, error: costError.message };
    }

    const totalCost = parseFloat(costData);

    // Insert AI cost record
    const { data: costRecord, error: insertError } = await supabase
      .from('ai_cost_tracking')
      .insert({
        organization_id: params.organizationId,
        workspace_id: params.workspaceId || null,
        provider: params.provider,
        model_name: params.modelName,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cache_read_tokens: params.cacheReadTokens || 0,
        cache_write_tokens: params.cacheWriteTokens || 0,
        input_cost: (params.inputTokens / 1000000.0) * getCostRate(params.provider, params.modelName, 'input'),
        output_cost: (params.outputTokens / 1000000.0) * getCostRate(params.provider, params.modelName, 'output'),
        cache_cost:
          ((params.cacheReadTokens || 0) / 1000000.0) * getCostRate(params.provider, params.modelName, 'cache_read') +
          ((params.cacheWriteTokens || 0) / 1000000.0) * getCostRate(params.provider, params.modelName, 'cache_write'),
        total_cost: totalCost,
        operation_type: params.operationType || null,
        contact_id: params.contactId || null,
        project_id: params.projectId || null,
        request_id: params.requestId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[FINANCIAL REPORT] Error inserting AI cost:', insertError);
      return { success: false, error: insertError.message };
    }

    // Also create a financial transaction record
    await supabase.from('financial_transactions').insert({
      organization_id: params.organizationId,
      workspace_id: params.workspaceId || null,
      project_id: params.projectId || null,
      contact_id: params.contactId || null,
      transaction_type: 'ai_cost',
      amount: -totalCost, // Negative for cost
      currency: 'USD',
      cost_type: 'ai_api',
      description: `${params.provider} ${params.modelName} - ${params.operationType || 'API call'}`,
      status: 'completed',
      metadata: {
        provider: params.provider,
        model: params.modelName,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        requestId: params.requestId,
      },
    });

    return { success: true, costId: costRecord.id, totalCost };
  } catch (error) {
    console.error('[FINANCIAL REPORT] Error in recordAICost:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cost rate per million tokens for a provider/model
 */
function getCostRate(provider: string, model: string, type: 'input' | 'output' | 'cache_read' | 'cache_write'): number {
  if (provider === 'anthropic') {
    const rates: Record<string, Record<string, number>> = {
      'claude-opus-4-5-20251101': { input: 15.0, output: 75.0, cache_read: 1.5, cache_write: 18.75 },
      'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0, cache_read: 0.3, cache_write: 3.75 },
      'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0, cache_read: 0.08, cache_write: 1.0 },
    };
    return rates[model]?.[type] || rates['claude-sonnet-4-5-20250929'][type];
  } else if (provider === 'openrouter') {
    return { input: 0.5, output: 1.5, cache_read: 0, cache_write: 0 }[type] || 0;
  } else if (provider === 'google') {
    return { input: 1.25, output: 5.0, cache_read: 0, cache_write: 0 }[type] || 0;
  }
  return { input: 1.0, output: 3.0, cache_read: 0, cache_write: 0 }[type] || 0;
}
