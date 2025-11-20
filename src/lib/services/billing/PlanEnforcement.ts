/**
 * PlanEnforcement
 * Phase 12 Week 5-6: Enforce plan limits across services
 */

import { billingEngine } from './BillingEngine';
import { usageMeteringService, CounterType, LimitBehavior } from './UsageMeteringService';

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  upgrade_required?: boolean;
}

/**
 * Check if organization can create a workspace
 */
export async function canCreateWorkspace(orgId: string): Promise<EnforcementResult> {
  const limits = await billingEngine.getPlanLimits(orgId);
  if (!limits) {
    return { allowed: false, reason: 'No active subscription' };
  }

  if (limits.workspaces === -1) {
    return { allowed: true };
  }

  const check = await usageMeteringService.checkLimit(orgId, 'workspaces');

  return {
    allowed: check.is_within_limit,
    reason: check.is_within_limit ? undefined : 'Workspace limit reached',
    limit: limits.workspaces,
    current: check.current_usage,
    upgrade_required: !check.is_within_limit,
  };
}

/**
 * Check if organization can add user to workspace
 */
export async function canAddUser(
  orgId: string,
  currentUserCount: number
): Promise<EnforcementResult> {
  const limits = await billingEngine.getPlanLimits(orgId);
  if (!limits) {
    return { allowed: false, reason: 'No active subscription' };
  }

  if (limits.users === -1) {
    return { allowed: true };
  }

  const allowed = currentUserCount < limits.users;

  return {
    allowed,
    reason: allowed ? undefined : 'User limit reached for workspace',
    limit: limits.users,
    current: currentUserCount,
    upgrade_required: !allowed,
  };
}

/**
 * Check if organization can create contact
 */
export async function canCreateContact(orgId: string): Promise<EnforcementResult> {
  const check = await usageMeteringService.canPerformAction(orgId, 'contacts', 'block');

  if (!check.allowed) {
    const limits = await billingEngine.getPlanLimits(orgId);
    return {
      allowed: false,
      reason: check.reason,
      limit: limits?.contacts,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if organization can send email
 */
export async function canSendEmail(
  orgId: string,
  behavior: LimitBehavior = 'warn'
): Promise<EnforcementResult> {
  const check = await usageMeteringService.canPerformAction(orgId, 'emails', behavior);

  if (!check.allowed) {
    const limits = await billingEngine.getPlanLimits(orgId);
    return {
      allowed: false,
      reason: check.reason,
      limit: limits?.emails,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    reason: check.reason, // May contain warning
  };
}

/**
 * Check if organization can make AI request
 */
export async function canMakeAIRequest(
  orgId: string,
  behavior: LimitBehavior = 'block'
): Promise<EnforcementResult> {
  const check = await usageMeteringService.canPerformAction(orgId, 'ai_requests', behavior);

  if (!check.allowed) {
    const limits = await billingEngine.getPlanLimits(orgId);
    return {
      allowed: false,
      reason: check.reason,
      limit: limits?.ai_requests,
      upgrade_required: true,
    };
  }

  return {
    allowed: true,
    reason: check.reason,
  };
}

/**
 * Check if organization can generate report
 */
export async function canGenerateReport(orgId: string): Promise<EnforcementResult> {
  const check = await usageMeteringService.canPerformAction(orgId, 'reports', 'block');

  if (!check.allowed) {
    const limits = await billingEngine.getPlanLimits(orgId);
    return {
      allowed: false,
      reason: check.reason,
      limit: limits?.reports,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if organization can create campaign
 */
export async function canCreateCampaign(orgId: string): Promise<EnforcementResult> {
  const check = await usageMeteringService.canPerformAction(orgId, 'campaigns', 'block');

  if (!check.allowed) {
    const limits = await billingEngine.getPlanLimits(orgId);
    return {
      allowed: false,
      reason: check.reason,
      limit: limits?.campaigns,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if organization has feature access
 */
export async function hasFeatureAccess(
  orgId: string,
  feature: string
): Promise<EnforcementResult> {
  const hasFeature = await billingEngine.hasFeature(orgId, feature);

  return {
    allowed: hasFeature,
    reason: hasFeature ? undefined : `Feature '${feature}' not included in current plan`,
    upgrade_required: !hasFeature,
  };
}

/**
 * Enforce limit and throw if exceeded
 */
export async function enforceLimit(
  orgId: string,
  counterType: CounterType,
  behavior: LimitBehavior = 'block'
): Promise<void> {
  const check = await usageMeteringService.canPerformAction(orgId, counterType, behavior);

  if (!check.allowed) {
    throw new Error(check.reason || `${counterType} limit exceeded`);
  }

  if (check.reason && behavior === 'warn') {
    console.warn(`[Plan Warning] ${orgId}: ${check.reason}`);
  }
}

/**
 * Enforce feature access and throw if not available
 */
export async function enforceFeature(orgId: string, feature: string): Promise<void> {
  const result = await hasFeatureAccess(orgId, feature);

  if (!result.allowed) {
    throw new Error(result.reason || `Feature '${feature}' not available`);
  }
}

/**
 * Get organization's plan tier
 */
export async function getPlanTier(
  orgId: string
): Promise<'free' | 'starter' | 'professional' | 'enterprise' | 'custom' | null> {
  const subscription = await billingEngine.getSubscription(orgId);
  return subscription?.plan?.tier || null;
}

/**
 * Check if organization is on enterprise plan
 */
export async function isEnterprise(orgId: string): Promise<boolean> {
  const tier = await getPlanTier(orgId);
  return tier === 'enterprise' || tier === 'custom';
}

/**
 * Wrapper for services to check limits before operations
 */
export function withPlanEnforcement<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  checkFn: (orgId: string) => Promise<EnforcementResult>,
  getOrgId: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const orgId = getOrgId(...args);
    const result = await checkFn(orgId);

    if (!result.allowed) {
      throw new Error(result.reason || 'Operation not allowed by plan');
    }

    return fn(...args);
  }) as T;
}
