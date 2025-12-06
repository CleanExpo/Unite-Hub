/**
 * Synthex Admin Service
 * Handles global admin operations, cross-tenant reporting, and admin authorization
 * Phase B25: Global Admin & Cross-Tenant Reporting
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// TYPES
// =====================================================

export type AdminScope = 'global' | 'group' | 'tenant';

export interface AdminUser {
  id: string;
  user_id: string;
  scope: AdminScope;
  tenant_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAuthorization {
  is_authorized: boolean;
  scope: AdminScope | null;
  tenant_ids: string[] | null;
}

export interface TenantSummary {
  tenant_id: string;
  business_name: string;
  industry: string;
  region: string | null;
  tenant_status: string;
  tenant_created_at: string;

  // Subscription
  subscription_id: string | null;
  subscription_status: string | null;
  billing_period: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;

  // Plan
  plan_code: string | null;
  plan_name: string | null;
  monthly_price_cents: number | null;
  yearly_price_cents: number | null;

  // Team
  team_member_count: number;

  // Usage
  current_contacts: number;
  current_emails_sent: number;
  current_ai_calls: number;

  // Activity
  contacts_added_30d: number;
  campaigns_created_30d: number;
}

export interface HealthSummary {
  tenant_id: string;
  business_name: string;
  tenant_status: string;
  subscription_status: string | null;
  current_period_end: string | null;
  subscription_expired: boolean;
  recent_contacts: number;
  recent_campaigns: number;
  last_activity_at: string;
  health_score: number; // 0-100
}

export interface GlobalKpis {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  churned_tenants: number;
  total_revenue_mrr: number; // Monthly Recurring Revenue in cents
  total_team_members: number;
  total_contacts: number;
  total_campaigns: number;
  avg_health_score: number;
  tenants_by_plan: {
    FREE: number;
    PRO: number;
    AGENCY: number;
  };
  tenants_by_status: {
    active: number;
    trial: number;
    suspended: number;
    churned: number;
  };
}

export interface TenantHealthSnapshot {
  tenant_id: string;
  business_name: string;
  health_score: number;
  subscription_status: string | null;
  last_activity_at: string;
  issues: string[];
  recommendations: string[];
  metrics: {
    contacts: number;
    campaigns: number;
    emails_sent: number;
    ai_calls: number;
    team_members: number;
  };
}

export interface AdminAction {
  action: 'RUN_HEALTH_CHECK' | 'FLAG_STATUS' | 'SEND_NOTIFICATION';
  tenant_id: string;
  params?: Record<string, unknown>;
}

export interface AdminActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// =====================================================
// ADMIN AUTHORIZATION
// =====================================================

/**
 * Get admin scope and authorization for a user
 */
export async function getAdminScope(userId: string): Promise<AdminAuthorization> {
  const { data, error } = await supabaseAdmin
    .rpc('check_admin_authorization', {
      p_user_id: userId,
    })
    .single();

  if (error) {
    console.error('[AdminService] Error checking admin authorization:', error);
    return {
      is_authorized: false,
      scope: null,
      tenant_ids: null,
    };
  }

  if (!data || !data.is_authorized) {
    return {
      is_authorized: false,
      scope: null,
      tenant_ids: null,
    };
  }

  return {
    is_authorized: data.is_authorized,
    scope: data.scope as AdminScope,
    tenant_ids: data.tenant_ids,
  };
}

/**
 * Check if user has admin access to specific tenant
 */
export async function checkTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('check_admin_authorization', {
      p_user_id: userId,
      p_tenant_id: tenantId,
    })
    .single();

  if (error) {
    console.error('[AdminService] Error checking tenant access:', error);
    return false;
  }

  return data?.is_authorized || false;
}

/**
 * Get list of tenant IDs accessible to admin
 */
export async function getAdminTenantIds(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .rpc('get_admin_tenant_ids', {
      p_user_id: userId,
    })
    .single();

  if (error) {
    console.error('[AdminService] Error getting admin tenant IDs:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// TENANT SUMMARIES
// =====================================================

/**
 * List tenant summaries for admin (filtered by scope)
 */
export async function listTenantSummariesForAdmin(
  userId: string,
  filters?: {
    status?: string;
    plan_code?: string;
    industry?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ summaries: TenantSummary[]; total: number }> {
  // Check authorization
  const auth = await getAdminScope(userId);
  if (!auth.is_authorized) {
    throw new Error('User is not authorized as admin');
  }

  // Get accessible tenant IDs
  const tenantIds = await getAdminTenantIds(userId);

  // Build query
  let query = supabaseAdmin
    .from('view_synthex_tenant_summary')
    .select('*', { count: 'exact' });

  // Filter by accessible tenants (unless global admin)
  if (auth.scope !== 'global') {
    query = query.in('tenant_id', tenantIds);
  }

  // Apply filters
  if (filters?.status) {
    query = query.eq('tenant_status', filters.status);
  }
  if (filters?.plan_code) {
    query = query.eq('plan_code', filters.plan_code);
  }
  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Order by created_at desc
  query = query.order('tenant_created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('[AdminService] Error fetching tenant summaries:', error);
    throw new Error(`Failed to fetch tenant summaries: ${error.message}`);
  }

  return {
    summaries: (data || []) as TenantSummary[],
    total: count || 0,
  };
}

/**
 * Get specific tenant summary (with authorization check)
 */
export async function getTenantSummary(
  userId: string,
  tenantId: string
): Promise<TenantSummary | null> {
  // Check access
  const hasAccess = await checkTenantAccess(userId, tenantId);
  if (!hasAccess) {
    throw new Error('User does not have access to this tenant');
  }

  const { data, error } = await supabaseAdmin
    .from('view_synthex_tenant_summary')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('[AdminService] Error fetching tenant summary:', error);
    return null;
  }

  return data as TenantSummary;
}

// =====================================================
// HEALTH MONITORING
// =====================================================

/**
 * Get tenant health snapshot with issues and recommendations
 */
export async function getTenantHealthSnapshot(
  userId: string,
  tenantId: string
): Promise<TenantHealthSnapshot | null> {
  // Check access
  const hasAccess = await checkTenantAccess(userId, tenantId);
  if (!hasAccess) {
    throw new Error('User does not have access to this tenant');
  }

  // Get health summary from view
  const { data: healthData, error: healthError } = await supabaseAdmin
    .from('view_synthex_health_summary')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (healthError) {
    console.error('[AdminService] Error fetching health summary:', healthError);
    return null;
  }

  // Get detailed metrics
  const { data: summary } = await supabaseAdmin
    .from('view_synthex_tenant_summary')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (!healthData || !summary) {
    return null;
  }

  // Analyze issues and recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  const health = healthData as HealthSummary;

  if (health.subscription_expired) {
    issues.push('Subscription has expired');
    recommendations.push('Contact tenant to renew subscription');
  }

  if (health.subscription_status === 'past_due') {
    issues.push('Payment is past due');
    recommendations.push('Follow up on payment status');
  }

  if (health.recent_contacts === 0 && health.recent_campaigns === 0) {
    issues.push('No recent activity (last 7 days)');
    recommendations.push('Check if tenant needs onboarding help');
  }

  if (health.health_score < 40) {
    issues.push('Low health score indicates at-risk tenant');
    recommendations.push('Proactive outreach recommended');
  }

  const lastActivity = new Date(health.last_activity_at);
  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity > 14) {
    issues.push(`No activity for ${daysSinceActivity} days`);
    recommendations.push('Re-engagement campaign suggested');
  }

  return {
    tenant_id: tenantId,
    business_name: health.business_name,
    health_score: health.health_score,
    subscription_status: health.subscription_status,
    last_activity_at: health.last_activity_at,
    issues,
    recommendations,
    metrics: {
      contacts: summary.current_contacts || 0,
      campaigns: summary.campaigns_created_30d || 0,
      emails_sent: summary.current_emails_sent || 0,
      ai_calls: summary.current_ai_calls || 0,
      team_members: summary.team_member_count || 0,
    },
  };
}

// =====================================================
// GLOBAL KPIs
// =====================================================

/**
 * Get global KPIs (global admins only)
 */
export async function getGlobalKpis(userId: string): Promise<GlobalKpis> {
  // Check authorization
  const auth = await getAdminScope(userId);
  if (!auth.is_authorized || auth.scope !== 'global') {
    throw new Error('Only global admins can access global KPIs');
  }

  // Get all tenant summaries
  const { data: summaries, error: summariesError } = await supabaseAdmin
    .from('view_synthex_tenant_summary')
    .select('*');

  if (summariesError) {
    console.error('[AdminService] Error fetching summaries for KPIs:', summariesError);
    throw new Error(`Failed to fetch KPIs: ${summariesError.message}`);
  }

  // Get health scores
  const { data: healthData, error: healthError } = await supabaseAdmin
    .from('view_synthex_health_summary')
    .select('health_score');

  if (healthError) {
    console.error('[AdminService] Error fetching health data:', healthError);
  }

  const tenants = summaries as TenantSummary[];
  const healthScores = (healthData || []) as { health_score: number }[];

  // Calculate KPIs
  const total_tenants = tenants.length;
  const active_tenants = tenants.filter(t => t.tenant_status === 'active').length;
  const trial_tenants = tenants.filter(t => t.tenant_status === 'trial').length;
  const churned_tenants = tenants.filter(t => t.tenant_status === 'churned').length;

  // Calculate MRR (Monthly Recurring Revenue)
  const total_revenue_mrr = tenants.reduce((sum, t) => {
    if (t.subscription_status === 'active' && t.monthly_price_cents) {
      return sum + t.monthly_price_cents;
    }
    return sum;
  }, 0);

  const total_team_members = tenants.reduce((sum, t) => sum + (t.team_member_count || 0), 0);
  const total_contacts = tenants.reduce((sum, t) => sum + (t.current_contacts || 0), 0);
  const total_campaigns = tenants.reduce((sum, t) => sum + (t.campaigns_created_30d || 0), 0);

  const avg_health_score = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, h) => sum + h.health_score, 0) / healthScores.length)
    : 0;

  // Tenants by plan
  const tenants_by_plan = {
    FREE: tenants.filter(t => t.plan_code === 'FREE').length,
    PRO: tenants.filter(t => t.plan_code === 'PRO').length,
    AGENCY: tenants.filter(t => t.plan_code === 'AGENCY').length,
  };

  // Tenants by status
  const tenants_by_status = {
    active: tenants.filter(t => t.tenant_status === 'active').length,
    trial: tenants.filter(t => t.tenant_status === 'trial').length,
    suspended: tenants.filter(t => t.tenant_status === 'suspended').length,
    churned: tenants.filter(t => t.tenant_status === 'churned').length,
  };

  return {
    total_tenants,
    active_tenants,
    trial_tenants,
    churned_tenants,
    total_revenue_mrr,
    total_team_members,
    total_contacts,
    total_campaigns,
    avg_health_score,
    tenants_by_plan,
    tenants_by_status,
  };
}

// =====================================================
// ADMIN ACTIONS
// =====================================================

/**
 * Execute safe admin actions
 */
export async function executeAdminAction(
  userId: string,
  action: AdminAction
): Promise<AdminActionResult> {
  // Check access
  const hasAccess = await checkTenantAccess(userId, action.tenant_id);
  if (!hasAccess) {
    return {
      success: false,
      message: 'User does not have access to this tenant',
    };
  }

  switch (action.action) {
    case 'RUN_HEALTH_CHECK':
      return await runHealthCheck(action.tenant_id);

    case 'FLAG_STATUS':
      return await flagTenantStatus(action.tenant_id, action.params);

    case 'SEND_NOTIFICATION':
      // Placeholder for future notification system
      return {
        success: false,
        message: 'Notification system not yet implemented',
      };

    default:
      return {
        success: false,
        message: `Unknown action: ${action.action}`,
      };
  }
}

/**
 * Run health check for tenant
 */
async function runHealthCheck(tenantId: string): Promise<AdminActionResult> {
  try {
    const { data: health, error } = await supabaseAdmin
      .from('view_synthex_health_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return {
        success: false,
        message: `Health check failed: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Health check completed',
      data: health,
    };
  } catch (error) {
    return {
      success: false,
      message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Flag tenant status (admin note)
 */
async function flagTenantStatus(
  tenantId: string,
  params?: Record<string, unknown>
): Promise<AdminActionResult> {
  // This would typically update an admin_notes or tenant_flags table
  // For now, just return success (placeholder)
  return {
    success: true,
    message: 'Status flagged (placeholder - implement admin notes table)',
    data: { tenant_id: tenantId, params },
  };
}
