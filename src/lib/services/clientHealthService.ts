/**
 * Client Health Service
 * Phase 48: Monitor client health and generate momentum alerts
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface MomentumAlert {
  id: string;
  client_id: string;
  organization_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  alert_data: Record<string, any>;
  created_at: string;
}

// Alert thresholds (from task specification)
const THRESHOLDS = {
  inactivity_hours: 48,
  tasks_stalled_hours: 72,
  zero_audit_activity_days: 3,
};

/**
 * Create a momentum alert
 */
export async function createMomentumAlert(data: {
  clientId: string;
  organizationId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  alertData?: Record<string, any>;
}): Promise<{ success: boolean; alert?: MomentumAlert; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Check if similar active alert already exists
    const { data: existing } = await supabase
      .from('client_momentum_alerts')
      .select('id')
      .eq('client_id', data.clientId)
      .eq('alert_type', data.alertType)
      .eq('status', 'active')
      .single();

    if (existing) {
      return { success: true }; // Don't create duplicate alerts
    }

    const { data: alert, error } = await supabase
      .from('client_momentum_alerts')
      .insert({
        client_id: data.clientId,
        organization_id: data.organizationId,
        alert_type: data.alertType,
        severity: data.severity,
        title: data.title,
        message: data.message,
        alert_data: data.alertData || {},
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, alert };
  } catch (error) {
    console.error('Error creating momentum alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create alert',
    };
  }
}

/**
 * Get active alerts for an organization
 */
export async function getOrgAlerts(
  organizationId: string,
  options?: { activeOnly?: boolean; severity?: string }
): Promise<{ success: boolean; alerts?: MomentumAlert[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('client_momentum_alerts')
      .select(`
        *,
        user_profiles:client_id (
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (options?.activeOnly) {
      query = query.eq('status', 'active');
    }

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, alerts: data };
  } catch (error) {
    console.error('Error fetching org alerts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
    };
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('client_momentum_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge',
    };
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('client_momentum_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error resolving alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve',
    };
  }
}

/**
 * Check client health and generate alerts if needed
 */
export async function checkClientHealth(
  clientId: string,
  organizationId: string
): Promise<{ success: boolean; alerts?: MomentumAlert[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    const alerts: MomentumAlert[] = [];

    // Check for inactivity
    const inactivityThreshold = new Date(
      Date.now() - THRESHOLDS.inactivity_hours * 60 * 60 * 1000
    ).toISOString();

    const { data: recentEvents } = await supabase
      .from('client_engagement_events')
      .select('id')
      .eq('client_id', clientId)
      .gte('created_at', inactivityThreshold)
      .limit(1);

    if (!recentEvents || recentEvents.length === 0) {
      const alertResult = await createMomentumAlert({
        clientId,
        organizationId,
        alertType: 'inactivity',
        severity: 'warning',
        title: 'Client inactive',
        message: `No activity in the last ${THRESHOLDS.inactivity_hours} hours. Consider reaching out.`,
        alertData: { last_check: new Date().toISOString() },
      });
      if (alertResult.alert) alerts.push(alertResult.alert);
    }

    // Check for stalled tasks
    const stalledThreshold = new Date(
      Date.now() - THRESHOLDS.tasks_stalled_hours * 60 * 60 * 1000
    ).toISOString();

    const { data: inProgressTasks } = await supabase
      .from('client_onboarding_tasks')
      .select('id, title, updated_at')
      .eq('client_id', clientId)
      .eq('status', 'in_progress')
      .lt('updated_at', stalledThreshold);

    if (inProgressTasks && inProgressTasks.length > 0) {
      const alertResult = await createMomentumAlert({
        clientId,
        organizationId,
        alertType: 'task_stalled',
        severity: 'warning',
        title: 'Tasks stalled',
        message: `${inProgressTasks.length} task(s) haven't progressed in ${THRESHOLDS.tasks_stalled_hours} hours.`,
        alertData: { stalled_tasks: inProgressTasks.map(t => t.title) },
      });
      if (alertResult.alert) alerts.push(alertResult.alert);
    }

    // Check for zero activity in multiple days
    const zeroActivityThreshold = new Date(
      Date.now() - THRESHOLDS.zero_audit_activity_days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { count: eventCount } = await supabase
      .from('client_engagement_events')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('created_at', zeroActivityThreshold);

    if (eventCount === 0) {
      const alertResult = await createMomentumAlert({
        clientId,
        organizationId,
        alertType: 'zero_activity',
        severity: 'critical',
        title: 'Zero activity',
        message: `No activity in ${THRESHOLDS.zero_audit_activity_days} days. Client may be at risk of churning.`,
        alertData: { days_inactive: THRESHOLDS.zero_audit_activity_days },
      });
      if (alertResult.alert) alerts.push(alertResult.alert);
    }

    // Check for score drop (needs previous score)
    const { data: scores } = await supabase
      .from('client_success_scores')
      .select('overall_score, calculated_at')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(2);

    if (scores && scores.length >= 2) {
      const currentScore = scores[0].overall_score;
      const previousScore = scores[1].overall_score;
      const drop = previousScore - currentScore;

      if (drop >= 20) {
        const alertResult = await createMomentumAlert({
          clientId,
          organizationId,
          alertType: 'score_drop',
          severity: drop >= 30 ? 'critical' : 'warning',
          title: 'Success score dropped',
          message: `Score dropped by ${drop} points (from ${previousScore} to ${currentScore}). Investigate and reach out.`,
          alertData: { previous_score: previousScore, current_score: currentScore, drop },
        });
        if (alertResult.alert) alerts.push(alertResult.alert);
      }
    }

    return { success: true, alerts };
  } catch (error) {
    console.error('Error checking client health:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check health',
    };
  }
}

/**
 * Run health check for all clients in an organization
 */
export async function checkOrgClientHealth(
  organizationId: string
): Promise<{ success: boolean; results?: Array<{ clientId: string; alerts: number }>; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get all clients in the org
    const { data: clients } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('org_id', organizationId)
      .eq('role', 'client');

    if (!clients) {
      return { success: true, results: [] };
    }

    const results = [];
    for (const client of clients) {
      const healthResult = await checkClientHealth(client.user_id, organizationId);
      results.push({
        clientId: client.user_id,
        alerts: healthResult.alerts?.length || 0,
      });
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error checking org client health:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check org health',
    };
  }
}

/**
 * Get alert summary for dashboard
 */
export async function getAlertSummary(
  organizationId: string
): Promise<{ success: boolean; summary?: { total: number; critical: number; warning: number; info: number }; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_momentum_alerts')
      .select('severity')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;

    const summary = {
      total: data?.length || 0,
      critical: data?.filter(a => a.severity === 'critical').length || 0,
      warning: data?.filter(a => a.severity === 'warning').length || 0,
      info: data?.filter(a => a.severity === 'info').length || 0,
    };

    return { success: true, summary };
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
    };
  }
}

export default {
  createMomentumAlert,
  getOrgAlerts,
  acknowledgeAlert,
  resolveAlert,
  checkClientHealth,
  checkOrgClientHealth,
  getAlertSummary,
};
