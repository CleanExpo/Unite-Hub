/**
 * OrgPermissionService
 * Phase 12 Week 3-4: Enterprise Team Structures
 *
 * Handles org-level roles with inheritance rules
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type OrgRoleName = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_ANALYST' | 'ORG_MEMBER';

export interface OrgRole {
  id: string;
  name: OrgRoleName;
  description: string;
  permissions: string[];
  inherits_from?: string;
  priority: number;
}

export interface UserOrgRole {
  id: string;
  user_id: string;
  org_id: string;
  role_id: string;
  role_name: OrgRoleName;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface PermissionCheck {
  has_permission: boolean;
  source?: 'direct' | 'inherited' | 'team' | 'workspace';
  role?: OrgRoleName;
}

export class OrgPermissionService {
  /**
   * Get all available org roles
   */
  async getOrgRoles(): Promise<OrgRole[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('org_roles')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch org roles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign org role to user
   */
  async assignOrgRole(
    userId: string,
    orgId: string,
    roleName: OrgRoleName,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserOrgRole> {
    const supabase = await getSupabaseServer();

    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from('org_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError || !role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    const { data, error } = await supabase
      .from('user_org_roles')
      .insert({
        user_id: userId,
        org_id: orgId,
        role_id: role.id,
        granted_by: grantedBy,
        expires_at: expiresAt?.toISOString(),
      })
      .select(`
        *,
        org_roles (name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to assign org role: ${error.message}`);
    }

    return {
      ...data,
      role_name: (data.org_roles as any)?.name,
    };
  }

  /**
   * Remove org role from user
   */
  async removeOrgRole(userId: string, orgId: string, roleName: OrgRoleName): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get role ID
    const { data: role } = await supabase
      .from('org_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (!role) return;

    const { error } = await supabase
      .from('user_org_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('role_id', role.id);

    if (error) {
      throw new Error(`Failed to remove org role: ${error.message}`);
    }
  }

  /**
   * Get user's org roles
   */
  async getUserOrgRoles(userId: string, orgId: string): Promise<UserOrgRole[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('user_org_roles')
      .select(`
        *,
        org_roles (name, permissions, priority)
      `)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch user org roles: ${error.message}`);
    }

    return (data || []).map(r => ({
      ...r,
      role_name: (r.org_roles as any)?.name,
    }));
  }

  /**
   * Get effective permissions (with inheritance)
   */
  async getEffectivePermissions(userId: string, orgId: string): Promise<string[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase.rpc('get_effective_org_permissions', {
      p_user_id: userId,
      p_org_id: orgId,
    });

    if (error) {
      throw new Error(`Failed to get effective permissions: ${error.message}`);
    }

    return (data as string[]) || [];
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    orgId: string,
    permission: string
  ): Promise<PermissionCheck> {
    const permissions = await this.getEffectivePermissions(userId, orgId);

    // Check for wildcard
    if (permissions.includes('*')) {
      return {
        has_permission: true,
        source: 'direct',
      };
    }

    // Check direct permission
    if (permissions.includes(permission)) {
      return {
        has_permission: true,
        source: 'direct',
      };
    }

    return { has_permission: false };
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    orgId: string,
    permissions: string[]
  ): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(userId, orgId);

    if (effectivePermissions.includes('*')) {
      return true;
    }

    return permissions.some(p => effectivePermissions.includes(p));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    userId: string,
    orgId: string,
    permissions: string[]
  ): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(userId, orgId);

    if (effectivePermissions.includes('*')) {
      return true;
    }

    return permissions.every(p => effectivePermissions.includes(p));
  }

  /**
   * Get highest priority role for user in org
   */
  async getHighestRole(userId: string, orgId: string): Promise<OrgRoleName | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('user_org_roles')
      .select(`
        org_roles (name, priority)
      `)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('org_roles(priority)', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return (data.org_roles as any)?.name as OrgRoleName;
  }

  /**
   * Check if user can manage another user's role
   */
  async canManageRole(
    actorId: string,
    targetId: string,
    orgId: string,
    targetRole: OrgRoleName
  ): Promise<boolean> {
    // Cannot manage own role
    if (actorId === targetId) {
      return false;
    }

    const actorRole = await this.getHighestRole(actorId, orgId);
    if (!actorRole) {
      return false;
    }

    const rolePriority: Record<OrgRoleName, number> = {
      ORG_OWNER: 100,
      ORG_ADMIN: 80,
      ORG_ANALYST: 40,
      ORG_MEMBER: 20,
    };

    // Actor must have higher priority than target role
    return rolePriority[actorRole] > rolePriority[targetRole];
  }

  /**
   * Get users with specific org role
   */
  async getUsersWithRole(orgId: string, roleName: OrgRoleName): Promise<string[]> {
    const supabase = await getSupabaseServer();

    const { data: role } = await supabase
      .from('org_roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (!role) return [];

    const { data, error } = await supabase
      .from('user_org_roles')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('role_id', role.id)
      .eq('is_active', true);

    if (error) {
      return [];
    }

    return (data || []).map(r => r.user_id);
  }

  /**
   * Check if user is org owner
   */
  async isOrgOwner(userId: string, orgId: string): Promise<boolean> {
    const role = await this.getHighestRole(userId, orgId);
    return role === 'ORG_OWNER';
  }

  /**
   * Check if user is org admin or higher
   */
  async isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
    const role = await this.getHighestRole(userId, orgId);
    return role === 'ORG_OWNER' || role === 'ORG_ADMIN';
  }
}

// Export singleton
export const orgPermissionService = new OrgPermissionService();
