/**
 * Founder Command Center Service
 *
 * Phase: D52 - Founder Command Center & Cross-Business Insights
 * Tables: founder_panels, founder_panel_widgets, founder_kpi_snapshots
 *
 * Features:
 * - Customizable dashboard panels with widgets
 * - KPI snapshots across all businesses
 * - AI-powered cross-business insights and recommendations
 * - Trend analysis and anomaly detection
 *
 * Note: Founder tables are NOT RLS-protected - scoped by founder_user_id in application logic
 */

import { supabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Types
// =============================================================================

export type WidgetType = 'kpi_card' | 'chart' | 'table' | 'alert_list' | 'trend_graph';
export type KPIScope = 'all_businesses' | 'business' | 'campaign' | 'channel';

export interface Panel {
  id: string;
  founder_user_id: string;
  slug: string;
  name: string;
  description?: string;
  layout?: {
    grid?: { cols: number; rows: number };
    widgets?: string[];
  };
  default_panel: boolean;
  filters?: {
    businesses?: string[];
    dateRange?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PanelWidget {
  id: string;
  panel_id: string;
  widget_type: WidgetType;
  title?: string;
  config?: {
    metric?: string;
    visualization?: string;
    aggregation?: string;
    [key: string]: unknown;
  };
  position?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  created_at: string;
}

export interface KPISnapshot {
  id: string;
  founder_user_id: string;
  captured_at: string;
  scope: KPIScope;
  source: string;
  metrics: Record<string, unknown>;
  ai_summary?: {
    insights?: string[];
    alerts?: Array<{ severity: string; message: string }>;
    recommendations?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface CreatePanelInput {
  slug: string;
  name: string;
  description?: string;
  layout?: Panel['layout'];
  default_panel?: boolean;
  filters?: Panel['filters'];
}

export interface UpdatePanelInput {
  name?: string;
  description?: string;
  layout?: Panel['layout'];
  default_panel?: boolean;
  filters?: Panel['filters'];
}

export interface CreateWidgetInput {
  panel_id: string;
  widget_type: WidgetType;
  title?: string;
  config?: PanelWidget['config'];
  position?: PanelWidget['position'];
}

export interface RecordKPIInput {
  scope: KPIScope;
  source: string;
  metrics: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Lazy Anthropic Client (60s TTL)
// =============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

// =============================================================================
// Panels
// =============================================================================

/**
 * Create a panel
 */
export async function createPanel(
  founderUserId: string,
  input: CreatePanelInput
): Promise<Panel> {
  const { data, error } = await supabaseAdmin
    .from('founder_panels')
    .insert({
      founder_user_id: founderUserId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      layout: input.layout || {},
      default_panel: input.default_panel ?? false,
      filters: input.filters || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create panel: ${error.message}`);
  return data as Panel;
}

/**
 * Get panel by ID or slug
 */
export async function getPanel(
  founderUserId: string,
  idOrSlug: string
): Promise<Panel | null> {
  // Try by ID first
  let query = supabaseAdmin
    .from('founder_panels')
    .select('*')
    .eq('founder_user_id', founderUserId)
    .eq('id', idOrSlug)
    .maybeSingle();

  let { data, error } = await query;

  // If not found, try by slug
  if (!data && !error) {
    query = supabaseAdmin
      .from('founder_panels')
      .select('*')
      .eq('founder_user_id', founderUserId)
      .eq('slug', idOrSlug)
      .maybeSingle();

    const result = await query;
    data = result.data;
    error = result.error;
  }

  if (error) throw new Error(`Failed to get panel: ${error.message}`);
  return data as Panel | null;
}

/**
 * List all panels for a founder
 */
export async function listPanels(founderUserId: string): Promise<Panel[]> {
  const { data, error } = await supabaseAdmin
    .from('founder_panels')
    .select('*')
    .eq('founder_user_id', founderUserId)
    .order('default_panel', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list panels: ${error.message}`);
  return data as Panel[];
}

/**
 * Update panel
 */
export async function updatePanel(
  founderUserId: string,
  panelId: string,
  updates: UpdatePanelInput
): Promise<Panel> {
  const { data, error } = await supabaseAdmin
    .from('founder_panels')
    .update(updates)
    .eq('id', panelId)
    .eq('founder_user_id', founderUserId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update panel: ${error.message}`);
  return data as Panel;
}

/**
 * Delete panel
 */
export async function deletePanel(
  founderUserId: string,
  panelId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('founder_panels')
    .delete()
    .eq('id', panelId)
    .eq('founder_user_id', founderUserId);

  if (error) throw new Error(`Failed to delete panel: ${error.message}`);
}

// =============================================================================
// Widgets
// =============================================================================

/**
 * Add widget to panel
 */
export async function addWidget(
  founderUserId: string,
  input: CreateWidgetInput
): Promise<PanelWidget> {
  // Verify panel ownership
  const panel = await getPanel(founderUserId, input.panel_id);
  if (!panel) throw new Error('Panel not found or access denied');

  const { data, error } = await supabaseAdmin
    .from('founder_panel_widgets')
    .insert({
      panel_id: input.panel_id,
      widget_type: input.widget_type,
      title: input.title,
      config: input.config || {},
      position: input.position || { x: 0, y: 0, w: 2, h: 1 },
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add widget: ${error.message}`);
  return data as PanelWidget;
}

/**
 * List widgets for a panel
 */
export async function listWidgets(
  founderUserId: string,
  panelId: string
): Promise<PanelWidget[]> {
  // Verify panel ownership
  const panel = await getPanel(founderUserId, panelId);
  if (!panel) throw new Error('Panel not found or access denied');

  const { data, error } = await supabaseAdmin
    .from('founder_panel_widgets')
    .select('*')
    .eq('panel_id', panelId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to list widgets: ${error.message}`);
  return data as PanelWidget[];
}

/**
 * Update widget
 */
export async function updateWidget(
  founderUserId: string,
  widgetId: string,
  updates: Partial<Omit<PanelWidget, 'id' | 'panel_id' | 'created_at'>>
): Promise<PanelWidget> {
  // Get widget to verify panel ownership
  const { data: widget, error: widgetError } = await supabaseAdmin
    .from('founder_panel_widgets')
    .select('panel_id')
    .eq('id', widgetId)
    .single();

  if (widgetError) throw new Error(`Widget not found: ${widgetError.message}`);

  const panel = await getPanel(founderUserId, widget.panel_id);
  if (!panel) throw new Error('Panel not found or access denied');

  const { data, error } = await supabaseAdmin
    .from('founder_panel_widgets')
    .update(updates)
    .eq('id', widgetId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update widget: ${error.message}`);
  return data as PanelWidget;
}

/**
 * Remove widget
 */
export async function removeWidget(
  founderUserId: string,
  widgetId: string
): Promise<void> {
  // Get widget to verify panel ownership
  const { data: widget, error: widgetError } = await supabaseAdmin
    .from('founder_panel_widgets')
    .select('panel_id')
    .eq('id', widgetId)
    .single();

  if (widgetError) throw new Error(`Widget not found: ${widgetError.message}`);

  const panel = await getPanel(founderUserId, widget.panel_id);
  if (!panel) throw new Error('Panel not found or access denied');

  const { error } = await supabaseAdmin
    .from('founder_panel_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) throw new Error(`Failed to remove widget: ${error.message}`);
}

// =============================================================================
// KPI Snapshots
// =============================================================================

/**
 * Record a KPI snapshot
 */
export async function recordKPISnapshot(
  founderUserId: string,
  input: RecordKPIInput
): Promise<KPISnapshot> {
  const { data, error } = await supabaseAdmin
    .from('founder_kpi_snapshots')
    .insert({
      founder_user_id: founderUserId,
      scope: input.scope,
      source: input.source,
      metrics: input.metrics,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record KPI snapshot: ${error.message}`);
  return data as KPISnapshot;
}

/**
 * Get latest KPI snapshot for a scope/source
 */
export async function getLatestKPISnapshot(
  founderUserId: string,
  scope: KPIScope,
  source: string
): Promise<KPISnapshot | null> {
  const { data, error } = await supabaseAdmin.rpc('founder_get_latest_kpi_snapshot', {
    p_founder_user_id: founderUserId,
    p_scope: scope,
    p_source: source,
  });

  if (error) throw new Error(`Failed to get latest KPI snapshot: ${error.message}`);

  if (!data || Object.keys(data).length === 0) return null;

  return {
    id: '',
    founder_user_id: founderUserId,
    captured_at: data.captured_at,
    scope,
    source,
    metrics: data.metrics || {},
    ai_summary: data.ai_summary,
    metadata: {},
  };
}

/**
 * Get KPI trend for a metric
 */
export async function getKPITrend(
  founderUserId: string,
  scope: KPIScope,
  source: string,
  metricKey: string,
  days: number = 30
): Promise<Array<{ captured_at: string; value: number }>> {
  const { data, error } = await supabaseAdmin.rpc('founder_get_kpi_trend', {
    p_founder_user_id: founderUserId,
    p_scope: scope,
    p_source: source,
    p_metric_key: metricKey,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get KPI trend: ${error.message}`);
  return data || [];
}

/**
 * Get cross-business summary
 */
export async function getCrossBusinessSummary(
  founderUserId: string
): Promise<{
  total_businesses: number;
  total_mrr: number;
  total_active_campaigns: number;
  avg_health_score: number;
  critical_alerts: number;
}> {
  const { data, error } = await supabaseAdmin.rpc('founder_get_cross_business_summary', {
    p_founder_user_id: founderUserId,
  });

  if (error) throw new Error(`Failed to get cross-business summary: ${error.message}`);

  if (!data || data.length === 0) {
    return {
      total_businesses: 0,
      total_mrr: 0,
      total_active_campaigns: 0,
      avg_health_score: 0,
      critical_alerts: 0,
    };
  }

  return data[0];
}

/**
 * List KPI snapshots with filters
 */
export async function listKPISnapshots(
  founderUserId: string,
  filters?: {
    scope?: KPIScope;
    source?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<KPISnapshot[]> {
  let query = supabaseAdmin
    .from('founder_kpi_snapshots')
    .select('*')
    .eq('founder_user_id', founderUserId)
    .order('captured_at', { ascending: false });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  if (filters?.startDate) {
    query = query.gte('captured_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('captured_at', filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list KPI snapshots: ${error.message}`);
  return data as KPISnapshot[];
}

// =============================================================================
// AI-Powered Insights
// =============================================================================

/**
 * Generate AI insights for cross-business analysis
 */
export async function aiGenerateCrossBusinessInsights(
  founderUserId: string
): Promise<{
  insights: string[];
  alerts: Array<{ severity: 'low' | 'medium' | 'high' | 'critical'; message: string }>;
  recommendations: string[];
  trends: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change_percent: number }>;
}> {
  const client = getAnthropicClient();

  // Get cross-business summary
  const summary = await getCrossBusinessSummary(founderUserId);

  // Get recent snapshots for all businesses
  const snapshots = await listKPISnapshots(founderUserId, {
    scope: 'business',
    limit: 50,
  });

  const prompt = `You are a business intelligence analyst reviewing a founder's portfolio of businesses. Provide strategic insights and recommendations.

**Cross-Business Summary**:
- Total Businesses: ${summary.total_businesses}
- Total MRR: $${summary.total_mrr?.toLocaleString() || 0}
- Active Campaigns: ${summary.total_active_campaigns}
- Avg Health Score: ${summary.avg_health_score?.toFixed(1) || 0}/100
- Critical Alerts: ${summary.critical_alerts}

**Recent Business Snapshots** (last 50):
${snapshots.slice(0, 10).map((s) => `- ${s.source}: ${JSON.stringify(s.metrics)}`).join('\n')}

Provide analysis in JSON format:
{
  "insights": [
    "Strategic insight about the portfolio",
    "Pattern or opportunity identified"
  ],
  "alerts": [
    {
      "severity": "high|medium|low|critical",
      "message": "Alert message"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "trends": [
    {
      "metric": "mrr|campaigns|health_score",
      "direction": "up|down|stable",
      "change_percent": 15.2
    }
  ]
}

Consider:
- Business health patterns across portfolio
- Revenue growth opportunities
- Operational risks or bottlenecks
- Resource allocation recommendations
- Cross-business synergies`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return {
      insights: ['Unable to parse AI response'],
      alerts: [],
      recommendations: [],
      trends: [],
    };
  }
}

/**
 * Generate AI summary for a specific KPI snapshot
 */
export async function aiSummarizeSnapshot(
  snapshot: KPISnapshot
): Promise<{
  insights: string[];
  alerts: Array<{ severity: string; message: string }>;
  recommendations: string[];
}> {
  const client = getAnthropicClient();

  const prompt = `Analyze this business KPI snapshot and provide insights.

**Snapshot Details**:
- Scope: ${snapshot.scope}
- Source: ${snapshot.source}
- Captured: ${snapshot.captured_at}
- Metrics: ${JSON.stringify(snapshot.metrics, null, 2)}

Provide analysis in JSON format:
{
  "insights": [
    "Key insight about performance",
    "Notable pattern or change"
  ],
  "alerts": [
    {
      "severity": "high|medium|low",
      "message": "Alert message if needed"
    }
  ],
  "recommendations": [
    "Actionable recommendation"
  ]
}

Focus on:
- Performance vs typical benchmarks
- Anomalies or concerning trends
- Opportunities for improvement`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  try {
    const result = JSON.parse(textContent.text);

    // Update snapshot with AI summary
    await supabaseAdmin
      .from('founder_kpi_snapshots')
      .update({ ai_summary: result })
      .eq('id', snapshot.id);

    return result;
  } catch {
    return {
      insights: ['Unable to parse AI response'],
      alerts: [],
      recommendations: [],
    };
  }
}
