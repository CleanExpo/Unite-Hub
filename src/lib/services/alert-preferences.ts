/**
 * Alert Preferences Service
 * CRUD operations for workspace alert settings
 *
 * Features:
 * - Get/update preferences per workspace
 * - Validation of settings
 * - Multi-tenant isolation via workspace_id
 * - Sensible defaults
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface AlertPreferencesInput {
  workspace_id: string;
  slack_enabled?: boolean;
  slack_webhook_url?: string | null;
  email_enabled?: boolean;
  email_recipients?: string[];
  webhook_enabled?: boolean;
  webhook_url?: string | null;
  severity_threshold?: 'low' | 'medium' | 'high' | 'critical';
  threat_types?: string[];
  dnd_enabled?: boolean;
  dnd_start_hour?: number;
  dnd_end_hour?: number;
  dnd_timezone?: string;
  dnd_weekends?: boolean;
}

export interface AlertPreferences extends AlertPreferencesInput {
  id: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_THREAT_TYPES = [
  'ranking_drop',
  'cwv_degradation',
  'technical_error',
  'competitor_surge',
  'security_issue',
  'indexation_problem',
];

/**
 * Get alert preferences for workspace
 * Creates defaults if none exist
 */
export async function getAlertPreferences(workspaceId: string): Promise<AlertPreferences | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - create defaults
      return createAlertPreferences(workspaceId, {
        workspace_id: workspaceId,
        severity_threshold: 'high',
        threat_types: DEFAULT_THREAT_TYPES,
      });
    }

    console.error('[AlertPreferencesService] Error fetching preferences:', error);
    return null;
  }

  return data as AlertPreferences;
}

/**
 * Create alert preferences with defaults
 */
export async function createAlertPreferences(
  workspaceId: string,
  input: Partial<AlertPreferencesInput> = {}
): Promise<AlertPreferences | null> {
  const supabase = getSupabaseServer();

  const prefs: AlertPreferencesInput = {
    workspace_id: workspaceId,
    slack_enabled: false,
    email_enabled: false,
    webhook_enabled: false,
    severity_threshold: 'high',
    threat_types: DEFAULT_THREAT_TYPES,
    dnd_enabled: false,
    dnd_start_hour: 22,
    dnd_end_hour: 8,
    dnd_timezone: 'UTC',
    dnd_weekends: false,
    ...input,
  };

  const { data, error } = await supabase
    .from('alert_preferences')
    .insert([prefs])
    .select()
    .single();

  if (error) {
    console.error('[AlertPreferencesService] Error creating preferences:', error);
    return null;
  }

  return data as AlertPreferences;
}

/**
 * Update alert preferences
 */
export async function updateAlertPreferences(
  workspaceId: string,
  input: Partial<AlertPreferencesInput>
): Promise<AlertPreferences | null> {
  const supabase = getSupabaseServer();

  // Ensure workspace_id can't be changed
  const { workspace_id, ...safeInput } = input;

  const { data, error } = await supabase
    .from('alert_preferences')
    .update({
      ...safeInput,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    console.error('[AlertPreferencesService] Error updating preferences:', error);
    return null;
  }

  return data as AlertPreferences;
}

/**
 * Update Slack settings
 */
export async function updateSlackSettings(
  workspaceId: string,
  enabled: boolean,
  webhookUrl?: string
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    slack_enabled: enabled,
    slack_webhook_url: webhookUrl || null,
  });
}

/**
 * Update email settings
 */
export async function updateEmailSettings(
  workspaceId: string,
  enabled: boolean,
  recipients?: string[]
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    email_enabled: enabled,
    email_recipients: recipients || [],
  });
}

/**
 * Update webhook settings
 */
export async function updateWebhookSettings(
  workspaceId: string,
  enabled: boolean,
  url?: string
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    webhook_enabled: enabled,
    webhook_url: url || null,
  });
}

/**
 * Update do-not-disturb schedule
 */
export async function updateDNDSchedule(
  workspaceId: string,
  input: {
    enabled: boolean;
    startHour?: number;
    endHour?: number;
    timezone?: string;
    weekends?: boolean;
  }
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    dnd_enabled: input.enabled,
    dnd_start_hour: input.startHour,
    dnd_end_hour: input.endHour,
    dnd_timezone: input.timezone,
    dnd_weekends: input.weekends,
  });
}

/**
 * Update severity threshold
 */
export async function updateSeverityThreshold(
  workspaceId: string,
  threshold: 'low' | 'medium' | 'high' | 'critical'
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    severity_threshold: threshold,
  });
}

/**
 * Update monitored threat types
 */
export async function updateThreatTypes(
  workspaceId: string,
  threatTypes: string[]
): Promise<AlertPreferences | null> {
  return updateAlertPreferences(workspaceId, {
    threat_types: threatTypes,
  });
}
