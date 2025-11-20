/**
 * OrgGraphService
 * Phase 12 Week 1-2: Enterprise Mode Foundation
 *
 * Models org → workspace → user relationships with RLS enforcement
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type PlanType = 'starter' | 'professional' | 'enterprise' | 'custom';
export type OrgRole = 'owner' | 'admin' | 'member';
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'operator';

export interface OrgNode {
  id: string;
  name: string;
  plan_type: PlanType;
  max_workspaces: number;
  workspace_count: number;
  created_at: string;
}

export interface WorkspaceNode {
  id: string;
  name: string;
  org_id: string;
  member_count: number;
  created_at: string;
}

export interface UserNode {
  id: string;
  email: string;
  full_name?: string;
  org_role: OrgRole;
  workspace_memberships: WorkspaceMembership[];
}

export interface WorkspaceMembership {
  workspace_id: string;
  workspace_name: string;
  role_name: WorkspaceRole;
  is_active: boolean;
  joined_at: string | null;
}

export interface OrgGraph {
  org: OrgNode;
  workspaces: WorkspaceNode[];
  users: UserNode[];
  edges: GraphEdge[];
}

export interface GraphEdge {
  source_type: 'org' | 'workspace' | 'user';
  source_id: string;
  target_type: 'org' | 'workspace' | 'user';
  target_id: string;
  relationship: string;
  metadata?: Record<string, unknown>;
}

export interface OrgSettings {
  id: string;
  org_id: string;
  plan_type: PlanType;
  max_workspaces: number;
  max_users_per_workspace: number;
  features: Record<string, boolean>;
  billing_email?: string;
  billing_cycle?: 'monthly' | 'annual';
  trial_ends_at?: string;
}

export class OrgGraphService {
  /**
   * Get complete org graph for an organization
   */
  async getOrgGraph(orgId: string): Promise<OrgGraph> {
    const supabase = await getSupabaseServer();

    // Get org with settings
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        created_at,
        org_settings (
          plan_type,
          max_workspaces
        )
      `)
      .eq('id', orgId)
      .single();

    if (orgError || !orgData) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    // Get workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from('workspaces')
      .select(`
        id,
        name,
        org_id,
        created_at,
        workspace_members (count)
      `)
      .eq('org_id', orgId);

    if (wsError) {
      throw new Error(`Failed to fetch workspaces: ${wsError.message}`);
    }

    // Get users in org
    const { data: orgMembers, error: memberError } = await supabase
      .from('user_organizations')
      .select(`
        user_id,
        role,
        users:auth.users (
          id,
          email
        ),
        user_profiles (
          full_name
        )
      `)
      .eq('org_id', orgId);

    if (memberError) {
      throw new Error(`Failed to fetch members: ${memberError.message}`);
    }

    // Get workspace memberships for each user
    const userIds = orgMembers?.map(m => m.user_id) || [];
    const { data: wsMemberships } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        workspace_id,
        role_name,
        is_active,
        joined_at,
        workspaces (name)
      `)
      .in('user_id', userIds)
      .eq('is_active', true);

    // Build org node
    const settings = Array.isArray(orgData.org_settings)
      ? orgData.org_settings[0]
      : orgData.org_settings;

    const orgNode: OrgNode = {
      id: orgData.id,
      name: orgData.name,
      plan_type: settings?.plan_type || 'starter',
      max_workspaces: settings?.max_workspaces || 1,
      workspace_count: workspaces?.length || 0,
      created_at: orgData.created_at,
    };

    // Build workspace nodes
    const workspaceNodes: WorkspaceNode[] = (workspaces || []).map(w => ({
      id: w.id,
      name: w.name,
      org_id: w.org_id,
      member_count: Array.isArray(w.workspace_members) ? w.workspace_members.length : 0,
      created_at: w.created_at,
    }));

    // Build user nodes with memberships
    const membershipMap = new Map<string, WorkspaceMembership[]>();
    for (const m of wsMemberships || []) {
      const memberships = membershipMap.get(m.user_id) || [];
      memberships.push({
        workspace_id: m.workspace_id,
        workspace_name: (m.workspaces as any)?.name || '',
        role_name: m.role_name as WorkspaceRole,
        is_active: m.is_active,
        joined_at: m.joined_at,
      });
      membershipMap.set(m.user_id, memberships);
    }

    const userNodes: UserNode[] = (orgMembers || []).map(m => ({
      id: m.user_id,
      email: (m.users as any)?.email || '',
      full_name: (m.user_profiles as any)?.full_name,
      org_role: m.role as OrgRole,
      workspace_memberships: membershipMap.get(m.user_id) || [],
    }));

    // Build edges
    const edges: GraphEdge[] = [];

    // Org → Workspace edges
    for (const ws of workspaceNodes) {
      edges.push({
        source_type: 'org',
        source_id: orgId,
        target_type: 'workspace',
        target_id: ws.id,
        relationship: 'contains',
      });
    }

    // User → Org edges
    for (const user of userNodes) {
      edges.push({
        source_type: 'user',
        source_id: user.id,
        target_type: 'org',
        target_id: orgId,
        relationship: 'member_of',
        metadata: { role: user.org_role },
      });

      // User → Workspace edges
      for (const membership of user.workspace_memberships) {
        edges.push({
          source_type: 'user',
          source_id: user.id,
          target_type: 'workspace',
          target_id: membership.workspace_id,
          relationship: 'member_of',
          metadata: { role: membership.role_name },
        });
      }
    }

    return {
      org: orgNode,
      workspaces: workspaceNodes,
      users: userNodes,
      edges,
    };
  }

  /**
   * Get org settings
   */
  async getOrgSettings(orgId: string): Promise<OrgSettings | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as OrgSettings;
  }

  /**
   * Initialize org settings (for new orgs)
   */
  async initializeOrgSettings(
    orgId: string,
    planType: PlanType = 'starter'
  ): Promise<OrgSettings> {
    const supabase = await getSupabaseServer();

    const planDefaults: Record<PlanType, { maxWorkspaces: number; maxUsers: number }> = {
      starter: { maxWorkspaces: 1, maxUsers: 5 },
      professional: { maxWorkspaces: 5, maxUsers: 20 },
      enterprise: { maxWorkspaces: 50, maxUsers: 100 },
      custom: { maxWorkspaces: 999, maxUsers: 999 },
    };

    const defaults = planDefaults[planType];

    const { data, error } = await supabase
      .from('org_settings')
      .insert({
        org_id: orgId,
        plan_type: planType,
        max_workspaces: defaults.maxWorkspaces,
        max_users_per_workspace: defaults.maxUsers,
        features: this.getDefaultFeatures(planType),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to initialize org settings: ${error.message}`);
    }

    return data as OrgSettings;
  }

  /**
   * Update org plan
   */
  async updateOrgPlan(orgId: string, planType: PlanType): Promise<OrgSettings> {
    const supabase = await getSupabaseServer();

    const planDefaults: Record<PlanType, { maxWorkspaces: number; maxUsers: number }> = {
      starter: { maxWorkspaces: 1, maxUsers: 5 },
      professional: { maxWorkspaces: 5, maxUsers: 20 },
      enterprise: { maxWorkspaces: 50, maxUsers: 100 },
      custom: { maxWorkspaces: 999, maxUsers: 999 },
    };

    const defaults = planDefaults[planType];

    const { data, error } = await supabase
      .from('org_settings')
      .update({
        plan_type: planType,
        max_workspaces: defaults.maxWorkspaces,
        max_users_per_workspace: defaults.maxUsers,
        features: this.getDefaultFeatures(planType),
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update org plan: ${error.message}`);
    }

    // Log audit
    await this.logAudit(orgId, null, null, 'plan_changed', {
      new_plan: planType,
    });

    return data as OrgSettings;
  }

  /**
   * Check if org can create more workspaces
   */
  async canCreateWorkspace(orgId: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await getSupabaseServer();

    const settings = await this.getOrgSettings(orgId);
    if (!settings) {
      return { allowed: false, reason: 'Organization settings not found' };
    }

    const { count, error } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (error) {
      return { allowed: false, reason: error.message };
    }

    const currentCount = count || 0;
    if (currentCount >= settings.max_workspaces) {
      return {
        allowed: false,
        reason: `Maximum workspace limit (${settings.max_workspaces}) reached for ${settings.plan_type} plan`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if workspace can add more members
   */
  async canAddMember(
    workspaceId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await getSupabaseServer();

    // Get workspace's org
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('org_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { allowed: false, reason: 'Workspace not found' };
    }

    const settings = await this.getOrgSettings(workspace.org_id);
    if (!settings) {
      return { allowed: false, reason: 'Organization settings not found' };
    }

    const { count, error } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (error) {
      return { allowed: false, reason: error.message };
    }

    const currentCount = count || 0;
    if (currentCount >= settings.max_users_per_workspace) {
      return {
        allowed: false,
        reason: `Maximum member limit (${settings.max_users_per_workspace}) reached`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get user's role in workspace
   */
  async getUserWorkspaceRole(
    userId: string,
    workspaceId: string
  ): Promise<WorkspaceRole | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role_name')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role_name as WorkspaceRole;
  }

  /**
   * Check user permission in workspace
   */
  async checkPermission(
    userId: string,
    workspaceId: string,
    permission: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('check_workspace_permission', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_permission: permission,
    });

    if (error) {
      console.error('Permission check failed:', error);
      return false;
    }

    return data as boolean;
  }

  /**
   * Log audit event
   */
  async logAudit(
    orgId: string,
    workspaceId: string | null,
    userId: string | null,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('org_graph_audit').insert({
      org_id: orgId,
      workspace_id: workspaceId,
      user_id: userId,
      action,
      details,
    });
  }

  /**
   * Get default features for plan
   */
  private getDefaultFeatures(planType: PlanType): Record<string, boolean> {
    const features: Record<PlanType, Record<string, boolean>> = {
      starter: {
        basic_analytics: true,
        email_integration: true,
        ai_scoring: true,
        drip_campaigns: false,
        advanced_analytics: false,
        api_access: false,
        custom_branding: false,
        sso: false,
      },
      professional: {
        basic_analytics: true,
        email_integration: true,
        ai_scoring: true,
        drip_campaigns: true,
        advanced_analytics: true,
        api_access: true,
        custom_branding: false,
        sso: false,
      },
      enterprise: {
        basic_analytics: true,
        email_integration: true,
        ai_scoring: true,
        drip_campaigns: true,
        advanced_analytics: true,
        api_access: true,
        custom_branding: true,
        sso: true,
      },
      custom: {
        basic_analytics: true,
        email_integration: true,
        ai_scoring: true,
        drip_campaigns: true,
        advanced_analytics: true,
        api_access: true,
        custom_branding: true,
        sso: true,
      },
    };

    return features[planType];
  }
}

// Export singleton instance
export const orgGraphService = new OrgGraphService();
