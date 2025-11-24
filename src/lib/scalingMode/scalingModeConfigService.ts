/**
 * Scaling Mode Config Service
 * Phase 86: CRUD for scaling_mode_config
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ScalingModeConfig,
  ScalingMode,
  ModeLimits,
  GuardrailThresholds,
} from './scalingModeTypes';

/**
 * Get config for an environment
 */
export async function getConfig(
  environment: string = 'production'
): Promise<ScalingModeConfig | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_mode_config')
    .select('*')
    .eq('environment', environment)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ScalingModeConfig;
}

/**
 * Update config for an environment
 */
export async function updateConfig(
  environment: string,
  updates: Partial<ScalingModeConfig>,
  userId?: string
): Promise<ScalingModeConfig> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_mode_config')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('environment', environment)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update config: ${error.message}`);
  }

  return data;
}

/**
 * Create config for a new environment
 */
export async function createConfig(
  environment: string,
  initialMode: ScalingMode = 'lab'
): Promise<ScalingModeConfig> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('scaling_mode_config')
    .insert({
      environment,
      current_mode: initialMode,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create config: ${error.message}`);
  }

  return data;
}

/**
 * Get mode limits for a specific mode
 */
export function getModeLimits(
  config: ScalingModeConfig,
  mode: ScalingMode
): ModeLimits {
  return config.mode_limits[mode] || {
    max_clients: 5,
    max_posts_per_day: 50,
    max_ai_spend_daily: 10,
  };
}

/**
 * Get current mode limits
 */
export function getCurrentModeLimits(config: ScalingModeConfig): ModeLimits {
  return getModeLimits(config, config.current_mode);
}

/**
 * Get next mode in sequence
 */
export function getNextMode(currentMode: ScalingMode): ScalingMode | null {
  const sequence: ScalingMode[] = ['lab', 'pilot', 'growth', 'scale'];
  const currentIndex = sequence.indexOf(currentMode);

  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null;
  }

  return sequence[currentIndex + 1];
}

/**
 * Get previous mode in sequence
 */
export function getPreviousMode(currentMode: ScalingMode): ScalingMode | null {
  const sequence: ScalingMode[] = ['lab', 'pilot', 'growth', 'scale'];
  const currentIndex = sequence.indexOf(currentMode);

  if (currentIndex <= 0) {
    return null;
  }

  return sequence[currentIndex - 1];
}

/**
 * Set current mode
 */
export async function setCurrentMode(
  environment: string,
  newMode: ScalingMode,
  userId?: string
): Promise<ScalingModeConfig> {
  return updateConfig(environment, { current_mode: newMode }, userId);
}

/**
 * Toggle auto mode
 */
export async function setAutoModeEnabled(
  environment: string,
  enabled: boolean,
  userId?: string
): Promise<ScalingModeConfig> {
  return updateConfig(environment, { auto_mode_enabled: enabled }, userId);
}

/**
 * Update guardrail thresholds
 */
export async function updateGuardrailThresholds(
  environment: string,
  thresholds: Partial<GuardrailThresholds>,
  userId?: string
): Promise<ScalingModeConfig> {
  const config = await getConfig(environment);
  if (!config) {
    throw new Error(`Config not found for environment: ${environment}`);
  }

  const updatedThresholds = {
    ...config.guardrail_thresholds,
    ...thresholds,
  };

  return updateConfig(environment, { guardrail_thresholds: updatedThresholds }, userId);
}

/**
 * Get mode display name
 */
export function getModeDisplayName(mode: ScalingMode): string {
  const names: Record<ScalingMode, string> = {
    lab: 'Lab (0-5 clients)',
    pilot: 'Pilot (6-15 clients)',
    growth: 'Growth (16-50 clients)',
    scale: 'Scale (51+ clients)',
  };
  return names[mode] || mode;
}
