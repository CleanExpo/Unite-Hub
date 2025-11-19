/**
 * Trust Mode Service - Phase 9
 *
 * Manages Trusted Mode onboarding, verification, and status.
 */

import { getSupabaseServer } from "@/lib/supabase";
import {
  TrustedModeStatus,
  TrustedModeRequest,
  IdentityVerificationResult,
  OwnershipVerificationResult,
  AutonomyScopes,
  TrustStatusResponse,
  SEOScopeConfig,
  ContentScopeConfig,
  AdsScopeConfig,
  CROScopeConfig,
  DomainScope,
  RiskLevel,
} from "@/lib/validation/trustSchemas";

export class TrustModeService {
  /**
   * Initialize Trusted Mode onboarding for a client
   */
  async initializeTrustedMode(
    clientId: string,
    organizationId: string,
    initiatedBy: string,
    options: {
      restore_email: string;
      emergency_phone?: string;
      nightly_backup_enabled?: boolean;
    }
  ): Promise<TrustedModeRequest> {
    const supabase = await getSupabaseServer();

    // Check if request already exists
    const { data: existing } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (existing) {
      // If revoked or rejected, allow restart
      if (existing.status === "REVOKED" || existing.status === "REJECTED") {
        const { data, error } = await supabase
          .from("trusted_mode_requests")
          .update({
            status: "PENDING_IDENTITY",
            restore_email: options.restore_email,
            emergency_phone: options.emergency_phone || null,
            nightly_backup_enabled: options.nightly_backup_enabled ?? true,
            initiated_by: initiatedBy,
            rejected_reason: null,
            revoked_reason: null,
            revoked_at: null,
            identity_verification_result: {},
            ownership_verification_result: {},
            signature_document_id: null,
            signed_at: null,
          })
          .eq("client_id", clientId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      return existing;
    }

    // Create new request
    const { data, error } = await supabase
      .from("trusted_mode_requests")
      .insert({
        client_id: clientId,
        organization_id: organizationId,
        status: "PENDING_IDENTITY",
        restore_email: options.restore_email,
        emergency_phone: options.emergency_phone || null,
        nightly_backup_enabled: options.nightly_backup_enabled ?? true,
        initiated_by: initiatedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await this.logAuditEvent(clientId, organizationId, {
      action_type: "TRUSTED_MODE_INITIATED",
      source: "TrustModeService",
      actor_type: "HUMAN",
      actor_id: initiatedBy,
    });

    return data;
  }

  /**
   * Verify client identity (ABN/ACN lookup)
   */
  async verifyIdentity(
    clientId: string,
    result: IdentityVerificationResult
  ): Promise<TrustedModeRequest> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !request) {
      throw new Error("Trusted mode request not found");
    }

    if (request.status !== "PENDING_IDENTITY") {
      throw new Error(`Invalid status for identity verification: ${request.status}`);
    }

    const newStatus = result.verified ? "PENDING_OWNERSHIP" : "REJECTED";

    const { data, error } = await supabase
      .from("trusted_mode_requests")
      .update({
        identity_verification_result: result,
        status: newStatus,
        rejected_reason: result.verified ? null : "Identity verification failed",
      })
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await this.logAuditEvent(clientId, request.organization_id, {
      action_type: result.verified ? "IDENTITY_VERIFIED" : "IDENTITY_REJECTED",
      source: "TrustModeService",
      actor_type: "SYSTEM",
      details: result,
    });

    return data;
  }

  /**
   * Verify website ownership (GSC, DNS, HTML)
   */
  async verifyOwnership(
    clientId: string,
    result: OwnershipVerificationResult
  ): Promise<TrustedModeRequest> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !request) {
      throw new Error("Trusted mode request not found");
    }

    if (request.status !== "PENDING_OWNERSHIP") {
      throw new Error(`Invalid status for ownership verification: ${request.status}`);
    }

    const newStatus = result.verified ? "PENDING_SIGNATURE" : "REJECTED";

    const { data, error } = await supabase
      .from("trusted_mode_requests")
      .update({
        ownership_verification_result: result,
        status: newStatus,
        rejected_reason: result.verified ? null : "Ownership verification failed",
      })
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await this.logAuditEvent(clientId, request.organization_id, {
      action_type: result.verified ? "OWNERSHIP_VERIFIED" : "OWNERSHIP_REJECTED",
      source: "TrustModeService",
      actor_type: "SYSTEM",
      details: result,
    });

    return data;
  }

  /**
   * Record signature completion from DocuSign/HelloSign
   */
  async recordSignature(
    clientId: string,
    signatureData: {
      document_id: string;
      provider: "docusign" | "hellosign" | "manual";
      signer_email: string;
      signer_ip?: string;
    }
  ): Promise<TrustedModeRequest> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !request) {
      throw new Error("Trusted mode request not found");
    }

    if (request.status !== "PENDING_SIGNATURE") {
      throw new Error(`Invalid status for signature: ${request.status}`);
    }

    const { data, error } = await supabase
      .from("trusted_mode_requests")
      .update({
        signature_document_id: signatureData.document_id,
        signature_provider: signatureData.provider,
        signer_email: signatureData.signer_email,
        signer_ip: signatureData.signer_ip || null,
        signed_at: new Date().toISOString(),
        status: "ACTIVE",
      })
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    // Create default autonomy scopes
    await this.createDefaultScopes(clientId);

    // Log to audit
    await this.logAuditEvent(clientId, request.organization_id, {
      action_type: "TRUSTED_MODE_ACTIVATED",
      source: "TrustModeService",
      actor_type: "HUMAN",
      details: {
        signature_provider: signatureData.provider,
        signer_email: signatureData.signer_email,
      },
    });

    return data;
  }

  /**
   * Create default autonomy scopes for a client
   */
  async createDefaultScopes(clientId: string): Promise<AutonomyScopes> {
    const supabase = await getSupabaseServer();

    // Check if scopes already exist
    const { data: existing } = await supabase
      .from("autonomy_scopes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from("autonomy_scopes")
      .insert({
        client_id: clientId,
        // Defaults are set in schema
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Configure autonomy scopes for a client
   */
  async configureScopes(
    clientId: string,
    config: {
      seo_scope?: Partial<SEOScopeConfig>;
      content_scope?: Partial<ContentScopeConfig>;
      ads_scope?: Partial<AdsScopeConfig>;
      cro_scope?: Partial<CROScopeConfig>;
      max_daily_actions?: number;
      max_risk_level_allowed?: RiskLevel;
      execution_window_start?: string;
      execution_window_end?: string;
      execution_timezone?: string;
    }
  ): Promise<AutonomyScopes> {
    const supabase = await getSupabaseServer();

    // Get existing scopes
    const { data: existing, error: fetchError } = await supabase
      .from("autonomy_scopes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError) {
      // Create new scopes
      return this.createDefaultScopes(clientId);
    }

    // Merge configurations
    const updateData: Record<string, any> = {};

    if (config.seo_scope) {
      updateData.seo_scope_json = {
        ...existing.seo_scope_json,
        ...config.seo_scope,
      };
    }

    if (config.content_scope) {
      updateData.content_scope_json = {
        ...existing.content_scope_json,
        ...config.content_scope,
      };
    }

    if (config.ads_scope) {
      updateData.ads_scope_json = {
        ...existing.ads_scope_json,
        ...config.ads_scope,
      };
    }

    if (config.cro_scope) {
      updateData.cro_scope_json = {
        ...existing.cro_scope_json,
        ...config.cro_scope,
      };
    }

    if (config.max_daily_actions !== undefined) {
      updateData.max_daily_actions = config.max_daily_actions;
    }

    if (config.max_risk_level_allowed) {
      updateData.max_risk_level_allowed = config.max_risk_level_allowed;
    }

    if (config.execution_window_start) {
      updateData.execution_window_start = config.execution_window_start;
    }

    if (config.execution_window_end) {
      updateData.execution_window_end = config.execution_window_end;
    }

    if (config.execution_timezone) {
      updateData.execution_timezone = config.execution_timezone;
    }

    const { data, error } = await supabase
      .from("autonomy_scopes")
      .update(updateData)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get Trusted Mode status for a client
   */
  async getStatus(clientId: string): Promise<TrustStatusResponse> {
    const supabase = await getSupabaseServer();

    // Get trusted mode request
    const { data: request } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    // Get autonomy scopes
    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    // Get pending proposals count
    const { count: pendingCount } = await supabase
      .from("autonomy_proposals")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "PENDING");

    // Get today's executions count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: executedToday } = await supabase
      .from("autonomy_executions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("executed_at", today.toISOString());

    // Get last execution
    const { data: lastExecution } = await supabase
      .from("autonomy_executions")
      .select("executed_at")
      .eq("client_id", clientId)
      .order("executed_at", { ascending: false })
      .limit(1)
      .single();

    // Determine enabled domains
    const enabledDomains: DomainScope[] = [];
    if (scopes) {
      if (scopes.seo_scope_json?.enabled) enabledDomains.push("SEO");
      if (scopes.content_scope_json?.enabled) enabledDomains.push("CONTENT");
      if (scopes.ads_scope_json?.enabled) enabledDomains.push("ADS");
      if (scopes.cro_scope_json?.enabled) enabledDomains.push("CRO");
    }

    return {
      client_id: clientId,
      trusted_mode_status: request?.status || "PENDING_IDENTITY",
      identity_verified: request?.identity_verification_result?.verified || false,
      ownership_verified: request?.ownership_verification_result?.verified || false,
      signature_complete: !!request?.signed_at,
      scopes_configured: enabledDomains.length > 0,
      enabled_domains: enabledDomains,
      max_risk_level: scopes?.max_risk_level_allowed || "LOW",
      pending_proposals: pendingCount || 0,
      executed_today: executedToday || 0,
      last_execution: lastExecution?.executed_at || undefined,
    };
  }

  /**
   * Revoke Trusted Mode for a client
   */
  async revokeTrustedMode(
    clientId: string,
    revokedBy: string,
    reason: string
  ): Promise<TrustedModeRequest> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !request) {
      throw new Error("Trusted mode request not found");
    }

    const { data, error } = await supabase
      .from("trusted_mode_requests")
      .update({
        status: "REVOKED",
        revoked_reason: reason,
        revoked_at: new Date().toISOString(),
      })
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw error;

    // Log to audit
    await this.logAuditEvent(clientId, request.organization_id, {
      action_type: "TRUSTED_MODE_REVOKED",
      source: "TrustModeService",
      actor_type: "HUMAN",
      actor_id: revokedBy,
      details: { reason },
    });

    return data;
  }

  /**
   * Check if a change is allowed by current scopes
   */
  async isChangeAllowed(
    clientId: string,
    domainScope: DomainScope,
    changeType: string,
    riskLevel: RiskLevel
  ): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await getSupabaseServer();

    // Check trusted mode status
    const { data: request } = await supabase
      .from("trusted_mode_requests")
      .select("status")
      .eq("client_id", clientId)
      .single();

    if (!request || request.status !== "ACTIVE") {
      return {
        allowed: false,
        reason: "Trusted Mode is not active for this client",
      };
    }

    // Get scopes
    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (!scopes) {
      return {
        allowed: false,
        reason: "Autonomy scopes not configured",
      };
    }

    // Check risk level
    const riskLevels = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    if (riskLevels[riskLevel] > riskLevels[scopes.max_risk_level_allowed]) {
      return {
        allowed: false,
        reason: `Risk level ${riskLevel} exceeds maximum allowed ${scopes.max_risk_level_allowed}`,
      };
    }

    // Check domain-specific scope
    let scopeConfig: any;
    switch (domainScope) {
      case "SEO":
        scopeConfig = scopes.seo_scope_json;
        break;
      case "CONTENT":
        scopeConfig = scopes.content_scope_json;
        break;
      case "ADS":
        scopeConfig = scopes.ads_scope_json;
        break;
      case "CRO":
        scopeConfig = scopes.cro_scope_json;
        break;
    }

    if (!scopeConfig?.enabled) {
      return {
        allowed: false,
        reason: `${domainScope} autonomy is not enabled`,
      };
    }

    // Check forbidden changes
    if (scopeConfig.forbidden_changes?.includes(changeType)) {
      return {
        allowed: false,
        reason: `Change type "${changeType}" is explicitly forbidden`,
      };
    }

    // Check allowed changes (if specified)
    if (
      scopeConfig.allowed_changes?.length > 0 &&
      !scopeConfig.allowed_changes.includes(changeType)
    ) {
      return {
        allowed: false,
        reason: `Change type "${changeType}" is not in allowed list`,
      };
    }

    return { allowed: true };
  }

  /**
   * Log an audit event
   */
  private async logAuditEvent(
    clientId: string,
    organizationId: string,
    event: {
      action_type: string;
      source: string;
      actor_type: "SYSTEM" | "HUMAN";
      actor_id?: string;
      domain_scope?: DomainScope;
      risk_level?: RiskLevel;
      approval_status?: string;
      proposal_id?: string;
      execution_id?: string;
      rollback_token_id?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("autonomy_audit_log").insert({
      client_id: clientId,
      organization_id: organizationId,
      ...event,
      timestamp_utc: new Date().toISOString(),
    });
  }
}

export const trustModeService = new TrustModeService();
