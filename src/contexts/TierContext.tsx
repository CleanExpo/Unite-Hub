"use client";

/**
 * Tier Context - Synthex Tier-Based Feature Access
 * Phase 4 of Unite-Hub Rebuild
 *
 * Provides tier information and feature access control for Synthex client portal.
 * Maps to synthex_tier_limits table structure from migration 401.
 *
 * Tiers:
 * - starter: $29/mo - Basic features
 * - professional: $99/mo - SEO reports, extended thinking
 * - elite: $299/mo - All features, unlimited
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Tier levels in order (for comparison)
type TierLevel = 'starter' | 'professional' | 'elite';

// Subscription status
type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled';

// Feature names from synthex_tier_limits table
type FeatureName =
  | 'seo_reports'
  | 'competitor_analysis'
  | 'api_access'
  | 'priority_support'
  | 'white_label'
  | 'custom_domain'
  | 'ai_content_generation'
  | 'ai_extended_thinking'
  | 'ai_agent_access';

// Limit names from synthex_tier_limits table
type LimitName =
  | 'contacts_limit'
  | 'campaigns_limit'
  | 'emails_per_month'
  | 'drip_campaigns_limit'
  | 'storage_limit_mb';

interface TierLimits {
  tier: TierLevel;
  contacts_limit: number;
  campaigns_limit: number;
  emails_per_month: number;
  drip_campaigns_limit: number;
  seo_reports: boolean;
  competitor_analysis: boolean;
  api_access: boolean;
  priority_support: boolean;
  white_label: boolean;
  custom_domain: boolean;
  ai_content_generation: boolean;
  ai_extended_thinking: boolean;
  ai_agent_access: boolean;
  storage_limit_mb: number;
}

interface WorkspaceTierInfo {
  workspaceId: string;
  currentTier: TierLevel;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  limits: TierLimits | null;
}

interface TierContextType {
  tierInfo: WorkspaceTierInfo | null;
  loading: boolean;
  error: string | null;

  // Feature access check
  canAccessFeature: (featureName: FeatureName) => boolean;

  // Limit check
  getLimit: (limitName: LimitName) => number;
  isUnlimited: (limitName: LimitName) => boolean;

  // Tier comparison
  hasTier: (requiredTier: TierLevel) => boolean;

  // Usage tracking
  refreshTierInfo: () => Promise<void>;

  // Upgrade prompts
  getUpgradeMessage: (featureName: FeatureName) => string | null;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

export function TierProvider({
  children,
  workspaceId,
}: {
  children: React.ReactNode;
  workspaceId: string;
}) {
  const [tierInfo, setTierInfo] = useState<WorkspaceTierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch tier information for workspace
  const fetchTierInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get workspace tier information
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, current_tier, subscription_status, trial_ends_at')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) {
        throw new Error(`Failed to fetch workspace: ${workspaceError.message}`);
      }

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Get tier limits
      const { data: limits, error: limitsError } = await supabase
        .from('synthex_tier_limits')
        .select('*')
        .eq('tier', workspace.current_tier)
        .single();

      if (limitsError) {
        throw new Error(`Failed to fetch tier limits: ${limitsError.message}`);
      }

      setTierInfo({
        workspaceId: workspace.id,
        currentTier: workspace.current_tier as TierLevel,
        subscriptionStatus: workspace.subscription_status as SubscriptionStatus,
        trialEndsAt: workspace.trial_ends_at,
        limits: limits as TierLimits,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TierContext] Error fetching tier info:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount and when workspaceId changes
  useEffect(() => {
    if (workspaceId) {
      fetchTierInfo();
    }
  }, [workspaceId]);

  // Check if workspace can access a feature
  const canAccessFeature = (featureName: FeatureName): boolean => {
    if (!tierInfo?.limits) {
return false;
}

    // Check subscription status
    if (tierInfo.subscriptionStatus === 'cancelled' || tierInfo.subscriptionStatus === 'past_due') {
      return false;
    }

    return tierInfo.limits[featureName] === true;
  };

  // Get limit value for a resource
  const getLimit = (limitName: LimitName): number => {
    if (!tierInfo?.limits) {
return 0;
}
    return tierInfo.limits[limitName];
  };

  // Check if limit is unlimited (-1)
  const isUnlimited = (limitName: LimitName): boolean => {
    return getLimit(limitName) === -1;
  };

  // Check if workspace has at least the required tier
  const hasTier = (requiredTier: TierLevel): boolean => {
    if (!tierInfo) {
return false;
}

    // Check subscription status
    if (tierInfo.subscriptionStatus === 'cancelled') {
      return false;
    }

    const tierOrder: TierLevel[] = ['starter', 'professional', 'elite'];
    const currentIndex = tierOrder.indexOf(tierInfo.currentTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    return currentIndex >= requiredIndex;
  };

  // Get upgrade message for gated feature
  const getUpgradeMessage = (featureName: FeatureName): string | null => {
    if (canAccessFeature(featureName)) {
      return null; // Feature is accessible
    }

    if (!tierInfo) {
      return 'Unable to verify tier information. Please refresh.';
    }

    // Map features to required tiers
    const featureTierMap: Record<FeatureName, TierLevel> = {
      seo_reports: 'professional',
      competitor_analysis: 'elite',
      api_access: 'professional',
      priority_support: 'elite',
      white_label: 'elite',
      custom_domain: 'elite',
      ai_content_generation: 'starter',
      ai_extended_thinking: 'professional',
      ai_agent_access: 'elite',
    };

    const requiredTier = featureTierMap[featureName];

    if (tierInfo.currentTier === 'starter' && requiredTier === 'professional') {
      return 'Upgrade to Professional ($99/mo) to unlock this feature.';
    }

    if (tierInfo.currentTier === 'starter' && requiredTier === 'elite') {
      return 'Upgrade to Elite ($299/mo) to unlock this feature.';
    }

    if (tierInfo.currentTier === 'professional' && requiredTier === 'elite') {
      return 'Upgrade to Elite ($299/mo) to unlock this feature.';
    }

    return 'This feature is not available on your current plan.';
  };

  const value: TierContextType = {
    tierInfo,
    loading,
    error,
    canAccessFeature,
    getLimit,
    isUnlimited,
    hasTier,
    refreshTierInfo: fetchTierInfo,
    getUpgradeMessage,
  };

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

/**
 * Hook to access tier context
 * Must be used within TierProvider
 */
export function useTier() {
  const context = useContext(TierContext);
  if (context === undefined) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
}

/**
 * Utility hook for feature gates
 * Returns { allowed, message } for feature access
 */
export function useFeatureGate(featureName: FeatureName) {
  const { canAccessFeature, getUpgradeMessage } = useTier();

  return {
    allowed: canAccessFeature(featureName),
    message: getUpgradeMessage(featureName),
  };
}

/**
 * Utility hook for limit checks
 * Returns { limit, isUnlimited, remaining }
 */
export function useLimit(limitName: LimitName, currentUsage: number) {
  const { getLimit, isUnlimited } = useTier();

  const limit = getLimit(limitName);
  const unlimited = isUnlimited(limitName);
  const remaining = unlimited ? Infinity : Math.max(0, limit - currentUsage);

  return {
    limit,
    isUnlimited: unlimited,
    remaining,
    percentage: unlimited ? 0 : (currentUsage / limit) * 100,
  };
}
