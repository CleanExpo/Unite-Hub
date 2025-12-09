/**
 * Autopilot Preference Service
 * Phase 89: Manage per-founder autopilot preferences
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AutopilotPreferences,
  DomainLevel,
  DomainLevels,
  AutomationProfile,
} from './autopilotTypes';

const DEFAULT_DOMAIN_LEVELS: DomainLevels = {
  reporting: 'auto',
  creative: 'suggest',
  posting: 'approval_only',
  outreach: 'suggest',
  optimisation: 'suggest',
  housekeeping: 'auto',
};

/**
 * Get autopilot preferences for founder
 */
export async function getPreferences(
  founderUserId: string
): Promise<AutopilotPreferences | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('autopilot_preferences')
    .select('*')
    .eq('founder_user_id', founderUserId)
    .single();

  if (error || !data) {
return null;
}

  return mapToPreferences(data);
}

/**
 * Upsert autopilot preferences
 */
export async function upsertPreferences(
  founderUserId: string,
  workspaceId: string,
  payload: {
    automationProfile?: AutomationProfile;
    domainLevels?: Partial<DomainLevels>;
    schedulePrefs?: any;
  }
): Promise<AutopilotPreferences> {
  const supabase = await getSupabaseServer();

  // Get existing or create defaults
  const existing = await getPreferences(founderUserId);

  const domainLevels = {
    ...DEFAULT_DOMAIN_LEVELS,
    ...(existing?.domainLevels || {}),
    ...(payload.domainLevels || {}),
  };

  const schedulePrefs = {
    playbook_cadence: 'weekly',
    execution_cadence: 'daily',
    preferred_day: 'monday',
    preferred_hour: 9,
    ...(existing?.schedulePrefs || {}),
    ...(payload.schedulePrefs || {}),
  };

  const { data, error } = await supabase
    .from('autopilot_preferences')
    .upsert({
      founder_user_id: founderUserId,
      workspace_id: workspaceId,
      automation_profile: payload.automationProfile || existing?.automationProfile || 'conservative',
      domain_levels: domainLevels,
      schedule_prefs: schedulePrefs,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'founder_user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert preferences: ${error.message}`);
  }

  return mapToPreferences(data);
}

/**
 * Resolve domain level for a specific category
 */
export function resolveDomainLevel(
  preferences: AutopilotPreferences | null,
  category: string
): DomainLevel {
  if (!preferences) {
return 'suggest';
}

  // Map category to domain
  const categoryToDomain: Record<string, keyof DomainLevels> = {
    creative: 'creative',
    reporting: 'reporting',
    success: 'reporting',
    risk: 'reporting',
    scaling: 'optimisation',
    housekeeping: 'housekeeping',
    outreach: 'outreach',
    optimisation: 'optimisation',
  };

  const domain = categoryToDomain[category] || 'optimisation';
  return preferences.domainLevels[domain] || 'suggest';
}

/**
 * Check if action can auto-execute based on preferences
 */
export function canAutoExecute(
  preferences: AutopilotPreferences | null,
  category: string,
  riskClass: string
): boolean {
  if (!preferences || preferences.automationProfile === 'off') {
    return false;
  }

  // High risk never auto-executes
  if (riskClass === 'high') {
return false;
}

  // Medium risk only in aggressive mode
  if (riskClass === 'medium' && preferences.automationProfile !== 'aggressive') {
    return false;
  }

  const domainLevel = resolveDomainLevel(preferences, category);

  return domainLevel === 'auto';
}

// Helper
function mapToPreferences(row: any): AutopilotPreferences {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    founderUserId: row.founder_user_id,
    workspaceId: row.workspace_id,
    automationProfile: row.automation_profile,
    domainLevels: row.domain_levels,
    schedulePrefs: row.schedule_prefs,
    metadata: row.metadata,
  };
}
