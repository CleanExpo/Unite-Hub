/**
 * Founder Intel Preference Service
 * Phase 80: Manage founder intelligence preferences
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  FounderIntelPreferences,
  OpportunityPreferences,
  BriefingSchedule,
  MuteRules,
  SourceEngine,
} from './founderIntelTypes';

/**
 * Default preferences for new users
 */
const DEFAULT_PREFERENCES: Omit<FounderIntelPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  risk_thresholds: {
    agency_director: 0.7,
    creative_director: 0.7,
    scaling_engine: 0.6,
    orm: 0.7,
    alignment_engine: 0.6,
    story_engine: 0.5,
    vif: 0.6,
    archive: 0.5,
    marketing_engine: 0.6,
    performance: 0.7,
    reports: 0.5,
    touchpoints: 0.5,
  },
  opportunity_preferences: {
    min_confidence: 0.6,
    show_low_opportunities: false,
    highlight_high_impact: true,
  },
  briefing_schedule: {
    weekly: { day: 'monday', hour: 7 },
    timezone: 'Australia/Brisbane',
  },
  mute_rules: {
    muted_engines: [],
    muted_alert_types: [],
    muted_clients: [],
  },
};

/**
 * Get preferences for a user (creates defaults if not exist)
 */
export async function getPreferencesForUser(
  userId: string
): Promise<FounderIntelPreferences | null> {
  const supabase = await getSupabaseServer();

  // Try to get existing preferences
  const { data: existing, error: fetchError } = await supabase
    .from('founder_intel_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing && !fetchError) {
    return existing as FounderIntelPreferences;
  }

  // Create default preferences if not exist
  if (fetchError?.code === 'PGRST116') {
    const { data: created, error: createError } = await supabase
      .from('founder_intel_preferences')
      .insert({
        user_id: userId,
        ...DEFAULT_PREFERENCES,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create default preferences:', createError);
      return null;
    }

    return created as FounderIntelPreferences;
  }

  console.error('Failed to get preferences:', fetchError);
  return null;
}

/**
 * Upsert preferences for a user
 */
export async function upsertPreferences(
  userId: string,
  payload: Partial<{
    risk_thresholds: Record<SourceEngine, number>;
    opportunity_preferences: OpportunityPreferences;
    briefing_schedule: BriefingSchedule;
    mute_rules: MuteRules;
  }>
): Promise<FounderIntelPreferences | null> {
  const supabase = await getSupabaseServer();

  // Get current preferences to merge
  const current = await getPreferencesForUser(userId);
  if (!current) {
    return null;
  }

  const updates = {
    risk_thresholds: payload.risk_thresholds || current.risk_thresholds,
    opportunity_preferences: payload.opportunity_preferences || current.opportunity_preferences,
    briefing_schedule: payload.briefing_schedule || current.briefing_schedule,
    mute_rules: payload.mute_rules || current.mute_rules,
  };

  const { data, error } = await supabase
    .from('founder_intel_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update preferences:', error);
    return null;
  }

  return data as FounderIntelPreferences;
}

/**
 * Update specific risk threshold
 */
export async function updateRiskThreshold(
  userId: string,
  engine: SourceEngine,
  threshold: number
): Promise<boolean> {
  const current = await getPreferencesForUser(userId);
  if (!current) return false;

  const updatedThresholds = {
    ...current.risk_thresholds,
    [engine]: Math.max(0, Math.min(1, threshold)),
  };

  const result = await upsertPreferences(userId, {
    risk_thresholds: updatedThresholds,
  });

  return result !== null;
}

/**
 * Add engine to mute list
 */
export async function muteEngine(
  userId: string,
  engine: SourceEngine
): Promise<boolean> {
  const current = await getPreferencesForUser(userId);
  if (!current) return false;

  if (current.mute_rules.muted_engines.includes(engine)) {
    return true; // Already muted
  }

  const updatedMuteRules = {
    ...current.mute_rules,
    muted_engines: [...current.mute_rules.muted_engines, engine],
  };

  const result = await upsertPreferences(userId, {
    mute_rules: updatedMuteRules,
  });

  return result !== null;
}

/**
 * Remove engine from mute list
 */
export async function unmuteEngine(
  userId: string,
  engine: SourceEngine
): Promise<boolean> {
  const current = await getPreferencesForUser(userId);
  if (!current) return false;

  const updatedMuteRules = {
    ...current.mute_rules,
    muted_engines: current.mute_rules.muted_engines.filter(e => e !== engine),
  };

  const result = await upsertPreferences(userId, {
    mute_rules: updatedMuteRules,
  });

  return result !== null;
}

/**
 * Update briefing schedule
 */
export async function updateBriefingSchedule(
  userId: string,
  schedule: BriefingSchedule
): Promise<boolean> {
  const result = await upsertPreferences(userId, {
    briefing_schedule: schedule,
  });

  return result !== null;
}
