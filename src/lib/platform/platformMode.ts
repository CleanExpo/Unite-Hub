/**
 * Platform Mode Helper
 *
 * Utilities for reading/writing Stripe test/live mode configuration
 * Only accessible to admins: phill.mcgurk@gmail.com, ranamuzamil1199@gmail.com
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'PlatformMode' });

const ADMIN_EMAILS = ['phill.mcgurk@gmail.com', 'ranamuzamil1199@gmail.com'];

export type PlatformMode = 'test' | 'live';

export interface PlatformModeConfig {
  mode: PlatformMode;
  stripe_mode: PlatformMode;
  dataforseo_mode: PlatformMode;
  semrush_mode: PlatformMode;
  ai_mode: PlatformMode;
  updated_by?: string;
  updated_at: string;
}

export interface ServiceModes {
  stripe: PlatformMode;
  dataforseo: PlatformMode;
  semrush: PlatformMode;
  ai: PlatformMode;
}

/**
 * Check if user email is admin
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
return false;
}
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get current platform mode from database
 */
export async function getPlatformMode(): Promise<PlatformMode> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('sys_platform_mode')
      .select('mode, stripe_mode, updated_at')
      .eq('id', 1)
      .single();

    if (error) {
      logger.warn('Failed to fetch platform mode', { error });
      // Default to 'test' if query fails
      return 'test';
    }

    return (data?.mode || 'test') as PlatformMode;
  } catch (error) {
    logger.error('Error getting platform mode', { error });
    return 'test';
  }
}

/**
 * Set platform mode (admin only)
 */
export async function setPlatformMode(
  newMode: PlatformMode,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Get current mode
    const { data: current, error: fetchError } = await supabase
      .from('sys_platform_mode')
      .select('mode')
      .eq('id', 1)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current mode', { error: fetchError });
      return { success: false, error: 'Failed to fetch current mode' };
    }

    const oldMode = current.mode;

    // Prevent unnecessary updates
    if (oldMode === newMode) {
      logger.info('Mode already set to', { mode: newMode });
      return { success: true };
    }

    // Update mode
    const { error: updateError } = await supabase
      .from('sys_platform_mode')
      .update({
        mode: newMode,
        stripe_mode: newMode,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (updateError) {
      logger.error('Failed to update platform mode', { error: updateError });
      return { success: false, error: updateError.message };
    }

    // Log to audit trail
    await supabase
      .from('sys_platform_mode_audit')
      .insert({
        changed_by: userId,
        old_mode: oldMode,
        new_mode: newMode,
        reason: reason || `Switched from ${oldMode} to ${newMode}`,
      })
      .catch((err) => logger.warn('Failed to log mode change', { error: err }));

    logger.info('✅ Platform mode updated', {
      oldMode,
      newMode,
      changedBy: userId,
      reason,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error setting platform mode', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get all service modes at once
 */
export async function getAllServiceModes(): Promise<ServiceModes> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('sys_platform_mode')
      .select('mode, stripe_mode, dataforseo_mode, semrush_mode, ai_mode')
      .eq('id', 1)
      .single();

    if (error) {
      logger.warn('Failed to fetch service modes, using defaults', { error });
      return { stripe: 'test', dataforseo: 'test', semrush: 'test', ai: 'test' };
    }

    return {
      stripe: (data?.stripe_mode || data?.mode || 'test') as PlatformMode,
      dataforseo: (data?.dataforseo_mode || 'test') as PlatformMode,
      semrush: (data?.semrush_mode || 'test') as PlatformMode,
      ai: (data?.ai_mode || 'test') as PlatformMode,
    };
  } catch (error) {
    logger.error('Error getting service modes', { error });
    return { stripe: 'test', dataforseo: 'test', semrush: 'test', ai: 'test' };
  }
}

/**
 * Set mode for a specific service (admin only)
 */
export async function setServiceMode(
  service: keyof ServiceModes,
  newMode: PlatformMode,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const columnName = `${service}_mode`;

    // Get current mode
    const { data: current, error: fetchError } = await supabase
      .from('sys_platform_mode')
      .select(columnName)
      .eq('id', 1)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current mode', { error: fetchError });
      return { success: false, error: 'Failed to fetch current mode' };
    }

    const oldMode = current[columnName];

    if (oldMode === newMode) {
      return { success: true };
    }

    // Update mode
    const { error: updateError } = await supabase
      .from('sys_platform_mode')
      .update({
        [columnName]: newMode,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (updateError) {
      logger.error('Failed to update service mode', { error: updateError });
      return { success: false, error: updateError.message };
    }

    // Log to audit trail
    await supabase
      .from('sys_platform_mode_audit')
      .insert({
        changed_by: userId,
        service,
        old_mode: oldMode,
        new_mode: newMode,
        reason: reason || `${service}: ${oldMode} → ${newMode}`,
      })
      .catch((err) => logger.warn('Failed to log mode change', { error: err }));

    logger.info(`✅ ${service} mode updated`, { oldMode, newMode, changedBy: userId });
    return { success: true };
  } catch (error) {
    logger.error('Error setting service mode', { error });
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get Stripe keys for current mode
 */
export async function getStripeKeys() {
  const modes = await getAllServiceModes();
  const mode = modes.stripe;

  return {
    mode,
    publicKey:
      mode === 'live'
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
        : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,
    secretKey:
      mode === 'live'
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY_TEST,
    webhookSecret:
      mode === 'live'
        ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
        : process.env.STRIPE_WEBHOOK_SECRET_TEST,
  };
}

/**
 * Get DataForSEO credentials for current mode
 */
export async function getDataForSEOCredentials() {
  const modes = await getAllServiceModes();
  const mode = modes.dataforseo;

  return {
    mode,
    login:
      mode === 'live'
        ? process.env.DATAFORSEO_LOGIN_LIVE
        : process.env.DATAFORSEO_LOGIN_TEST,
    password:
      mode === 'live'
        ? process.env.DATAFORSEO_PASSWORD_LIVE
        : process.env.DATAFORSEO_PASSWORD_TEST,
  };
}

/**
 * Get SEMRush API key for current mode
 */
export async function getSEMRushCredentials() {
  const modes = await getAllServiceModes();
  const mode = modes.semrush;

  return {
    mode,
    apiKey:
      mode === 'live'
        ? process.env.SEMRUSH_API_KEY_LIVE
        : process.env.SEMRUSH_API_KEY_TEST,
  };
}

/**
 * Get AI model config for current mode
 */
export async function getAIModelConfig() {
  const modes = await getAllServiceModes();
  const mode = modes.ai;

  // In test mode, use cheaper/faster models
  return {
    mode,
    defaultModel: mode === 'live' ? 'claude-sonnet-4-5-20250929' : 'claude-haiku-4-5-20251001',
    thinkingModel: mode === 'live' ? 'claude-opus-4-5-20251101' : 'claude-sonnet-4-5-20250929',
    thinkingBudget: mode === 'live' ? 10000 : 3000,
    maxTokens: mode === 'live' ? 4096 : 1024,
  };
}

/**
 * Get mode audit history
 */
export async function getModeAuditHistory(limit: number = 20) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('sys_platform_mode_audit')
      .select('*, changed_by(*)')
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch audit history', { error });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error fetching audit history', { error });
    return [];
  }
}
