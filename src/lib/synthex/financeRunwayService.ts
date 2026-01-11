/**
 * Synthex Finance Runway Service
 *
 * Phase: D43 - Capital & Runway Dashboard (Founder Finance Brain)
 * Tables: synthex_fin_*
 *
 * Features:
 * - Financial account management
 * - Transaction tracking
 * - Runway calculations
 * - Budget management
 * - Cash flow forecasting
 * - AI-powered insights
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type FINAccountType = 'bank_checking' | 'bank_savings' | 'credit_line' | 'investment' | 'receivables' | 'payables' | 'cash' | 'other';
export type FINEventType = 'revenue' | 'refund' | 'investment' | 'loan' | 'grant' | 'payroll' | 'contractor' | 'software' | 'infrastructure' | 'marketing' | 'legal' | 'rent' | 'tax' | 'transfer' | 'other_income' | 'other_expense';
export type FINDirection = 'inflow' | 'outflow';
export type FINCurrency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'NZD' | 'CAD' | 'SGD';

export interface FINAccount {
  id: string;
  tenant_id: string;
  business_id?: string;
  account_name: string;
  account_type: FINAccountType;
  currency: FINCurrency;
  institution_name?: string;
  account_number_last4?: string;
  opening_balance: number;
  current_balance: number;
  available_credit?: number;
  is_active: boolean;
  is_primary: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FINEvent {
  id: string;
  tenant_id: string;
  business_id?: string;
  account_id: string;
  event_date: string;
  event_type: FINEventType;
  direction: FINDirection;
  amount: number;
  currency: FINCurrency;
  exchange_rate: number;
  amount_base?: number;
  category?: string;
  subcategory?: string;
  description?: string;
  reference?: string;
  counterparty_name?: string;
  counterparty_id?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FINRunwaySnapshot {
  id: string;
  tenant_id: string;
  business_id?: string;
  snapshot_date: string;
  total_cash: number;
  total_receivables: number;
  total_payables: number;
  net_position: number;
  monthly_burn: number;
  monthly_revenue: number;
  net_burn: number;
  runway_months?: number;
  runway_date?: string;
  revenue_growth_rate: number;
  expense_growth_rate: number;
  scenario_type: string;
  scenario_inputs: Record<string, unknown>;
  ai_summary: Record<string, unknown>;
  risk_flags: unknown[];
  recommendations: unknown[];
  created_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FINBudget {
  id: string;
  tenant_id: string;
  business_id?: string;
  budget_name: string;
  budget_period: string;
  period_start: string;
  period_end: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  variance_percent?: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FINForecast {
  id: string;
  tenant_id: string;
  business_id?: string;
  forecast_name: string;
  forecast_type: string;
  start_date: string;
  end_date: string;
  periods: ForecastPeriod[];
  assumptions: Record<string, unknown>;
  ai_adjustments: Record<string, unknown>;
  is_baseline: boolean;
  created_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ForecastPeriod {
  period: string;
  inflows: number;
  outflows: number;
  net: number;
  balance: number;
}

export interface CreateAccountInput {
  account_name: string;
  account_type?: FINAccountType;
  currency?: FINCurrency;
  institution_name?: string;
  account_number_last4?: string;
  opening_balance?: number;
  available_credit?: number;
  is_primary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateEventInput {
  account_id: string;
  event_date: string;
  event_type?: FINEventType;
  direction?: FINDirection;
  amount: number;
  currency?: FINCurrency;
  exchange_rate?: number;
  category?: string;
  subcategory?: string;
  description?: string;
  reference?: string;
  counterparty_name?: string;
  counterparty_id?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  metadata?: Record<string, unknown>;
}

export interface RunwayCalculationInput {
  scenario_type?: string;
  revenue_growth_rate?: number;
  expense_growth_rate?: number;
  include_receivables?: boolean;
  include_payables?: boolean;
  additional_inputs?: Record<string, unknown>;
}

export interface FinanceSummary {
  total_cash: number;
  total_receivables: number;
  total_payables: number;
  net_position: number;
  monthly_burn: number;
  monthly_revenue: number;
  net_burn: number;
  runway_months: number | null;
  runway_date: string | null;
  accounts: FINAccount[];
  recent_transactions: FINEvent[];
  burn_trend: { month: string; burn: number; revenue: number }[];
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 seconds

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Account Operations
// =============================================================================

export async function createAccount(
  tenantId: string,
  businessId: string | undefined,
  input: CreateAccountInput
): Promise<FINAccount> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fin_accounts')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      account_name: input.account_name,
      account_type: input.account_type || 'bank_checking',
      currency: input.currency || 'AUD',
      institution_name: input.institution_name,
      account_number_last4: input.account_number_last4,
      opening_balance: input.opening_balance || 0,
      current_balance: input.opening_balance || 0,
      available_credit: input.available_credit,
      is_primary: input.is_primary || false,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create account: ${error.message}`);
  return data;
}

export async function listAccounts(
  tenantId: string,
  options?: {
    businessId?: string;
    accountType?: FINAccountType;
    isActive?: boolean;
    limit?: number;
  }
): Promise<FINAccount[]> {
  let query = supabaseAdmin
    .from('synthex_fin_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.accountType) {
    query = query.eq('account_type', options.accountType);
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list accounts: ${error.message}`);
  return data || [];
}

export async function getAccount(accountId: string): Promise<FINAccount | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fin_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get account: ${error.message}`);
  }
  return data;
}

export async function updateAccount(
  accountId: string,
  updates: Partial<CreateAccountInput>
): Promise<FINAccount> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fin_accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update account: ${error.message}`);
  return data;
}

export async function deleteAccount(accountId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_fin_accounts')
    .delete()
    .eq('id', accountId);

  if (error) throw new Error(`Failed to delete account: ${error.message}`);
}

// =============================================================================
// Event/Transaction Operations
// =============================================================================

export async function createEvent(
  tenantId: string,
  businessId: string | undefined,
  input: CreateEventInput
): Promise<FINEvent> {
  const amount_base = input.exchange_rate
    ? input.amount * input.exchange_rate
    : input.amount;

  const { data, error } = await supabaseAdmin
    .from('synthex_fin_events')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      account_id: input.account_id,
      event_date: input.event_date,
      event_type: input.event_type || 'other_expense',
      direction: input.direction || 'outflow',
      amount: input.amount,
      currency: input.currency || 'AUD',
      exchange_rate: input.exchange_rate || 1.0,
      amount_base,
      category: input.category,
      subcategory: input.subcategory,
      description: input.description,
      reference: input.reference,
      counterparty_name: input.counterparty_name,
      counterparty_id: input.counterparty_id,
      is_recurring: input.is_recurring || false,
      recurring_frequency: input.recurring_frequency,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create event: ${error.message}`);
  return data;
}

export async function listEvents(
  tenantId: string,
  options?: {
    businessId?: string;
    accountId?: string;
    eventType?: FINEventType;
    direction?: FINDirection;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<FINEvent[]> {
  let query = supabaseAdmin
    .from('synthex_fin_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.accountId) {
    query = query.eq('account_id', options.accountId);
  }
  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }
  if (options?.direction) {
    query = query.eq('direction', options.direction);
  }
  if (options?.startDate) {
    query = query.gte('event_date', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('event_date', options.endDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list events: ${error.message}`);
  return data || [];
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_fin_events')
    .delete()
    .eq('id', eventId);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
}

// =============================================================================
// Runway Calculations
// =============================================================================

export async function calculateRunway(
  tenantId: string,
  businessId: string | undefined,
  input: RunwayCalculationInput = {}
): Promise<FINRunwaySnapshot> {
  // Get all accounts
  const accounts = await listAccounts(tenantId, {
    businessId,
    isActive: true,
  });

  // Calculate totals
  let totalCash = 0;
  let totalReceivables = 0;
  let totalPayables = 0;

  for (const account of accounts) {
    if (account.account_type === 'receivables') {
      totalReceivables += account.current_balance;
    } else if (account.account_type === 'payables') {
      totalPayables += account.current_balance;
    } else {
      totalCash += account.current_balance;
    }
  }

  // Calculate monthly burn (last 3 months average)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const events = await listEvents(tenantId, {
    businessId,
    startDate: threeMonthsAgo.toISOString().split('T')[0],
  });

  let totalExpenses = 0;
  let totalIncome = 0;

  for (const event of events) {
    if (event.direction === 'outflow') {
      totalExpenses += event.amount;
    } else {
      totalIncome += event.amount;
    }
  }

  const monthlyBurn = totalExpenses / 3;
  const monthlyRevenue = totalIncome / 3;
  const netBurn = monthlyBurn - monthlyRevenue;

  // Calculate runway
  let runwayMonths: number | null = null;
  let runwayDate: string | null = null;

  const effectiveCash = input.include_receivables !== false
    ? totalCash + totalReceivables
    : totalCash;

  const effectivePosition = input.include_payables !== false
    ? effectiveCash - totalPayables
    : effectiveCash;

  if (netBurn > 0) {
    runwayMonths = Math.round((effectivePosition / netBurn) * 100) / 100;
    const runwayDateObj = new Date();
    runwayDateObj.setMonth(runwayDateObj.getMonth() + Math.floor(runwayMonths));
    runwayDate = runwayDateObj.toISOString().split('T')[0];
  } else if (netBurn <= 0) {
    runwayMonths = 999; // Infinite runway indicator
  }

  // Create snapshot
  const { data, error } = await supabaseAdmin
    .from('synthex_fin_runway_snapshots')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      snapshot_date: new Date().toISOString().split('T')[0],
      total_cash: totalCash,
      total_receivables: totalReceivables,
      total_payables: totalPayables,
      monthly_burn: monthlyBurn,
      monthly_revenue: monthlyRevenue,
      runway_months: runwayMonths,
      runway_date: runwayDate,
      revenue_growth_rate: input.revenue_growth_rate || 0,
      expense_growth_rate: input.expense_growth_rate || 0,
      scenario_type: input.scenario_type || 'conservative',
      scenario_inputs: input.additional_inputs || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create runway snapshot: ${error.message}`);
  return data;
}

export async function getLatestRunwaySnapshot(
  tenantId: string,
  businessId?: string
): Promise<FINRunwaySnapshot | null> {
  let query = supabaseAdmin
    .from('synthex_fin_runway_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false })
    .limit(1);

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get runway snapshot: ${error.message}`);
  return data?.[0] || null;
}

export async function listRunwaySnapshots(
  tenantId: string,
  options?: {
    businessId?: string;
    limit?: number;
  }
): Promise<FINRunwaySnapshot[]> {
  let query = supabaseAdmin
    .from('synthex_fin_runway_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('snapshot_date', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list runway snapshots: ${error.message}`);
  return data || [];
}

// =============================================================================
// Financial Summary
// =============================================================================

export async function getFinanceSummary(
  tenantId: string,
  businessId?: string
): Promise<FinanceSummary> {
  // Get accounts
  const accounts = await listAccounts(tenantId, { businessId, isActive: true });

  // Calculate totals
  let totalCash = 0;
  let totalReceivables = 0;
  let totalPayables = 0;

  for (const account of accounts) {
    if (account.account_type === 'receivables') {
      totalReceivables += account.current_balance;
    } else if (account.account_type === 'payables') {
      totalPayables += account.current_balance;
    } else {
      totalCash += account.current_balance;
    }
  }

  // Get recent transactions
  const recentTransactions = await listEvents(tenantId, {
    businessId,
    limit: 20,
  });

  // Calculate burn trend (last 6 months)
  const burnTrend: { month: string; burn: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthEvents = await listEvents(tenantId, {
      businessId,
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
    });

    let burn = 0;
    let revenue = 0;
    for (const event of monthEvents) {
      if (event.direction === 'outflow') {
        burn += event.amount;
      } else {
        revenue += event.amount;
      }
    }

    burnTrend.push({
      month: monthStart.toISOString().slice(0, 7),
      burn,
      revenue,
    });
  }

  // Calculate averages
  const avgBurn = burnTrend.reduce((sum, m) => sum + m.burn, 0) / burnTrend.length;
  const avgRevenue = burnTrend.reduce((sum, m) => sum + m.revenue, 0) / burnTrend.length;
  const netBurn = avgBurn - avgRevenue;

  // Calculate runway
  const netPosition = totalCash + totalReceivables - totalPayables;
  let runwayMonths: number | null = null;
  let runwayDate: string | null = null;

  if (netBurn > 0) {
    runwayMonths = Math.round((netPosition / netBurn) * 100) / 100;
    const runwayDateObj = new Date();
    runwayDateObj.setMonth(runwayDateObj.getMonth() + Math.floor(runwayMonths));
    runwayDate = runwayDateObj.toISOString().split('T')[0];
  } else if (netBurn <= 0 && netPosition >= 0) {
    runwayMonths = 999;
  }

  return {
    total_cash: totalCash,
    total_receivables: totalReceivables,
    total_payables: totalPayables,
    net_position: netPosition,
    monthly_burn: avgBurn,
    monthly_revenue: avgRevenue,
    net_burn: netBurn,
    runway_months: runwayMonths,
    runway_date: runwayDate,
    accounts,
    recent_transactions: recentTransactions,
    burn_trend: burnTrend,
  };
}

// =============================================================================
// Budget Operations
// =============================================================================

export async function createBudget(
  tenantId: string,
  businessId: string | undefined,
  input: {
    budget_name: string;
    category: string;
    budgeted_amount: number;
    period_start: string;
    period_end: string;
    budget_period?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<FINBudget> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fin_budgets')
    .insert({
      tenant_id: tenantId,
      business_id: businessId,
      budget_name: input.budget_name,
      category: input.category,
      budgeted_amount: input.budgeted_amount,
      period_start: input.period_start,
      period_end: input.period_end,
      budget_period: input.budget_period || 'monthly',
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create budget: ${error.message}`);
  return data;
}

export async function listBudgets(
  tenantId: string,
  options?: {
    businessId?: string;
    isActive?: boolean;
  }
): Promise<FINBudget[]> {
  let query = supabaseAdmin
    .from('synthex_fin_budgets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });

  if (options?.businessId) {
    query = query.eq('business_id', options.businessId);
  }
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list budgets: ${error.message}`);
  return data || [];
}

// =============================================================================
// AI Analysis
// =============================================================================

export async function aiAnalyzeFinances(
  summary: FinanceSummary,
  options?: {
    includeRecommendations?: boolean;
    focusAreas?: string[];
  }
): Promise<{
  summary: string;
  health_score: number;
  risk_flags: string[];
  recommendations: string[];
  insights: Record<string, unknown>;
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze this business's financial position and provide insights:

FINANCIAL SUMMARY:
- Total Cash: $${summary.total_cash.toLocaleString()}
- Receivables: $${summary.total_receivables.toLocaleString()}
- Payables: $${summary.total_payables.toLocaleString()}
- Net Position: $${summary.net_position.toLocaleString()}

BURN METRICS:
- Monthly Burn: $${summary.monthly_burn.toLocaleString()}
- Monthly Revenue: $${summary.monthly_revenue.toLocaleString()}
- Net Burn: $${summary.net_burn.toLocaleString()}
- Runway: ${summary.runway_months === 999 ? 'Infinite (cash flow positive)' : summary.runway_months ? `${summary.runway_months} months` : 'Cannot calculate'}

BURN TREND (Last 6 Months):
${summary.burn_trend.map(m => `${m.month}: Burn $${m.burn.toLocaleString()}, Revenue $${m.revenue.toLocaleString()}`).join('\n')}

${options?.focusAreas ? `FOCUS AREAS: ${options.focusAreas.join(', ')}` : ''}

Provide your analysis in JSON format:
{
  "summary": "2-3 sentence executive summary",
  "health_score": 0-100 score,
  "risk_flags": ["array of risk concerns"],
  "recommendations": ["array of actionable recommendations"],
  "insights": {
    "burn_trend": "analysis of burn trend",
    "runway_assessment": "runway health assessment",
    "cash_management": "cash management observations"
  }
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: content.text.slice(0, 500),
      health_score: 50,
      risk_flags: [],
      recommendations: [],
      insights: {},
    };
  }
}

export async function aiGenerateForecast(
  summary: FinanceSummary,
  options: {
    forecast_months: number;
    scenario_type: 'conservative' | 'moderate' | 'optimistic';
    assumptions?: Record<string, unknown>;
  }
): Promise<{
  periods: ForecastPeriod[];
  assumptions: Record<string, unknown>;
  commentary: string;
}> {
  const client = getAnthropicClient();

  const scenarioMultipliers = {
    conservative: { revenue: 0.95, expense: 1.05 },
    moderate: { revenue: 1.0, expense: 1.0 },
    optimistic: { revenue: 1.1, expense: 0.95 },
  };

  const multipliers = scenarioMultipliers[options.scenario_type];

  const prompt = `Generate a ${options.forecast_months}-month cash flow forecast for this business:

CURRENT STATE:
- Net Position: $${summary.net_position.toLocaleString()}
- Monthly Revenue: $${summary.monthly_revenue.toLocaleString()}
- Monthly Burn: $${summary.monthly_burn.toLocaleString()}

SCENARIO: ${options.scenario_type}
- Revenue multiplier: ${multipliers.revenue}
- Expense multiplier: ${multipliers.expense}

${options.assumptions ? `ADDITIONAL ASSUMPTIONS: ${JSON.stringify(options.assumptions)}` : ''}

Generate the forecast in JSON format:
{
  "periods": [
    { "period": "YYYY-MM", "inflows": number, "outflows": number, "net": number, "balance": number }
  ],
  "assumptions": { "key assumptions used" },
  "commentary": "Brief analysis of the forecast"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI');
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Generate simple forecast fallback
    const periods: ForecastPeriod[] = [];
    let balance = summary.net_position;
    const today = new Date();

    for (let i = 1; i <= options.forecast_months; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() + i);
      const period = date.toISOString().slice(0, 7);

      const inflows = summary.monthly_revenue * multipliers.revenue;
      const outflows = summary.monthly_burn * multipliers.expense;
      const net = inflows - outflows;
      balance += net;

      periods.push({ period, inflows, outflows, net, balance });
    }

    return {
      periods,
      assumptions: {
        scenario: options.scenario_type,
        revenue_growth: multipliers.revenue,
        expense_growth: multipliers.expense,
      },
      commentary: `${options.scenario_type} forecast based on current trends.`,
    };
  }
}
