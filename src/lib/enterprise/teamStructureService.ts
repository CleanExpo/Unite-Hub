/**
 * TeamStructureService
 * Phase 12 Week 3-4: Enterprise Team Structures
 *
 * Manages teams, business units, and hierarchical team membership
 */

import { getSupabaseServer } from '@/lib/supabase';
import { orgGraphService } from './orgGraphService';

// Types
export type TeamType = 'standard' | 'project' | 'department' | 'cross_functional';
export type TeamRole = 'team_lead' | 'team_admin' | 'team_member' | 'team_viewer' | 'team_contributor';
export type AccessLevel = 'read' | 'write' | 'admin';

export interface Team {
  id: string;
  org_id: string;
  bu_id?: string;
  name: string;
  description?: string;
  team_type: TeamType;
  lead_user_id?: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_name: TeamRole;
  email?: string;
  full_name?: string;
  is_active: boolean;
  joined_at: string;
}

export interface BusinessUnit {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  head_user_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  member_count: number;
  workspace_count: number;
}

export interface CreateTeamRequest {
  org_id: string;
  name: string;
  description?: string;
  team_type?: TeamType;
  bu_id?: string;
  lead_user_id: string;
}

export interface CreateBusinessUnitRequest {
  org_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  head_user_id?: string;
}

export class TeamStructureService {
  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('teams')
      .insert({
        org_id: request.org_id,
        bu_id: request.bu_id,
        name: request.name,
        description: request.description,
        team_type: request.team_type || 'standard',
        lead_user_id: request.lead_user_id,
        settings: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create team: ${error.message}`);
    }

    // Add lead as team_lead member
    await this.addTeamMember(data.id, request.lead_user_id, 'team_lead');

    // Log audit
    await orgGraphService.logAudit(
      request.org_id,
      null,
      request.lead_user_id,
      'settings_updated',
      { action: 'team_created', team_name: request.name }
    );

    return data;
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<TeamWithMembers | null> {
    const supabase = await getSupabaseServer();

    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          id,
          user_id,
          role_name,
          is_active,
          joined_at
        ),
        team_workspaces (count)
      `)
      .eq('id', teamId)
      .single();

    if (error || !team) {
      return null;
    }

    return {
      ...team,
      members: team.team_members || [],
      member_count: (team.team_members || []).filter((m: any) => m.is_active).length,
      workspace_count: Array.isArray(team.team_workspaces) ? team.team_workspaces.length : 0,
    };
  }

  /**
   * Get all teams for an organization
   */
  async getOrgTeams(orgId: string): Promise<TeamWithMembers[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (count),
        team_workspaces (count)
      `)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return (data || []).map(t => ({
      ...t,
      members: [],
      member_count: Array.isArray(t.team_members) ? t.team_members.length : 0,
      workspace_count: Array.isArray(t.team_workspaces) ? t.team_workspaces.length : 0,
    }));
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string, orgId?: string): Promise<Team[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_user_teams', {
      p_user_id: userId,
      p_org_id: orgId || null,
    });

    if (error) {
      throw new Error(`Failed to fetch user teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update team
   */
  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update team: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete (deactivate) team
   */
  async deleteTeam(teamId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', teamId);

    if (error) {
      throw new Error(`Failed to delete team: ${error.message}`);
    }
  }

  /**
   * Add member to team
   */
  async addTeamMember(
    teamId: string,
    userId: string,
    roleName: TeamRole = 'team_member'
  ): Promise<TeamMember> {
    const supabase = await getSupabaseServer();

    // Get role ID
    const { data: role } = await supabase
      .from('team_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role_id: role?.id,
        role_name: roleName,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add team member: ${error.message}`);
    }

    return data;
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user_profiles (full_name)
      `)
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('role_name');

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`);
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
    teamId: string,
    userId: string,
    newRole: TeamRole
  ): Promise<TeamMember> {
    const supabase = await getSupabaseServer();

    const { data: role } = await supabase
      .from('team_roles')
      .select('id')
      .eq('name', newRole)
      .single();

    const { data, error } = await supabase
      .from('team_members')
      .update({
        role_id: role?.id,
        role_name: newRole,
      })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('team_members')
      .update({ is_active: false })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  }

  /**
   * Grant team access to workspace
   */
  async grantWorkspaceAccess(
    teamId: string,
    workspaceId: string,
    accessLevel: AccessLevel = 'read'
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('team_workspaces')
      .upsert({
        team_id: teamId,
        workspace_id: workspaceId,
        access_level: accessLevel,
      });

    if (error) {
      throw new Error(`Failed to grant workspace access: ${error.message}`);
    }
  }

  /**
   * Get team's workspace access
   */
  async getTeamWorkspaces(teamId: string): Promise<{ workspace_id: string; access_level: AccessLevel }[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('team_workspaces')
      .select('workspace_id, access_level')
      .eq('team_id', teamId);

    if (error) {
      throw new Error(`Failed to fetch team workspaces: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================================================
  // Business Unit Methods
  // ==========================================================================

  /**
   * Create business unit
   */
  async createBusinessUnit(request: CreateBusinessUnitRequest): Promise<BusinessUnit> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('business_units')
      .insert({
        org_id: request.org_id,
        name: request.name,
        description: request.description,
        parent_id: request.parent_id,
        head_user_id: request.head_user_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create business unit: ${error.message}`);
    }

    return data;
  }

  /**
   * Get business units for org
   */
  async getOrgBusinessUnits(orgId: string): Promise<BusinessUnit[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('business_units')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch business units: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get BU hierarchy
   */
  async getBusinessUnitHierarchy(buId: string): Promise<BusinessUnit[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_bu_hierarchy', {
      p_bu_id: buId,
    });

    if (error) {
      throw new Error(`Failed to fetch BU hierarchy: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign workspace to business unit
   */
  async assignWorkspaceToBU(
    buId: string,
    workspaceId: string,
    isPrimary: boolean = false
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('bu_workspaces')
      .upsert({
        bu_id: buId,
        workspace_id: workspaceId,
        is_primary: isPrimary,
      });

    if (error) {
      throw new Error(`Failed to assign workspace to BU: ${error.message}`);
    }
  }

  /**
   * Check if user is team lead
   */
  async isTeamLead(userId: string, teamId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('teams')
      .select('lead_user_id')
      .eq('id', teamId)
      .single();

    return data?.lead_user_id === userId;
  }

  /**
   * Check if user is team member
   */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase.rpc('is_team_member', {
      p_user_id: userId,
      p_team_id: teamId,
    });

    return data as boolean;
  }
}

// Export singleton
export const teamStructureService = new TeamStructureService();
