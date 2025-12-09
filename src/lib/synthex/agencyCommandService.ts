/**
 * Synthex Agency Command Center Service
 * Phase B40: Agency Command Center
 *
 * Top-level agency dashboard for monitoring all client
 * tenants, health, usage, and outcomes.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// Types
// =====================================================

export interface AgencyClient {
  id: string;
  agency_tenant_id: string;
  client_tenant_id: string;
  label: string;
  status: 'active' | 'onboarding' | 'paused' | 'churned' | 'trial';
  tier: 'starter' | 'standard' | 'premium' | 'enterprise';
  contract_start?: string;
  contract_end?: string;
  monthly_value?: number;
  notes?: string;
  health_score: number;
  last_activity_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgencyMetrics {
  id: string;
  client_tenant_id: string;
  period: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  // Financial metrics
  mrr: number;
  arr: number;
  revenue_this_period: number;
  // Usage metrics
  active_users: number;
  total_users: number;
  api_calls: number;
  storage_used_mb: number;
  // Marketing metrics
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  campaigns_running: number;
  campaigns_completed: number;
  // Audience metrics
  total_contacts: number;
  new_contacts: number;
  leads_generated: number;
  // Risk metrics
  churn_risk: number;
  engagement_score: number;
  nps_score?: number;
  computed_health_score?: number;
  created_at: string;
}

export interface AgencyAlert {
  id: string;
  agency_tenant_id: string;
  client_tenant_id?: string;
  alert_type: 'churn_risk' | 'inactive' | 'billing_issue' | 'performance_drop' | 'milestone' | 'renewal' | 'support_ticket' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface AgencyGoal {
  id: string;
  agency_tenant_id: string;
  goal_type: 'mrr' | 'clients' | 'retention' | 'nps' | 'engagement' | 'custom';
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  status: 'in_progress' | 'achieved' | 'missed' | 'cancelled';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgencyOverview {
  total_clients: number;
  active_clients: number;
  total_mrr: number;
  total_arr: number;
  total_emails_sent: number;
  total_leads: number;
  avg_churn_risk: number;
  avg_health_score: number;
  clients_at_risk: number;
}

export interface ClientWithMetrics extends AgencyClient {
  latest_metrics?: Partial<AgencyMetrics>;
  trend?: {
    mrr_change: number;
    engagement_change: number;
    emails_change: number;
  };
}

export interface DateRange {
  start: string;
  end: string;
}

// =====================================================
// Client Management
// =====================================================

/**
 * List all agency clients
 */
export async function listAgencyClients(
  agencyTenantId: string,
  filters?: {
    status?: AgencyClient['status'];
    tier?: AgencyClient['tier'];
    minHealthScore?: number;
    maxHealthScore?: number;
  }
): Promise<AgencyClient[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_agency_overview_clients')
    .select('*')
    .eq('agency_tenant_id', agencyTenantId)
    .order('label', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.tier) {
    query = query.eq('tier', filters.tier);
  }

  if (filters?.minHealthScore !== undefined) {
    query = query.gte('health_score', filters.minHealthScore);
  }

  if (filters?.maxHealthScore !== undefined) {
    query = query.lte('health_score', filters.maxHealthScore);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list agency clients: ${error.message}`);
  }

  return data || [];
}

/**
 * Link a client tenant to the agency
 */
export async function linkClient(
  agencyTenantId: string,
  clientTenantId: string,
  label: string,
  options?: {
    tier?: AgencyClient['tier'];
    monthly_value?: number;
    notes?: string;
    contract_start?: string;
    contract_end?: string;
  }
): Promise<AgencyClient> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_overview_clients')
    .upsert(
      {
        agency_tenant_id: agencyTenantId,
        client_tenant_id: clientTenantId,
        label,
        status: 'active',
        tier: options?.tier || 'standard',
        monthly_value: options?.monthly_value,
        notes: options?.notes,
        contract_start: options?.contract_start,
        contract_end: options?.contract_end,
        health_score: 50, // Default health score
        metadata: {},
      },
      {
        onConflict: 'agency_tenant_id,client_tenant_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link client: ${error.message}`);
  }

  return data;
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  agencyTenantId: string,
  updates: Partial<{
    label: string;
    status: AgencyClient['status'];
    tier: AgencyClient['tier'];
    monthly_value: number;
    notes: string;
    contract_start: string;
    contract_end: string;
    health_score: number;
  }>
): Promise<AgencyClient> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_overview_clients')
    .update(updates)
    .eq('id', clientId)
    .eq('agency_tenant_id', agencyTenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client: ${error.message}`);
  }

  return data;
}

/**
 * Unlink a client from the agency
 */
export async function unlinkClient(
  clientId: string,
  agencyTenantId: string
): Promise<void> {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from('synthex_agency_overview_clients')
    .delete()
    .eq('id', clientId)
    .eq('agency_tenant_id', agencyTenantId);

  if (error) {
    throw new Error(`Failed to unlink client: ${error.message}`);
  }
}

// =====================================================
// Metrics Management
// =====================================================

/**
 * Upsert client metrics for a period
 */
export async function upsertClientMetrics(
  clientTenantId: string,
  metrics: Partial<Omit<AgencyMetrics, 'id' | 'client_tenant_id' | 'created_at'>>
): Promise<AgencyMetrics> {
  const supabase = supabaseAdmin;

  const period = metrics.period || new Date().toISOString().split('T')[0];
  const periodType = metrics.period_type || 'daily';

  const { data, error } = await supabase
    .from('synthex_agency_metrics')
    .upsert(
      {
        client_tenant_id: clientTenantId,
        period,
        period_type: periodType,
        ...metrics,
      },
      {
        onConflict: 'client_tenant_id,period,period_type',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert metrics: ${error.message}`);
  }

  return data;
}

/**
 * Get metrics for a client over a date range
 */
export async function getClientMetrics(
  clientTenantId: string,
  dateRange?: DateRange,
  periodType: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<AgencyMetrics[]> {
  const supabase = supabaseAdmin;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('synthex_agency_metrics')
    .select('*')
    .eq('client_tenant_id', clientTenantId)
    .eq('period_type', periodType)
    .gte('period', startDate)
    .lte('period', endDate)
    .order('period', { ascending: true });

  if (error) {
    throw new Error(`Failed to get client metrics: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Overview & Aggregations
// =====================================================

/**
 * Get the agency overview with aggregated metrics
 */
export async function getAgencyOverview(
  agencyTenantId: string,
  dateRange?: DateRange
): Promise<AgencyOverview> {
  const supabase = supabaseAdmin;

  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

  // Try to use the RPC function first
  try {
    const { data, error } = await supabase.rpc('get_agency_overview', {
      p_agency_tenant_id: agencyTenantId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (!error && data && data.length > 0) {
      return data[0] as AgencyOverview;
    }
  } catch {
    // Fall back to manual aggregation
  }

  // Manual aggregation fallback
  const clients = await listAgencyClients(agencyTenantId);

  const activeClients = clients.filter((c) => c.status === 'active');
  const totalMrr = clients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
  const avgHealthScore = clients.length > 0
    ? clients.reduce((sum, c) => sum + c.health_score, 0) / clients.length
    : 50;
  const clientsAtRisk = clients.filter((c) => c.health_score < 40).length;

  // Get aggregated metrics
  let totalEmailsSent = 0;
  let totalLeads = 0;
  let totalChurnRisk = 0;

  for (const client of clients) {
    const metrics = await getClientMetrics(client.client_tenant_id, dateRange);
    for (const m of metrics) {
      totalEmailsSent += m.emails_sent || 0;
      totalLeads += m.leads_generated || 0;
      totalChurnRisk += m.churn_risk || 0;
    }
  }

  return {
    total_clients: clients.length,
    active_clients: activeClients.length,
    total_mrr: totalMrr,
    total_arr: totalMrr * 12,
    total_emails_sent: totalEmailsSent,
    total_leads: totalLeads,
    avg_churn_risk: clients.length > 0 ? totalChurnRisk / clients.length : 0,
    avg_health_score: avgHealthScore,
    clients_at_risk: clientsAtRisk,
  };
}

/**
 * Get clients with their latest metrics
 */
export async function getClientsWithMetrics(
  agencyTenantId: string,
  dateRange?: DateRange
): Promise<ClientWithMetrics[]> {
  const clients = await listAgencyClients(agencyTenantId);
  const results: ClientWithMetrics[] = [];

  for (const client of clients) {
    const metrics = await getClientMetrics(client.client_tenant_id, dateRange);

    const latestMetrics = metrics[metrics.length - 1];
    const previousMetrics = metrics.length > 1 ? metrics[metrics.length - 2] : null;

    let trend: ClientWithMetrics['trend'];
    if (latestMetrics && previousMetrics) {
      trend = {
        mrr_change: (latestMetrics.mrr || 0) - (previousMetrics.mrr || 0),
        engagement_change: (latestMetrics.engagement_score || 0) - (previousMetrics.engagement_score || 0),
        emails_change: (latestMetrics.emails_sent || 0) - (previousMetrics.emails_sent || 0),
      };
    }

    results.push({
      ...client,
      latest_metrics: latestMetrics,
      trend,
    });
  }

  return results;
}

// =====================================================
// Alerts Management
// =====================================================

/**
 * Get alerts for an agency
 */
export async function getAgencyAlerts(
  agencyTenantId: string,
  filters?: {
    resolved?: boolean;
    severity?: AgencyAlert['severity'];
    alertType?: AgencyAlert['alert_type'];
    limit?: number;
  }
): Promise<AgencyAlert[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_agency_alerts')
    .select('*')
    .eq('agency_tenant_id', agencyTenantId)
    .order('created_at', { ascending: false });

  if (filters?.resolved !== undefined) {
    query = query.eq('resolved', filters.resolved);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.alertType) {
    query = query.eq('alert_type', filters.alertType);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get alerts: ${error.message}`);
  }

  return data || [];
}

/**
 * Create an alert
 */
export async function createAlert(
  agencyTenantId: string,
  alert: {
    client_tenant_id?: string;
    alert_type: AgencyAlert['alert_type'];
    severity: AgencyAlert['severity'];
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
): Promise<AgencyAlert> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_alerts')
    .insert({
      agency_tenant_id: agencyTenantId,
      ...alert,
      data: alert.data || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }

  return data;
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<AgencyAlert> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }

  return data;
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<AgencyAlert> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve alert: ${error.message}`);
  }

  return data;
}

// =====================================================
// Goals Management
// =====================================================

/**
 * Get goals for an agency
 */
export async function getAgencyGoals(
  agencyTenantId: string,
  filters?: {
    status?: AgencyGoal['status'];
    goalType?: AgencyGoal['goal_type'];
  }
): Promise<AgencyGoal[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_agency_goals')
    .select('*')
    .eq('agency_tenant_id', agencyTenantId)
    .order('period_end', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.goalType) {
    query = query.eq('goal_type', filters.goalType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get goals: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a goal
 */
export async function createGoal(
  agencyTenantId: string,
  goal: {
    goal_type: AgencyGoal['goal_type'];
    target_value: number;
    period_start: string;
    period_end: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AgencyGoal> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_goals')
    .insert({
      agency_tenant_id: agencyTenantId,
      ...goal,
      current_value: 0,
      status: 'in_progress',
      metadata: goal.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`);
  }

  return data;
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<AgencyGoal> {
  const supabase = supabaseAdmin;

  // Get the goal to check if it's achieved
  const { data: existing } = await supabase
    .from('synthex_agency_goals')
    .select('target_value')
    .eq('id', goalId)
    .single();

  const newStatus =
    existing && currentValue >= existing.target_value ? 'achieved' : 'in_progress';

  const { data, error } = await supabase
    .from('synthex_agency_goals')
    .update({
      current_value: currentValue,
      status: newStatus,
    })
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`);
  }

  return data;
}
