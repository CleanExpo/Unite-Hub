/**
 * WorkspaceService
 * Phase 12 Week 1-2: Enterprise Mode Foundation
 *
 * Manages workspace creation, deletion, switching, and plan assignment
 */

import { getSupabaseServer } from '@/lib/supabase';
import { orgGraphService, WorkspaceRole, PlanType } from './orgGraphService';

// Types
export interface Workspace {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithSettings extends Workspace {
  settings?: WorkspaceSettings;
  member_count: number;
}

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  default_domain?: string;
  timezone: string;
  notification_preferences: Record<string, unknown>;
  integration_config: Record<string, unknown>;
  ai_preferences: Record<string, unknown>;
  branding: Record<string, unknown>;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role_name: WorkspaceRole;
  email?: string;
  full_name?: string;
  is_active: boolean;
  joined_at: string | null;
  invited_at: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  org_id: string;
  owner_user_id: string;
  settings?: Partial<WorkspaceSettings>;
}

export interface AddMemberRequest {
  workspace_id: string;
  user_id: string;
  role_name: WorkspaceRole;
  invited_by: string;
}

export interface UserWorkspace {
  workspace_id: string;
  workspace_name: string;
  org_id: string;
  org_name: string;
  role_name: WorkspaceRole;
  is_active: boolean;
}

export class WorkspaceService {
  /**
   * Create a new workspace
   */
  async createWorkspace(request: CreateWorkspaceRequest): Promise<WorkspaceWithSettings> {
    const supabase = await getSupabaseServer();

    // Check if org can create more workspaces
    const { allowed, reason } = await orgGraphService.canCreateWorkspace(request.org_id);
    if (!allowed) {
      throw new Error(reason);
    }

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: request.name,
        org_id: request.org_id,
      })
      .select()
      .single();

    if (wsError) {
      throw new Error(`Failed to create workspace: ${wsError.message}`);
    }

    // Create default settings
    const { data: settings, error: settingsError } = await supabase
      .from('workspace_settings')
      .insert({
        workspace_id: workspace.id,
        timezone: request.settings?.timezone || 'UTC',
        notification_preferences: request.settings?.notification_preferences || {},
        integration_config: request.settings?.integration_config || {},
        ai_preferences: request.settings?.ai_preferences || {},
        branding: request.settings?.branding || {},
      })
      .select()
      .single();

    if (settingsError) {
      console.error('Failed to create workspace settings:', settingsError);
    }

    // Add owner as first member
    await this.addMember({
      workspace_id: workspace.id,
      user_id: request.owner_user_id,
      role_name: 'owner',
      invited_by: request.owner_user_id,
    });

    // Log audit
    await orgGraphService.logAudit(
      request.org_id,
      workspace.id,
      request.owner_user_id,
      'workspace_created',
      { name: request.name }
    );

    return {
      ...workspace,
      settings: settings || undefined,
      member_count: 1,
    };
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<WorkspaceWithSettings | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_settings (*),
        workspace_members (count)
      `)
      .eq('id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      settings: Array.isArray(data.workspace_settings)
        ? data.workspace_settings[0]
        : data.workspace_settings,
      member_count: Array.isArray(data.workspace_members)
        ? data.workspace_members.length
        : 0,
    };
  }

  /**
   * Get all workspaces for an organization
   */
  async getOrgWorkspaces(orgId: string): Promise<WorkspaceWithSettings[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_settings (*),
        workspace_members (count)
      `)
      .eq('org_id', orgId)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }

    return (data || []).map(w => ({
      ...w,
      settings: Array.isArray(w.workspace_settings)
        ? w.workspace_settings[0]
        : w.workspace_settings,
      member_count: Array.isArray(w.workspace_members)
        ? w.workspace_members.length
        : 0,
    }));
  }

  /**
   * Get user's accessible workspaces
   */
  async getUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_user_workspaces', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to fetch user workspaces: ${error.message}`);
    }

    return data as UserWorkspace[];
  }

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Workspace>
  ): Promise<Workspace> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Update workspace settings
   */
  async updateWorkspaceSettings(
    workspaceId: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<WorkspaceSettings> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspace_settings')
      .update(settings)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workspace settings: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete (archive) workspace
   */
  async deleteWorkspace(
    workspaceId: string,
    deletedBy: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get workspace for audit
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // For now, hard delete. In production, consider soft delete/archive
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }

    // Log audit
    await orgGraphService.logAudit(
      workspace.org_id,
      workspaceId,
      deletedBy,
      'workspace_deleted',
      { name: workspace.name }
    );
  }

  /**
   * Add member to workspace
   */
  async addMember(request: AddMemberRequest): Promise<WorkspaceMember> {
    const supabase = await getSupabaseServer();

    // Check if workspace can add more members
    const { allowed, reason } = await orgGraphService.canAddMember(request.workspace_id);
    if (!allowed) {
      throw new Error(reason);
    }

    // Get role ID
    const { data: role } = await supabase
      .from('workspace_roles')
      .select('id')
      .eq('name', request.role_name)
      .single();

    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: request.workspace_id,
        user_id: request.user_id,
        role_id: role?.id,
        role_name: request.role_name,
        invited_by: request.invited_by,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }

    // Get workspace for audit
    const workspace = await this.getWorkspace(request.workspace_id);
    if (workspace) {
      await orgGraphService.logAudit(
        workspace.org_id,
        request.workspace_id,
        request.user_id,
        'member_added',
        { role: request.role_name }
      );
    }

    return data as WorkspaceMember;
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        *,
        user_profiles (full_name)
      `)
      .eq('workspace_id', workspaceId)
      .order('role_name');

    if (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    return (data || []).map(m => ({
      ...m,
      full_name: (m.user_profiles as any)?.full_name,
    }));
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: WorkspaceRole,
    updatedBy: string
  ): Promise<WorkspaceMember> {
    const supabase = await getSupabaseServer();

    // Get role ID
    const { data: role } = await supabase
      .from('workspace_roles')
      .select('id')
      .eq('name', newRole)
      .single();

    const { data, error } = await supabase
      .from('workspace_members')
      .update({
        role_id: role?.id,
        role_name: newRole,
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    // Get workspace for audit
    const workspace = await this.getWorkspace(workspaceId);
    if (workspace) {
      await orgGraphService.logAudit(
        workspace.org_id,
        workspaceId,
        userId,
        'role_changed',
        { new_role: newRole, updated_by: updatedBy }
      );
    }

    return data as WorkspaceMember;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Deactivate instead of delete to preserve audit trail
    const { error } = await supabase
      .from('workspace_members')
      .update({ is_active: false })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }

    // Get workspace for audit
    const workspace = await this.getWorkspace(workspaceId);
    if (workspace) {
      await orgGraphService.logAudit(
        workspace.org_id,
        workspaceId,
        userId,
        'member_removed',
        { removed_by: removedBy }
      );
    }
  }

  /**
   * Switch user's active workspace (client-side operation, just validates)
   */
  async validateWorkspaceAccess(
    userId: string,
    workspaceId: string
  ): Promise<{ valid: boolean; role?: WorkspaceRole; reason?: string }> {
    const role = await orgGraphService.getUserWorkspaceRole(userId, workspaceId);

    if (!role) {
      return {
        valid: false,
        reason: 'User is not a member of this workspace',
      };
    }

    return {
      valid: true,
      role,
    };
  }

  /**
   * Get workspace with isolation context for services
   */
  async getWorkspaceContext(workspaceId: string): Promise<{
    workspace: Workspace;
    org_id: string;
    settings: WorkspaceSettings | undefined;
    plan_type: PlanType;
  } | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_settings (*),
        organizations!inner (
          id,
          org_settings (plan_type)
        )
      `)
      .eq('id', workspaceId)
      .single();

    if (error || !data) {
      return null;
    }

    const orgSettings = Array.isArray((data.organizations as any).org_settings)
      ? (data.organizations as any).org_settings[0]
      : (data.organizations as any).org_settings;

    return {
      workspace: {
        id: data.id,
        name: data.name,
        org_id: data.org_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      org_id: data.org_id,
      settings: Array.isArray(data.workspace_settings)
        ? data.workspace_settings[0]
        : data.workspace_settings,
      plan_type: orgSettings?.plan_type || 'starter',
    };
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();
