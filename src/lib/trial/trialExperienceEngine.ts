/**
 * Trial Experience Engine
 * Orchestrates trial state, enforces limits, triggers upgrade prompts, resolves module capability
 *
 * Truth Layer: All blocking, warnings, and prompts must be honest and logged
 */

import { supabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import {
  DEFAULT_TRIAL_PROFILE,
  isModuleDisabled,
  isModuleLimited,
  calculateCapacityUsage,
  generateUpgradeMessage,
} from './trialCapabilityProfile';

const logger = createApiLogger({ service: 'trialExperienceEngine' });

export interface TrialState {
  isTrialActive: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  trialExpiresAt: string;
  aiTokens: {
    used: number;
    cap: number;
    remaining: number;
    percentUsed: number;
    softCapExceeded: boolean;
  };
  vifGenerations: {
    used: number;
    cap: number;
    remaining: number;
    hardCapReached: boolean;
  };
  blueprints: {
    created: number;
    cap: number;
    remaining: number;
    hardCapReached: boolean;
  };
  enabledModules: string[];
  limitedModules: string[];
  disabledModules: string[];
}

export interface EnforcementResult {
  allowed: boolean;
  reason: string | null;
  blocking: boolean;
  warning: boolean;
  userMessage: string | null;
  systemAction: 'allow' | 'warn' | 'deny';
}

export interface UpgradePromptConfig {
  shouldShow: boolean;
  message: string | null;
  urgency: 'low' | 'medium' | 'high';
  reason: string | null;
}

/**
 * Get complete trial state for workspace
 */
export async function getTrialState(workspaceId: string): Promise<TrialState | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_trial_status', {
      p_workspace_id: workspaceId,
    });

    if (error || !data || data.length === 0) {
      logger.debug('No trial found for workspace', { workspaceId });
      return null;
    }

    const trial = data[0];

    return {
      isTrialActive: trial.trial_active,
      daysRemaining: trial.days_remaining || 0,
      hoursRemaining: trial.hours_remaining || 0,
      trialExpiresAt: trial.trial_expires_at,
      aiTokens: {
        used: trial.ai_tokens_used || 0,
        cap: trial.ai_tokens_cap || 50000,
        remaining: trial.ai_tokens_remaining || 0,
        percentUsed: trial.ai_tokens_percent_used || 0,
        softCapExceeded: (trial.ai_tokens_percent_used || 0) > 100,
      },
      vifGenerations: {
        used: trial.vif_generations_used || 0,
        cap: trial.vif_generations_cap || 10,
        remaining: trial.vif_generations_remaining || 10,
        hardCapReached: (trial.vif_generations_remaining || 0) <= 0,
      },
      blueprints: {
        created: trial.blueprints_created || 0,
        cap: trial.blueprints_cap || 5,
        remaining: trial.blueprints_remaining || 5,
        hardCapReached: (trial.blueprints_remaining || 0) <= 0,
      },
      enabledModules: trial.enabled_modules || [],
      limitedModules: trial.limited_modules || [],
      disabledModules: trial.disabled_modules || [],
    };
  } catch (error) {
    logger.error('Failed to get trial state', { error, workspaceId });
    return null;
  }
}

/**
 * Check if user is currently in a trial
 */
export async function isTrialActive(workspaceId: string): Promise<boolean> {
  const state = await getTrialState(workspaceId);
  return state?.isTrialActive || false;
}

/**
 * Enforce trial limits for a specific action
 * Returns whether action is allowed and any warnings/messages
 */
export async function enforceTrialLimits(
  workspaceId: string,
  actionType: 'ai_usage' | 'vif_generation' | 'blueprint_creation' | 'production_job',
  metadata?: Record<string, any>
): Promise<EnforcementResult> {
  const trialState = await getTrialState(workspaceId);

  // Not a trial user - always allow
  if (!trialState || !trialState.isTrialActive) {
    return {
      allowed: true,
      reason: null,
      blocking: false,
      warning: false,
      userMessage: null,
      systemAction: 'allow',
    };
  }

  // Check specific limits
  switch (actionType) {
    case 'vif_generation': {
      if (trialState.vifGenerations.hardCapReached) {
        await logTrialActivity(workspaceId, 'limit_hit', {
          limit_type: 'vif_generations',
          cap: trialState.vifGenerations.cap,
          used: trialState.vifGenerations.used,
        });

        return {
          allowed: false,
          reason: 'VIF generation limit reached',
          blocking: true,
          warning: false,
          userMessage:
            "You've used all 10 visual generations in your trial. Upgrade to create more visuals.",
          systemAction: 'deny',
        };
      }
      break;
    }

    case 'blueprint_creation': {
      if (trialState.blueprints.hardCapReached) {
        await logTrialActivity(workspaceId, 'limit_hit', {
          limit_type: 'blueprints',
          cap: trialState.blueprints.cap,
          created: trialState.blueprints.created,
        });

        return {
          allowed: false,
          reason: 'Blueprint creation limit reached',
          blocking: true,
          warning: false,
          userMessage:
            "You've created 5 blueprints (trial limit). Upgrade to create unlimited blueprints.",
          systemAction: 'deny',
        };
      }
      break;
    }

    case 'production_job': {
      // Production is completely disabled in trial
      await logTrialActivity(workspaceId, 'feature_denied', {
        feature: 'production_jobs',
        reason: 'disabled_in_trial',
      });

      return {
        allowed: false,
        reason: 'Production jobs disabled in trial',
        blocking: true,
        warning: false,
        userMessage: 'Production jobs are not available in trial. Upgrade to start scheduling content.',
        systemAction: 'deny',
      };
    }

    case 'ai_usage': {
      // Soft cap: warn but allow
      if (trialState.aiTokens.softCapExceeded) {
        return {
          allowed: true,
          reason: 'AI token soft cap exceeded',
          blocking: false,
          warning: true,
          userMessage: `You're using more AI tokens than your trial guideline (50,000). We're not blocking you, but consider upgrading for unlimited usage.`,
          systemAction: 'warn',
        };
      }

      // Approaching soft cap
      if (trialState.aiTokens.percentUsed >= 80) {
        return {
          allowed: true,
          reason: 'Approaching AI token limit',
          blocking: false,
          warning: true,
          userMessage: `You've used ${trialState.aiTokens.percentUsed.toFixed(0)}% of your trial AI token guideline. Upgrade for unlimited usage.`,
          systemAction: 'warn',
        };
      }
      break;
    }
  }

  // Action is allowed
  return {
    allowed: true,
    reason: null,
    blocking: false,
    warning: false,
    userMessage: null,
    systemAction: 'allow',
  };
}

/**
 * Check if a specific feature/module is allowed
 */
export async function isFeatureAllowed(workspaceId: string, moduleId: string): Promise<boolean> {
  const trialState = await getTrialState(workspaceId);

  // Not a trial - always allow
  if (!trialState || !trialState.isTrialActive) {
    return true;
  }

  // Check if module is enabled or limited (limited = allowed but restricted)
  const isDisabled = isModuleDisabled(moduleId, DEFAULT_TRIAL_PROFILE);
  return !isDisabled;
}

/**
 * Get module access level (full, limited, or disabled)
 */
export async function getModuleAccessLevel(
  workspaceId: string,
  moduleId: string
): Promise<'full' | 'limited' | 'disabled' | 'none'> {
  const trialState = await getTrialState(workspaceId);

  // Not a trial - full access
  if (!trialState || !trialState.isTrialActive) {
    return 'none'; // Not in trial
  }

  // Check enabled modules
  if (trialState.enabledModules.includes(moduleId)) {
    return 'full';
  }

  // Check limited modules
  if (trialState.limitedModules.includes(moduleId)) {
    return 'limited';
  }

  // Check disabled modules
  if (trialState.disabledModules.includes(moduleId)) {
    return 'disabled';
  }

  return 'none'; // Unknown module
}

/**
 * Determine if upgrade prompt should be shown
 */
export async function shouldShowUpgradePrompt(
  workspaceId: string,
  triggerType?: 'ai_approaching' | 'ai_exceeded' | 'vif_limit' | 'blueprint_limit' | 'feature_denied'
): Promise<UpgradePromptConfig> {
  const trialState = await getTrialState(workspaceId);

  // Not a trial - no prompt
  if (!trialState || !trialState.isTrialActive) {
    return {
      shouldShow: false,
      message: null,
      urgency: 'low',
      reason: null,
    };
  }

  // Hard caps: always show
  if (trialState.vifGenerations.hardCapReached) {
    const message = generateUpgradeMessage('VIF generation limit reached', 'high');
    return {
      shouldShow: true,
      message,
      urgency: 'high',
      reason: 'VIF generation limit reached',
    };
  }

  if (trialState.blueprints.hardCapReached) {
    const message = generateUpgradeMessage('Blueprint creation limit reached', 'high');
    return {
      shouldShow: true,
      message,
      urgency: 'high',
      reason: 'Blueprint creation limit reached',
    };
  }

  // Soft cap exceeded
  if (trialState.aiTokens.softCapExceeded) {
    const message = generateUpgradeMessage('AI token soft cap exceeded', 'medium');
    return {
      shouldShow: true,
      message,
      urgency: 'medium',
      reason: 'AI token soft cap exceeded',
    };
  }

  // Approaching soft cap
  if (trialState.aiTokens.percentUsed >= 80) {
    const message = generateUpgradeMessage('Approaching AI token limit', 'low');
    return {
      shouldShow: true,
      message,
      urgency: 'low',
      reason: 'Approaching AI token limit',
    };
  }

  // Trial ending soon
  if (trialState.daysRemaining <= 3) {
    return {
      shouldShow: true,
      message: `Your trial ends in ${trialState.daysRemaining} days. Upgrade now to keep your work.`,
      urgency: 'high',
      reason: 'Trial expiring soon',
    };
  }

  return {
    shouldShow: false,
    message: null,
    urgency: 'low',
    reason: null,
  };
}

/**
 * Get remaining capacity across all limits
 */
export async function getRemainingCapacity(
  workspaceId: string
): Promise<{
  aiTokensRemaining: number;
  vifGenerationsRemaining: number;
  blueprintsRemaining: number;
  capacityPercent: number;
} | null> {
  const trialState = await getTrialState(workspaceId);

  if (!trialState || !trialState.isTrialActive) {
    return null;
  }

  // Calculate overall capacity percentage
  let totalCapacity = 0;
  let totalUsed = 0;

  // AI tokens (soft cap, so use different calculation)
  totalCapacity += 100; // Max 100% for AI tokens
  totalUsed += Math.min(100, trialState.aiTokens.percentUsed);

  // VIF (hard cap)
  totalCapacity += 100;
  const vifPercent = (trialState.vifGenerations.used / trialState.vifGenerations.cap) * 100;
  totalUsed += vifPercent;

  // Blueprints (hard cap)
  totalCapacity += 100;
  const blueprintPercent = (trialState.blueprints.created / trialState.blueprints.cap) * 100;
  totalUsed += blueprintPercent;

  const overallPercent = Math.round((totalUsed / totalCapacity) * 100);

  return {
    aiTokensRemaining: trialState.aiTokens.remaining,
    vifGenerationsRemaining: trialState.vifGenerations.remaining,
    blueprintsRemaining: trialState.blueprints.remaining,
    capacityPercent: overallPercent,
  };
}

/**
 * Record that user hit a limit (for analytics and UX)
 */
export async function recordLimitHit(
  workspaceId: string,
  userId: string,
  limitType: 'vif' | 'blueprint' | 'ai_soft_cap' | 'ai_hard_cap',
  context?: Record<string, any>
): Promise<void> {
  try {
    await supabaseAdmin.rpc('log_trial_activity', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_activity_type: 'limit_hit',
      p_activity_category: 'limit',
      p_context: {
        limit_type: limitType,
        ...context,
      },
      p_user_message: `User hit ${limitType} limit`,
      p_system_action: limitType.startsWith('ai_soft') ? 'warn' : 'deny',
    });
  } catch (error) {
    logger.error('Failed to record limit hit', { error, workspaceId, limitType });
  }
}

/**
 * Log any trial activity for audit trail
 */
export async function logTrialActivity(
  workspaceId: string,
  activityType:
    | 'ai_usage'
    | 'vif_generation'
    | 'blueprint_creation'
    | 'module_access'
    | 'limit_hit'
    | 'upgrade_prompt_shown'
    | 'upgrade_prompt_declined'
    | 'feature_denied'
    | 'trial_expired'
    | 'trial_converted',
  context?: Record<string, any>,
  userMessage?: string,
  systemAction?: 'allow' | 'warn' | 'deny'
): Promise<void> {
  try {
    const activityCategoryMap: Record<string, 'usage' | 'limit' | 'prompt' | 'access' | 'conversion'> = {
      ai_usage: 'usage',
      vif_generation: 'usage',
      blueprint_creation: 'usage',
      module_access: 'access',
      limit_hit: 'limit',
      upgrade_prompt_shown: 'prompt',
      upgrade_prompt_declined: 'prompt',
      feature_denied: 'access',
      trial_expired: 'conversion',
      trial_converted: 'conversion',
    };

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .single();

    if (!profile) {
      logger.warn('No profile found for workspace', { workspaceId });
      return;
    }

    await supabaseAdmin.rpc('log_trial_activity', {
      p_workspace_id: workspaceId,
      p_user_id: profile.id,
      p_activity_type: activityType,
      p_activity_category: activityCategoryMap[activityType],
      p_context: context || {},
      p_user_message: userMessage || null,
      p_system_action: systemAction || 'allow',
    });
  } catch (error) {
    logger.error('Failed to log trial activity', { error, workspaceId, activityType });
  }
}

/**
 * Convert trial to paid account
 */
export async function convertTrialToPaid(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('convert_trial_to_paid', {
      p_workspace_id: workspaceId,
      p_converted_by: userId,
    });

    if (error) {
      logger.error('Failed to convert trial', { error, workspaceId });
      return false;
    }

    await logTrialActivity(
      workspaceId,
      'trial_converted',
      { converted_by: userId },
      'Account converted from trial to paid',
      'allow'
    );

    logger.info('Trial converted to paid', { workspaceId, userId });
    return true;
  } catch (error) {
    logger.error('Exception converting trial', { error, workspaceId });
    return false;
  }
}

/**
 * Check if trial has expired and clean up if needed
 */
export async function checkTrialExpiration(workspaceId: string): Promise<boolean> {
  const trialState = await getTrialState(workspaceId);

  if (!trialState) {
    return false;
  }

  // If trial was active but now expired
  if (trialState.isTrialActive === false && trialState.daysRemaining < 0) {
    await logTrialActivity(
      workspaceId,
      'trial_expired',
      { expired_at: trialState.trialExpiresAt },
      'Trial period expired',
      'deny'
    );

    return true;
  }

  return false;
}
