/**
 * Cost Tracker - Real-time Operational Expense Tracking
 *
 * Tracks every API call cost for accurate client profitability
 *
 * Usage:
 * ```typescript
 * await CostTracker.trackExpense({
 *   organizationId,
 *   workspaceId,
 *   clientId,
 *   expenseType: 'openrouter',
 *   description: 'Claude 3.5 Sonnet - 1234 tokens',
 *   amount: 0.0245
 * });
 * ```
 *
 * Following CLAUDE.md patterns:
 * - Uses supabaseAdmin for system operations (bypasses RLS)
 * - Workspace isolation
 * - Graceful error handling (doesn't throw)
 *
 * @see docs/XERO_INTEGRATION_FINANCIAL_OPS.md
 */

export type ExpenseType =
  | 'anthropic'
  | 'openrouter'
  | 'perplexity'
  | 'vercel'
  | 'sendgrid'
  | 'resend'
  | 'supabase'
  | 'other';

export interface CostTrackingParams {
  organizationId: string;
  workspaceId: string;
  clientId?: string; // Optional - some costs are platform-wide
  expenseType: ExpenseType;
  description: string;
  amount: number; // In USD
  tokensUsed?: number;
  apiEndpoint?: string;
  requestId?: string;
  metadata?: Record<string, any>; // Additional context (model, response time, etc.)
}

export interface ClientMonthlyCosts {
  clientId: string;
  totalCosts: number;
  costsByType: Record<ExpenseType, number>;
  totalApiCalls: number;
}

export interface ClientProfitability {
  revenue: number;
  costs: number;
  profit: number;
  margin: number; // Percentage
  apiCalls: number;
}

export class CostTracker {
  /**
   * Track an operational expense
   * Called after every API request to maintain accurate cost data
   *
   * CRITICAL: Does not throw errors - logs and continues
   * We don't want expense tracking to break the app
   */
  static async trackExpense(params: CostTrackingParams): Promise<void> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      const { error } = await supabaseAdmin
        .from('operational_expenses')
        .insert({
          organization_id: params.organizationId,
          workspace_id: params.workspaceId,
          client_id: params.clientId || null,
          expense_type: params.expenseType,
          description: params.description,
          amount: params.amount,
          tokens_used: params.tokensUsed || null,
          api_endpoint: params.apiEndpoint || null,
          request_id: params.requestId || null,
          metadata: params.metadata || null,
          synced_to_xero: false
        });

      if (error) {
        console.error('❌ Failed to track expense:', error);
        // Don't throw - continue execution
        return;
      }

      // Log success (useful for debugging cost tracking)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `💰 Tracked: ${params.expenseType} - $${params.amount.toFixed(4)}` +
          (params.clientId ? ` (client: ${params.clientId.substring(0, 8)})` : ' (platform-wide)')
        );
      }
    } catch (error) {
      console.error('❌ Cost tracking error:', error);
      // Swallow error - don't let tracking break the app
    }
  }

  /**
   * Get total costs for a client this month
   * Useful for real-time profitability checks
   */
  static async getClientMonthlyCosts(
    clientId: string,
    organizationId: string
  ): Promise<ClientMonthlyCosts> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabaseAdmin
        .from('operational_expenses')
        .select('expense_type, amount')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        console.error('❌ Failed to get client costs:', error);
        return {
          clientId,
          totalCosts: 0,
          costsByType: {} as Record<ExpenseType, number>,
          totalApiCalls: 0
        };
      }

      if (!data || data.length === 0) {
        return {
          clientId,
          totalCosts: 0,
          costsByType: {} as Record<ExpenseType, number>,
          totalApiCalls: 0
        };
      }

      // Calculate totals
      const totalCosts = data.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const totalApiCalls = data.length;

      // Group by expense type
      const costsByType = data.reduce((acc, expense) => {
        const type = expense.expense_type as ExpenseType;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += Number(expense.amount);
        return acc;
      }, {} as Record<ExpenseType, number>);

      return {
        clientId,
        totalCosts,
        costsByType,
        totalApiCalls
      };
    } catch (error) {
      console.error('❌ Error getting client monthly costs:', error);
      return {
        clientId,
        totalCosts: 0,
        costsByType: {} as Record<ExpenseType, number>,
        totalApiCalls: 0
      };
    }
  }

  /**
   * Get profitability for a client
   * Returns revenue, costs, profit, and margin
   */
  static async getClientProfitability(
    clientId: string,
    organizationId: string
  ): Promise<ClientProfitability> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      // Get latest paid invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('client_invoices')
        .select('amount')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const revenue = invoice?.amount ? Number(invoice.amount) : 0;

      // Get costs for this month
      const costs = await this.getClientMonthlyCosts(clientId, organizationId);

      const profit = revenue - costs.totalCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        revenue,
        costs: costs.totalCosts,
        profit,
        margin,
        apiCalls: costs.totalApiCalls
      };
    } catch (error) {
      console.error('❌ Error getting client profitability:', error);
      return {
        revenue: 0,
        costs: 0,
        profit: 0,
        margin: 0,
        apiCalls: 0
      };
    }
  }

  /**
   * Get all unsynced expenses (for Xero bill sync)
   * Called by cron job to sync expenses to Xero as bills
   */
  static async getUnsyncedExpenses(organizationId: string): Promise<any[]> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      const { data, error } = await supabaseAdmin
        .from('operational_expenses')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('synced_to_xero', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to get unsynced expenses:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting unsynced expenses:', error);
      return [];
    }
  }

  /**
   * Mark expenses as synced to Xero
   */
  static async markAsSynced(expenseIds: string[], xeroBillId: string): Promise<void> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      const { error } = await supabaseAdmin
        .from('operational_expenses')
        .update({
          xero_bill_id: xeroBillId,
          synced_to_xero: true
        })
        .in('id', expenseIds);

      if (error) {
        console.error('❌ Failed to mark expenses as synced:', error);
      } else {
        console.log(`✅ Marked ${expenseIds.length} expenses as synced to Xero (bill: ${xeroBillId})`);
      }
    } catch (error) {
      console.error('❌ Error marking expenses as synced:', error);
    }
  }

  /**
   * Get platform-wide costs summary (all clients)
   */
  static async getPlatformCostsSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCosts: number;
    costsByType: Record<ExpenseType, number>;
    costsByClient: Record<string, number>;
    totalApiCalls: number;
  }> {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase');

      let query = supabaseAdmin
        .from('operational_expenses')
        .select('expense_type, amount, client_id')
        .eq('organization_id', organizationId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error('❌ Failed to get platform costs summary:', error);
        return {
          totalCosts: 0,
          costsByType: {} as Record<ExpenseType, number>,
          costsByClient: {},
          totalApiCalls: 0
        };
      }

      // Calculate totals
      const totalCosts = data.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const totalApiCalls = data.length;

      // Group by expense type
      const costsByType = data.reduce((acc, expense) => {
        const type = expense.expense_type as ExpenseType;
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type] += Number(expense.amount);
        return acc;
      }, {} as Record<ExpenseType, number>);

      // Group by client
      const costsByClient = data.reduce((acc, expense) => {
        const clientId = expense.client_id || 'platform-wide';
        if (!acc[clientId]) {
          acc[clientId] = 0;
        }
        acc[clientId] += Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCosts,
        costsByType,
        costsByClient,
        totalApiCalls
      };
    } catch (error) {
      console.error('❌ Error getting platform costs summary:', error);
      return {
        totalCosts: 0,
        costsByType: {} as Record<ExpenseType, number>,
        costsByClient: {},
        totalApiCalls: 0
      };
    }
  }

  /**
   * Calculate cost for AI API call
   * Helper function to standardize cost calculations
   */
  static calculateAICost(params: {
    provider: 'anthropic' | 'openrouter' | 'perplexity';
    model: string;
    promptTokens: number;
    completionTokens: number;
  }): number {
    // Pricing per million tokens (update as APIs change)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      // Anthropic
      'claude-opus-4': { prompt: 15, completion: 75 },
      'claude-sonnet-4-5': { prompt: 3, completion: 15 },
      'claude-haiku-4-5': { prompt: 0.80, completion: 4 },

      // OpenRouter (averaged - actual may vary)
      'openrouter-claude-sonnet-4-5': { prompt: 3, completion: 15 },
      'openrouter-gpt-4-turbo': { prompt: 10, completion: 30 },
      'openrouter-llama-3-70b': { prompt: 0.5, completion: 0.5 },

      // Perplexity
      'sonar': { prompt: 0.005, completion: 0.005 },
      'sonar-pro': { prompt: 0.01, completion: 0.01 }
    };

    const modelPricing = pricing[params.model] || pricing['sonar']; // Default to cheapest

    const promptCost = (params.promptTokens / 1000000) * modelPricing.prompt;
    const completionCost = (params.completionTokens / 1000000) * modelPricing.completion;

    return promptCost + completionCost;
  }
}

export default CostTracker;
