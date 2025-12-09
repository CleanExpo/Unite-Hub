/**
 * Synthex Founder KPI Service
 *
 * Phase: D41 - Founder Control Tower + Cross-Business KPIs
 * Tables: synthex_fct_*
 *
 * Features:
 * - KPI definition management
 * - KPI value tracking
 * - Alert management
 * - Dashboard configuration
 * - Cross-business comparisons
 * - Goal tracking
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type FCTKpiCategory = 'revenue' | 'growth' | 'engagement' | 'acquisition' | 'retention' | 'efficiency' | 'quality' | 'custom';
export type FCTAlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type FCTAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';
export type FCTTrendDirection = 'up' | 'down' | 'stable' | 'volatile';
export type FCTWidgetType = 'kpi_card' | 'chart_line' | 'chart_bar' | 'chart_pie' | 'table' | 'alert_feed' | 'comparison' | 'heatmap' | 'custom';

export interface FCTKpiDefinition {
  id: string;
  tenant_id: string;
  kpi_name: string;
  kpi_code: string;
  description?: string;
  category: FCTKpiCategory;
  calculation_formula?: string;
  data_source?: string;
  unit?: string;
  decimals: number;
  display_format?: string;
  color_positive: string;
  color_negative: string;
  icon_name?: string;
  target_value?: number;
  target_comparison?: string;
  aggregation_type: string;
  time_granularity: string;
  is_active: boolean;
  is_global: boolean;
  show_on_dashboard: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FCTKpiValue {
  id: string;
  tenant_id: string;
  business_id?: string;
  kpi_definition_id: string;
  value: number;
  previous_value?: number;
  change_amount?: number;
  change_percentage?: number;
  trend_direction: FCTTrendDirection;
  period_start: string;
  period_end: string;
  source_type?: string;
  source_reference?: string;
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface FCTAlert {
  id: string;
  tenant_id: string;
  business_id?: string;
  alert_type: string;
  title: string;
  message?: string;
  severity: FCTAlertSeverity;
  status: FCTAlertStatus;
  kpi_definition_id?: string;
  kpi_value?: number;
  threshold_value?: number;
  action_url?: string;
  action_label?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  snoozed_until?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FCTAlertRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description?: string;
  is_active: boolean;
  kpi_definition_id?: string;
  condition_type: string;
  threshold_value?: number;
  threshold_percentage?: number;
  severity: FCTAlertSeverity;
  cooldown_minutes: number;
  notify_email: boolean;
  notify_slack: boolean;
  notify_webhook?: string;
  business_ids?: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
}

export interface FCTDashboard {
  id: string;
  tenant_id: string;
  dashboard_name: string;
  description?: string;
  is_default: boolean;
  layout_type: string;
  columns: number;
  is_shared: boolean;
  owner_user_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FCTDashboardWidget {
  id: string;
  tenant_id: string;
  dashboard_id: string;
  widget_name: string;
  widget_type: FCTWidgetType;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  kpi_definition_ids?: string[];
  business_ids?: string[];
  time_range: string;
  comparison_type?: string;
  chart_type?: string;
  color_scheme: string;
  show_legend: boolean;
  show_labels: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FCTGoal {
  id: string;
  tenant_id: string;
  business_id?: string;
  goal_name: string;
  description?: string;
  kpi_definition_id?: string;
  target_value: number;
  current_value?: number;
  start_date: string;
  end_date: string;
  progress_percentage: number;
  is_achieved: boolean;
  achieved_at?: string;
  milestones: Array<{
    name: string;
    value: number;
    achieved: boolean;
    achieved_at?: string;
  }>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FCTComparison {
  id: string;
  tenant_id: string;
  comparison_name: string;
  description?: string;
  kpi_definition_id: string;
  business_ids: string[];
  time_range: string;
  comparison_period?: string;
  last_computed_at?: string;
  results?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Input types
export interface CreateKpiDefinitionInput {
  kpi_name: string;
  kpi_code: string;
  description?: string;
  category?: FCTKpiCategory;
  calculation_formula?: string;
  data_source?: string;
  unit?: string;
  decimals?: number;
  display_format?: string;
  target_value?: number;
  target_comparison?: string;
  aggregation_type?: string;
  time_granularity?: string;
  is_global?: boolean;
  show_on_dashboard?: boolean;
  icon_name?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordKpiValueInput {
  business_id?: string;
  kpi_definition_id: string;
  value: number;
  period_start: string;
  period_end: string;
  source_type?: string;
  source_reference?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60-second TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic();
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// KPI Definition Operations
// =============================================================================

/**
 * Create a KPI definition
 */
export async function createKpiDefinition(
  tenantId: string,
  input: CreateKpiDefinitionInput
): Promise<FCTKpiDefinition> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_kpi_definitions')
    .insert({
      tenant_id: tenantId,
      kpi_name: input.kpi_name,
      kpi_code: input.kpi_code.toLowerCase().replace(/\s+/g, '_'),
      description: input.description,
      category: input.category || 'custom',
      calculation_formula: input.calculation_formula,
      data_source: input.data_source || 'manual',
      unit: input.unit,
      decimals: input.decimals ?? 2,
      display_format: input.display_format,
      target_value: input.target_value,
      target_comparison: input.target_comparison,
      aggregation_type: input.aggregation_type || 'sum',
      time_granularity: input.time_granularity || 'daily',
      is_global: input.is_global ?? false,
      show_on_dashboard: input.show_on_dashboard ?? true,
      icon_name: input.icon_name,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get KPI definition by ID
 */
export async function getKpiDefinition(kpiId: string): Promise<FCTKpiDefinition | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_kpi_definitions')
    .select('*')
    .eq('id', kpiId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * List KPI definitions for a tenant
 */
export async function listKpiDefinitions(
  tenantId: string,
  filters?: {
    category?: FCTKpiCategory;
    is_active?: boolean;
    show_on_dashboard?: boolean;
  }
): Promise<FCTKpiDefinition[]> {
  let query = supabaseAdmin
    .from('synthex_fct_kpi_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')
    .order('kpi_name');

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.show_on_dashboard !== undefined) {
    query = query.eq('show_on_dashboard', filters.show_on_dashboard);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update KPI definition
 */
export async function updateKpiDefinition(
  kpiId: string,
  updates: Partial<CreateKpiDefinitionInput> & {
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<FCTKpiDefinition> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_kpi_definitions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', kpiId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete KPI definition
 */
export async function deleteKpiDefinition(kpiId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_fct_kpi_definitions')
    .delete()
    .eq('id', kpiId);

  if (error) throw error;
}

// =============================================================================
// KPI Value Operations
// =============================================================================

/**
 * Record a KPI value
 */
export async function recordKpiValue(
  tenantId: string,
  input: RecordKpiValueInput
): Promise<FCTKpiValue> {
  // Get previous value for trend calculation
  const { data: previousData } = await supabaseAdmin
    .from('synthex_fct_kpi_values')
    .select('value')
    .eq('kpi_definition_id', input.kpi_definition_id)
    .eq('business_id', input.business_id || null)
    .lt('period_start', input.period_start)
    .order('period_start', { ascending: false })
    .limit(1)
    .single();

  const previousValue = previousData?.value;
  let changeAmount: number | null = null;
  let changePercentage: number | null = null;
  let trendDirection: FCTTrendDirection = 'stable';

  if (previousValue !== undefined && previousValue !== null) {
    changeAmount = input.value - previousValue;
    changePercentage = previousValue !== 0
      ? (changeAmount / previousValue) * 100
      : 0;

    // Calculate trend
    if (Math.abs(changePercentage) > 20) {
      trendDirection = 'volatile';
    } else if (changePercentage > 2) {
      trendDirection = 'up';
    } else if (changePercentage < -2) {
      trendDirection = 'down';
    }
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_fct_kpi_values')
    .upsert({
      tenant_id: tenantId,
      business_id: input.business_id,
      kpi_definition_id: input.kpi_definition_id,
      value: input.value,
      previous_value: previousValue,
      change_amount: changeAmount,
      change_percentage: changePercentage,
      trend_direction: trendDirection,
      period_start: input.period_start,
      period_end: input.period_end,
      source_type: input.source_type,
      source_reference: input.source_reference,
      metadata: input.metadata || {},
      recorded_at: new Date().toISOString(),
    }, {
      onConflict: 'kpi_definition_id,business_id,period_start',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get latest KPI values
 */
export async function getLatestKpiValues(
  tenantId: string,
  businessId?: string
): Promise<Array<FCTKpiValue & { kpi: FCTKpiDefinition }>> {
  const query = supabaseAdmin
    .from('synthex_fct_kpi_values')
    .select(`
      *,
      kpi:synthex_fct_kpi_definitions(*)
    `)
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });

  if (businessId) {
    query.eq('business_id', businessId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get unique by KPI
  const uniqueByKpi = new Map<string, FCTKpiValue & { kpi: FCTKpiDefinition }>();
  for (const item of (data || [])) {
    const key = `${item.kpi_definition_id}-${item.business_id || 'global'}`;
    if (!uniqueByKpi.has(key)) {
      uniqueByKpi.set(key, item);
    }
  }

  return Array.from(uniqueByKpi.values());
}

/**
 * Get KPI history
 */
export async function getKpiHistory(
  kpiDefinitionId: string,
  businessId?: string,
  limit: number = 30
): Promise<FCTKpiValue[]> {
  let query = supabaseAdmin
    .from('synthex_fct_kpi_values')
    .select('*')
    .eq('kpi_definition_id', kpiDefinitionId)
    .order('period_start', { ascending: false })
    .limit(limit);

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// =============================================================================
// Alert Operations
// =============================================================================

/**
 * Create an alert
 */
export async function createAlert(
  tenantId: string,
  input: {
    alert_type: string;
    title: string;
    message?: string;
    severity?: FCTAlertSeverity;
    business_id?: string;
    kpi_definition_id?: string;
    kpi_value?: number;
    threshold_value?: number;
    action_url?: string;
    action_label?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<FCTAlert> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_alerts')
    .insert({
      tenant_id: tenantId,
      ...input,
      severity: input.severity || 'info',
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List alerts
 */
export async function listAlerts(
  tenantId: string,
  filters?: {
    status?: FCTAlertStatus;
    severity?: FCTAlertSeverity;
    business_id?: string;
    limit?: number;
  }
): Promise<FCTAlert[]> {
  let query = supabaseAdmin
    .from('synthex_fct_alerts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.business_id) {
    query = query.eq('business_id', filters.business_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<FCTAlert> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Resolve alert
 */
export async function resolveAlert(
  alertId: string,
  userId: string,
  notes?: string
): Promise<FCTAlert> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Snooze alert
 */
export async function snoozeAlert(
  alertId: string,
  snoozedUntil: string
): Promise<FCTAlert> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_alerts')
    .update({
      status: 'snoozed',
      snoozed_until: snoozedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// Alert Rule Operations
// =============================================================================

/**
 * Create alert rule
 */
export async function createAlertRule(
  tenantId: string,
  input: {
    rule_name: string;
    description?: string;
    kpi_definition_id?: string;
    condition_type: string;
    threshold_value?: number;
    threshold_percentage?: number;
    severity?: FCTAlertSeverity;
    cooldown_minutes?: number;
    notify_email?: boolean;
    notify_slack?: boolean;
    notify_webhook?: string;
    business_ids?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<FCTAlertRule> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_alert_rules')
    .insert({
      tenant_id: tenantId,
      ...input,
      severity: input.severity || 'warning',
      cooldown_minutes: input.cooldown_minutes || 60,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List alert rules
 */
export async function listAlertRules(
  tenantId: string,
  activeOnly: boolean = true
): Promise<FCTAlertRule[]> {
  let query = supabaseAdmin
    .from('synthex_fct_alert_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('rule_name');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// =============================================================================
// Dashboard Operations
// =============================================================================

/**
 * Create dashboard
 */
export async function createDashboard(
  tenantId: string,
  input: {
    dashboard_name: string;
    description?: string;
    is_default?: boolean;
    layout_type?: string;
    columns?: number;
    owner_user_id?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<FCTDashboard> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_dashboards')
    .insert({
      tenant_id: tenantId,
      ...input,
      is_default: input.is_default ?? false,
      layout_type: input.layout_type || 'grid',
      columns: input.columns || 4,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List dashboards
 */
export async function listDashboards(tenantId: string): Promise<FCTDashboard[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_dashboards')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false })
    .order('dashboard_name');

  if (error) throw error;
  return data || [];
}

/**
 * Get dashboard with widgets
 */
export async function getDashboardWithWidgets(dashboardId: string): Promise<{
  dashboard: FCTDashboard;
  widgets: FCTDashboardWidget[];
} | null> {
  const { data: dashboard, error: dashError } = await supabaseAdmin
    .from('synthex_fct_dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single();

  if (dashError && dashError.code !== 'PGRST116') throw dashError;
  if (!dashboard) return null;

  const { data: widgets, error: widgetError } = await supabaseAdmin
    .from('synthex_fct_dashboard_widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .order('grid_y')
    .order('grid_x');

  if (widgetError) throw widgetError;

  return { dashboard, widgets: widgets || [] };
}

/**
 * Add widget to dashboard
 */
export async function addDashboardWidget(
  tenantId: string,
  dashboardId: string,
  input: {
    widget_name: string;
    widget_type?: FCTWidgetType;
    grid_x?: number;
    grid_y?: number;
    grid_width?: number;
    grid_height?: number;
    kpi_definition_ids?: string[];
    business_ids?: string[];
    time_range?: string;
    comparison_type?: string;
    chart_type?: string;
    config?: Record<string, unknown>;
  }
): Promise<FCTDashboardWidget> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_dashboard_widgets')
    .insert({
      tenant_id: tenantId,
      dashboard_id: dashboardId,
      ...input,
      widget_type: input.widget_type || 'kpi_card',
      time_range: input.time_range || '30d',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// Goal Operations
// =============================================================================

/**
 * Create goal
 */
export async function createGoal(
  tenantId: string,
  input: {
    goal_name: string;
    description?: string;
    business_id?: string;
    kpi_definition_id?: string;
    target_value: number;
    start_date: string;
    end_date: string;
    milestones?: Array<{ name: string; value: number }>;
    metadata?: Record<string, unknown>;
  }
): Promise<FCTGoal> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_goals')
    .insert({
      tenant_id: tenantId,
      ...input,
      milestones: (input.milestones || []).map(m => ({
        ...m,
        achieved: false,
      })),
      progress_percentage: 0,
      is_achieved: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List goals
 */
export async function listGoals(
  tenantId: string,
  businessId?: string
): Promise<FCTGoal[]> {
  let query = supabaseAdmin
    .from('synthex_fct_goals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('end_date');

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<FCTGoal> {
  const { data: goal, error: getError } = await supabaseAdmin
    .from('synthex_fct_goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (getError) throw getError;

  const progressPercentage = Math.min(100, (currentValue / goal.target_value) * 100);
  const isAchieved = currentValue >= goal.target_value;

  // Update milestones
  const milestones = (goal.milestones || []).map((m: { name: string; value: number; achieved: boolean; achieved_at?: string }) => ({
    ...m,
    achieved: currentValue >= m.value,
    achieved_at: m.achieved ? m.achieved_at : (currentValue >= m.value ? new Date().toISOString() : undefined),
  }));

  const { data, error } = await supabaseAdmin
    .from('synthex_fct_goals')
    .update({
      current_value: currentValue,
      progress_percentage: progressPercentage,
      is_achieved: isAchieved,
      achieved_at: isAchieved && !goal.is_achieved ? new Date().toISOString() : goal.achieved_at,
      milestones,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// Cross-Business Comparison Operations
// =============================================================================

/**
 * Create comparison
 */
export async function createComparison(
  tenantId: string,
  input: {
    comparison_name: string;
    description?: string;
    kpi_definition_id: string;
    business_ids: string[];
    time_range?: string;
    comparison_period?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<FCTComparison> {
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_comparisons')
    .insert({
      tenant_id: tenantId,
      ...input,
      time_range: input.time_range || '30d',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Compute comparison results
 */
export async function computeComparisonResults(
  comparisonId: string
): Promise<FCTComparison> {
  const { data: comparison, error: getError } = await supabaseAdmin
    .from('synthex_fct_comparisons')
    .select('*')
    .eq('id', comparisonId)
    .single();

  if (getError) throw getError;

  // Get latest values for each business
  const results: Record<string, {
    business_id: string;
    value: number;
    change_percentage?: number;
    trend: FCTTrendDirection;
  }> = {};

  for (const businessId of comparison.business_ids) {
    const { data: kpiValue } = await supabaseAdmin
      .from('synthex_fct_kpi_values')
      .select('*')
      .eq('kpi_definition_id', comparison.kpi_definition_id)
      .eq('business_id', businessId)
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    if (kpiValue) {
      results[businessId] = {
        business_id: businessId,
        value: kpiValue.value,
        change_percentage: kpiValue.change_percentage,
        trend: kpiValue.trend_direction,
      };
    }
  }

  // Update comparison with results
  const { data, error } = await supabaseAdmin
    .from('synthex_fct_comparisons')
    .update({
      results,
      last_computed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', comparisonId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================================================
// AI Features
// =============================================================================

/**
 * AI-analyze KPI trends and provide insights
 */
export async function aiAnalyzeKpiTrends(
  kpiDefinition: FCTKpiDefinition,
  history: FCTKpiValue[]
): Promise<{
  summary: string;
  insights: string[];
  predictions: Array<{ period: string; predicted_value: number; confidence: number }>;
  recommendations: string[];
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are a business intelligence analyst.
Analyze the KPI trend data and provide:
1. A brief summary of the trend
2. Key insights about the pattern
3. Short-term predictions (next 3 periods)
4. Actionable recommendations

Respond in JSON format:
{
  "summary": "Brief trend summary",
  "insights": ["insight 1", "insight 2"],
  "predictions": [
    {"period": "next_week", "predicted_value": 1000, "confidence": 0.8}
  ],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `KPI: ${kpiDefinition.kpi_name} (${kpiDefinition.kpi_code})
Category: ${kpiDefinition.category}
Unit: ${kpiDefinition.unit || 'value'}
Target: ${kpiDefinition.target_value || 'not set'}

Historical Values (latest first):
${history.slice(0, 12).map(v => `${v.period_start}: ${v.value} (${v.trend_direction})`).join('\n')}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}

/**
 * AI-suggest KPIs based on industry
 */
export async function aiSuggestKpis(
  industry: string,
  existingKpis: FCTKpiDefinition[]
): Promise<Array<{
  kpi_code: string;
  kpi_name: string;
  category: FCTKpiCategory;
  description: string;
  unit: string;
  importance: 'high' | 'medium' | 'low';
}>> {
  const client = getAnthropicClient();

  const existingCodes = existingKpis.map(k => k.kpi_code);

  const systemPrompt = `You are a business metrics expert.
Suggest additional KPIs for the given industry, excluding already tracked ones.

Respond in JSON format:
{
  "suggestions": [
    {
      "kpi_code": "cac",
      "kpi_name": "Customer Acquisition Cost",
      "category": "acquisition",
      "description": "Average cost to acquire a new customer",
      "unit": "$",
      "importance": "high"
    }
  ]
}

Categories: revenue, growth, engagement, acquisition, retention, efficiency, quality, custom`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: `Industry: ${industry}\nExisting KPIs: ${existingCodes.join(', ') || 'none'}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const parsed = JSON.parse(content.text);
  return parsed.suggestions || [];
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get control tower stats
 */
export async function getControlTowerStats(tenantId: string): Promise<{
  total_kpis: number;
  active_kpis: number;
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  total_goals: number;
  achieved_goals: number;
  dashboards: number;
}> {
  const [kpisRes, alertsRes, goalsRes, dashboardsRes] = await Promise.all([
    supabaseAdmin
      .from('synthex_fct_kpi_definitions')
      .select('id, is_active')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_fct_alerts')
      .select('id, status, severity')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_fct_goals')
      .select('id, is_achieved')
      .eq('tenant_id', tenantId),
    supabaseAdmin
      .from('synthex_fct_dashboards')
      .select('id')
      .eq('tenant_id', tenantId),
  ]);

  const kpis = kpisRes.data || [];
  const alerts = alertsRes.data || [];
  const goals = goalsRes.data || [];
  const dashboards = dashboardsRes.data || [];

  return {
    total_kpis: kpis.length,
    active_kpis: kpis.filter(k => k.is_active).length,
    total_alerts: alerts.length,
    active_alerts: alerts.filter(a => a.status === 'active').length,
    critical_alerts: alerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
    total_goals: goals.length,
    achieved_goals: goals.filter(g => g.is_achieved).length,
    dashboards: dashboards.length,
  };
}

// =============================================================================
// Seed Default KPIs
// =============================================================================

const DEFAULT_KPIS: Omit<CreateKpiDefinitionInput, 'kpi_name' | 'kpi_code'>[] = [];

export async function seedDefaultKpis(tenantId: string): Promise<void> {
  const defaults: CreateKpiDefinitionInput[] = [
    { kpi_code: 'mrr', kpi_name: 'Monthly Recurring Revenue', category: 'revenue', unit: '$', display_format: 'currency' },
    { kpi_code: 'arr', kpi_name: 'Annual Recurring Revenue', category: 'revenue', unit: '$', display_format: 'currency' },
    { kpi_code: 'revenue_growth', kpi_name: 'Revenue Growth Rate', category: 'growth', unit: '%', display_format: 'percentage' },
    { kpi_code: 'cac', kpi_name: 'Customer Acquisition Cost', category: 'acquisition', unit: '$', display_format: 'currency' },
    { kpi_code: 'ltv', kpi_name: 'Customer Lifetime Value', category: 'retention', unit: '$', display_format: 'currency' },
    { kpi_code: 'churn_rate', kpi_name: 'Customer Churn Rate', category: 'retention', unit: '%', display_format: 'percentage' },
    { kpi_code: 'nps', kpi_name: 'Net Promoter Score', category: 'quality', unit: '', display_format: 'number' },
    { kpi_code: 'conversion_rate', kpi_name: 'Lead Conversion Rate', category: 'acquisition', unit: '%', display_format: 'percentage' },
    { kpi_code: 'active_users', kpi_name: 'Monthly Active Users', category: 'engagement', unit: '', display_format: 'number' },
    { kpi_code: 'gross_margin', kpi_name: 'Gross Profit Margin', category: 'efficiency', unit: '%', display_format: 'percentage' },
  ];

  for (const kpi of defaults) {
    try {
      await createKpiDefinition(tenantId, kpi);
    } catch {
      // Ignore duplicates
    }
  }
}
