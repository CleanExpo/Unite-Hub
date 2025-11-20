/**
 * Operator Role Service - Phase 10 Week 1-2
 *
 * Manages operator roles, permissions, and approval workflows.
 */

import { getSupabaseServer } from "@/lib/supabase";

// =============================================================
// Types
// =============================================================

export type OperatorRole = "OWNER" | "MANAGER" | "ANALYST";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AutonomyDomain = "SEO" | "CONTENT" | "ADS" | "CRO";

export interface OperatorProfile {
  id: string;
  user_id: string;
  organization_id: string;
  role: OperatorRole;

  // Permissions
  can_approve_low: boolean;
  can_approve_medium: boolean;
  can_approve_high: boolean;
  can_execute: boolean;
  can_rollback: boolean;
  can_configure_scopes: boolean;
  can_manage_operators: boolean;

  // Domain access
  allowed_domains: AutonomyDomain[];

  // Notifications
  notify_on_proposal: boolean;
  notify_on_approval_needed: boolean;
  notify_on_execution: boolean;
  notify_on_rollback: boolean;
  notify_email: boolean;
  notify_in_app: boolean;

  // Limits
  daily_approval_limit: number;
  approvals_today: number;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOperatorRequest {
  user_id: string;
  organization_id: string;
  role: OperatorRole;
  allowed_domains?: AutonomyDomain[];
  custom_permissions?: Partial<OperatorProfile>;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

// =============================================================
// Default Permissions by Role
// =============================================================

const DEFAULT_PERMISSIONS: Record<OperatorRole, Partial<OperatorProfile>> = {
  OWNER: {
    can_approve_low: true,
    can_approve_medium: true,
    can_approve_high: true,
    can_execute: true,
    can_rollback: true,
    can_configure_scopes: true,
    can_manage_operators: true,
    daily_approval_limit: 100,
  },
  MANAGER: {
    can_approve_low: true,
    can_approve_medium: true,
    can_approve_high: true,
    can_execute: true,
    can_rollback: true,
    can_configure_scopes: false,
    can_manage_operators: true,
    daily_approval_limit: 50,
  },
  ANALYST: {
    can_approve_low: true,
    can_approve_medium: false,
    can_approve_high: false,
    can_execute: false,
    can_rollback: false,
    can_configure_scopes: false,
    can_manage_operators: false,
    daily_approval_limit: 20,
  },
};

// =============================================================
// Operator Role Service
// =============================================================

export class OperatorRoleService {
  /**
   * Create a new operator profile
   */
  async createOperator(request: CreateOperatorRequest): Promise<OperatorProfile> {
    const supabase = await getSupabaseServer();

    const defaultPerms = DEFAULT_PERMISSIONS[request.role];
    const customPerms = request.custom_permissions || {};

    const { data, error } = await supabase
      .from("operator_profiles")
      .insert({
        user_id: request.user_id,
        organization_id: request.organization_id,
        role: request.role,
        allowed_domains: request.allowed_domains || ["SEO", "CONTENT", "ADS", "CRO"],
        ...defaultPerms,
        ...customPerms,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create operator: ${error.message}`);
    }

    return data;
  }

  /**
   * Get operator profile by user and org
   */
  async getOperator(userId: string, organizationId: string): Promise<OperatorProfile | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all operators for an organization
   */
  async getOrganizationOperators(organizationId: string): Promise<OperatorProfile[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("role", { ascending: true });

    if (error) return [];
    return data;
  }

  /**
   * Update operator profile
   */
  async updateOperator(
    operatorId: string,
    updates: Partial<OperatorProfile>
  ): Promise<OperatorProfile> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("operator_profiles")
      .update(updates)
      .eq("id", operatorId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update operator: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if operator can approve a proposal
   */
  async canApproveProposal(
    userId: string,
    organizationId: string,
    riskLevel: RiskLevel,
    domain: AutonomyDomain
  ): Promise<PermissionCheck> {
    const operator = await this.getOperator(userId, organizationId);

    if (!operator) {
      return { allowed: false, reason: "Operator profile not found" };
    }

    if (!operator.is_active) {
      return { allowed: false, reason: "Operator profile is inactive" };
    }

    // Check domain access
    if (!operator.allowed_domains.includes(domain)) {
      return { allowed: false, reason: `No access to ${domain} domain` };
    }

    // Check risk level permission
    switch (riskLevel) {
      case "LOW":
        if (!operator.can_approve_low) {
          return { allowed: false, reason: "Cannot approve LOW risk proposals" };
        }
        break;
      case "MEDIUM":
        if (!operator.can_approve_medium) {
          return { allowed: false, reason: "Cannot approve MEDIUM risk proposals" };
        }
        break;
      case "HIGH":
        if (!operator.can_approve_high) {
          return { allowed: false, reason: "Cannot approve HIGH risk proposals" };
        }
        break;
    }

    // Check daily limit
    if (operator.approvals_today >= operator.daily_approval_limit) {
      return { allowed: false, reason: "Daily approval limit reached" };
    }

    return { allowed: true };
  }

  /**
   * Check if operator can execute proposals
   */
  async canExecute(userId: string, organizationId: string): Promise<PermissionCheck> {
    const operator = await this.getOperator(userId, organizationId);

    if (!operator) {
      return { allowed: false, reason: "Operator profile not found" };
    }

    if (!operator.is_active) {
      return { allowed: false, reason: "Operator profile is inactive" };
    }

    if (!operator.can_execute) {
      return { allowed: false, reason: "No execution permission" };
    }

    return { allowed: true };
  }

  /**
   * Check if operator can rollback
   */
  async canRollback(userId: string, organizationId: string): Promise<PermissionCheck> {
    const operator = await this.getOperator(userId, organizationId);

    if (!operator) {
      return { allowed: false, reason: "Operator profile not found" };
    }

    if (!operator.is_active) {
      return { allowed: false, reason: "Operator profile is inactive" };
    }

    if (!operator.can_rollback) {
      return { allowed: false, reason: "No rollback permission" };
    }

    return { allowed: true };
  }

  /**
   * Check if operator can manage other operators
   */
  async canManageOperators(userId: string, organizationId: string): Promise<PermissionCheck> {
    const operator = await this.getOperator(userId, organizationId);

    if (!operator) {
      return { allowed: false, reason: "Operator profile not found" };
    }

    if (!operator.can_manage_operators) {
      return { allowed: false, reason: "No operator management permission" };
    }

    return { allowed: true };
  }

  /**
   * Increment approval count for operator
   */
  async incrementApprovalCount(userId: string, organizationId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.rpc("increment_operator_approvals", {
      p_user_id: userId,
      p_org_id: organizationId,
    });

    // Fallback if RPC doesn't exist
    await supabase
      .from("operator_profiles")
      .update({ approvals_today: supabase.rpc("increment", { x: 1 }) })
      .eq("user_id", userId)
      .eq("organization_id", organizationId);
  }

  /**
   * Get operators who can approve a specific risk level
   */
  async getApproversForRisk(
    organizationId: string,
    riskLevel: RiskLevel,
    domain: AutonomyDomain
  ): Promise<OperatorProfile[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("operator_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .contains("allowed_domains", [domain]);

    // Add risk level filter
    switch (riskLevel) {
      case "LOW":
        query = query.eq("can_approve_low", true);
        break;
      case "MEDIUM":
        query = query.eq("can_approve_medium", true);
        break;
      case "HIGH":
        query = query.eq("can_approve_high", true);
        break;
    }

    const { data, error } = await query;

    if (error) return [];
    return data;
  }

  /**
   * Update operator role (with permission inheritance)
   */
  async updateRole(operatorId: string, newRole: OperatorRole): Promise<OperatorProfile> {
    const defaultPerms = DEFAULT_PERMISSIONS[newRole];

    return this.updateOperator(operatorId, {
      role: newRole,
      ...defaultPerms,
    });
  }

  /**
   * Deactivate operator
   */
  async deactivateOperator(operatorId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from("operator_profiles")
      .update({ is_active: false })
      .eq("id", operatorId);
  }

  /**
   * Get notification preferences for operators
   */
  async getNotificationRecipients(
    organizationId: string,
    notificationType: string
  ): Promise<OperatorProfile[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("operator_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    // Filter by notification preference
    switch (notificationType) {
      case "PROPOSAL_CREATED":
        query = query.eq("notify_on_proposal", true);
        break;
      case "APPROVAL_NEEDED":
        query = query.eq("notify_on_approval_needed", true);
        break;
      case "EXECUTION_COMPLETE":
      case "EXECUTION_FAILED":
        query = query.eq("notify_on_execution", true);
        break;
      case "ROLLBACK_REQUESTED":
        query = query.eq("notify_on_rollback", true);
        break;
    }

    const { data, error } = await query;

    if (error) return [];
    return data;
  }
}

export const operatorRoleService = new OperatorRoleService();
