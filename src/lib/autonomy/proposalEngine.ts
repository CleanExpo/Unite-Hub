/**
 * Proposal Engine - Phase 9 Week 7-8
 *
 * Generates and manages autonomy proposals from various triggers.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";
import {
  DomainScope,
  RiskLevel,
  ProposalStatus,
  AutonomyProposal,
} from "@/lib/validation/trustSchemas";

// =============================================================
// Types
// =============================================================

export interface ProposalTrigger {
  type: "DELTA" | "SEO_EVENT" | "BACKLINK_CHANGE" | "STRATEGY" | "ANOMALY" | "MANUAL";
  source_id?: string;
  data: Record<string, any>;
}

export interface CreateProposalOptions {
  client_id: string;
  organization_id: string;
  trigger: ProposalTrigger;
  domain_scope: DomainScope;
  change_type: string;
  title: string;
  description?: string;
  proposed_diff: Record<string, any>;
  target_url?: string;
  target_element?: string;
  created_by?: string;
}

export interface ProposalValidationResult {
  valid: boolean;
  errors: string[];
  risk_level: RiskLevel;
  requires_approval: boolean;
  auto_approve_eligible: boolean;
}

// =============================================================
// Proposal Engine
// =============================================================

export class ProposalEngine {
  private trustService: TrustModeService;

  constructor() {
    this.trustService = new TrustModeService();
  }

  /**
   * Create a new autonomy proposal
   */
  async createProposal(options: CreateProposalOptions): Promise<AutonomyProposal> {
    // Validate against trust scopes
    const validation = await this.validateProposal(options);

    if (!validation.valid) {
      throw new Error(`Proposal validation failed: ${validation.errors.join(", ")}`);
    }

    const supabase = await getSupabaseServer();

    // Determine if auto-approval is possible
    const autoApproved =
      validation.auto_approve_eligible && !validation.requires_approval;

    // Calculate rollback deadline based on risk level
    const rollbackDeadline = this.calculateRollbackDeadline(validation.risk_level);

    // Create proposal
    const { data, error } = await supabase
      .from("autonomy_proposals")
      .insert({
        client_id: options.client_id,
        organization_id: options.organization_id,
        report_id: options.trigger.source_id,
        audit_id: options.trigger.type === "DELTA" ? options.trigger.source_id : null,
        domain_scope: options.domain_scope,
        change_type: options.change_type,
        title: options.title,
        description: options.description,
        risk_level: validation.risk_level,
        risk_explanation: this.generateRiskExplanation(
          options.domain_scope,
          options.change_type,
          validation.risk_level
        ),
        proposed_diff: options.proposed_diff,
        target_url: options.target_url,
        target_element: options.target_element,
        status: autoApproved ? "APPROVED" : "PENDING",
        requires_approval: validation.requires_approval,
        auto_approved: autoApproved,
        approved_at: autoApproved ? new Date().toISOString() : null,
        rollback_deadline: rollbackDeadline,
        created_by: options.created_by || "SYSTEM",
      })
      .select()
      .single();

    if (error) {
throw error;
}

    // Log audit event
    await this.logAuditEvent(options.client_id, options.organization_id, {
      action_type: autoApproved ? "PROPOSAL_AUTO_APPROVED" : "PROPOSAL_CREATED",
      proposal_id: data.id,
      domain_scope: options.domain_scope,
      risk_level: validation.risk_level,
      approval_status: autoApproved ? "AUTO_APPROVED_TRUSTED_MODE" : "PENDING",
      details: {
        trigger_type: options.trigger.type,
        change_type: options.change_type,
        auto_approved: autoApproved,
      },
    });

    return data;
  }

  /**
   * Validate a proposal against trust scopes
   */
  async validateProposal(
    options: CreateProposalOptions
  ): Promise<ProposalValidationResult> {
    const errors: string[] = [];

    // Check if change is allowed by trust scopes
    const allowCheck = await this.trustService.isChangeAllowed(
      options.client_id,
      options.domain_scope,
      options.change_type,
      "LOW" // Start with LOW, we'll determine actual risk
    );

    if (!allowCheck.allowed) {
      errors.push(allowCheck.reason || "Change not allowed");
    }

    // Determine risk level based on change type and scope
    const riskLevel = this.assessRiskLevel(
      options.domain_scope,
      options.change_type,
      options.proposed_diff
    );

    // Check if risk level is within allowed limits
    const supabase = await getSupabaseServer();
    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("max_risk_level_allowed")
      .eq("client_id", options.client_id)
      .single();

    const riskLevels = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    if (scopes && riskLevels[riskLevel] > riskLevels[scopes.max_risk_level_allowed]) {
      errors.push(
        `Risk level ${riskLevel} exceeds maximum allowed ${scopes.max_risk_level_allowed}`
      );
    }

    // Determine if approval is required
    const requiresApproval = riskLevel !== "LOW" || errors.length > 0;

    // Check if auto-approval is eligible (LOW risk + Trusted Mode ACTIVE)
    const { data: trustRequest } = await supabase
      .from("trusted_mode_requests")
      .select("status")
      .eq("client_id", options.client_id)
      .single();

    const autoApproveEligible =
      trustRequest?.status === "ACTIVE" &&
      riskLevel === "LOW" &&
      errors.length === 0;

    return {
      valid: errors.length === 0,
      errors,
      risk_level: riskLevel,
      requires_approval: requiresApproval,
      auto_approve_eligible: autoApproveEligible,
    };
  }

  /**
   * Assess risk level for a change
   */
  private assessRiskLevel(
    domainScope: DomainScope,
    changeType: string,
    diff: Record<string, any>
  ): RiskLevel {
    // HIGH risk changes
    const highRiskChanges = [
      "domain_redirect",
      "robots_txt_modify",
      "campaign_launch",
      "budget_increase",
      "mass_content_delete",
      "schema_major_change",
    ];

    if (highRiskChanges.includes(changeType)) {
      return "HIGH";
    }

    // MEDIUM risk changes
    const mediumRiskChanges = [
      "h1_change",
      "canonical_change",
      "content_create",
      "ad_copy_change",
      "ab_test_create",
      "internal_link_bulk",
    ];

    if (mediumRiskChanges.includes(changeType)) {
      return "MEDIUM";
    }

    // Check diff size for context
    const diffSize = JSON.stringify(diff).length;
    if (diffSize > 5000) {
      return "MEDIUM";
    }

    // Default to LOW
    return "LOW";
  }

  /**
   * Generate risk explanation
   */
  private generateRiskExplanation(
    domainScope: DomainScope,
    changeType: string,
    riskLevel: RiskLevel
  ): string {
    const explanations: Record<string, string> = {
      title_tag: "Title tag changes affect search rankings and click-through rates",
      meta_description: "Meta description changes affect search snippet appearance",
      h1_change: "H1 changes affect page structure and keyword targeting",
      canonical_change: "Canonical changes affect page indexation",
      content_create: "New content requires review for quality and accuracy",
      blog_post: "Blog posts represent the brand voice",
      faq_add: "FAQ content should be accurate and helpful",
      ad_copy_change: "Ad copy directly affects campaign performance",
      bid_adjust: "Bid changes affect campaign costs",
      ab_test_create: "A/B tests affect user experience",
    };

    const base = explanations[changeType] || `${changeType} in ${domainScope} domain`;
    return `${riskLevel} RISK: ${base}`;
  }

  /**
   * Calculate rollback deadline based on risk level
   */
  private calculateRollbackDeadline(riskLevel: RiskLevel): string {
    const now = Date.now();
    const deadlines = {
      LOW: 72 * 60 * 60 * 1000, // 72 hours
      MEDIUM: 7 * 24 * 60 * 60 * 1000, // 7 days
      HIGH: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    return new Date(now + deadlines[riskLevel]).toISOString();
  }

  /**
   * Approve a proposal
   */
  async approveProposal(
    proposalId: string,
    approvedBy: string,
    notes?: string
  ): Promise<AutonomyProposal> {
    const supabase = await getSupabaseServer();

    const { data: proposal, error: fetchError } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "PENDING") {
      throw new Error(`Cannot approve proposal in status: ${proposal.status}`);
    }

    const { data, error } = await supabase
      .from("autonomy_proposals")
      .update({
        status: "APPROVED",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) {
throw error;
}

    // Log audit event
    await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
      action_type: "PROPOSAL_APPROVED",
      proposal_id: proposalId,
      actor_id: approvedBy,
      approval_status: "APPROVED",
      details: { notes },
    });

    return data;
  }

  /**
   * Reject a proposal
   */
  async rejectProposal(
    proposalId: string,
    rejectedBy: string,
    reason: string
  ): Promise<AutonomyProposal> {
    const supabase = await getSupabaseServer();

    const { data: proposal, error: fetchError } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (fetchError || !proposal) {
      throw new Error("Proposal not found");
    }

    const { data, error } = await supabase
      .from("autonomy_proposals")
      .update({
        status: "REJECTED",
        rejection_reason: reason,
      })
      .eq("id", proposalId)
      .select()
      .single();

    if (error) {
throw error;
}

    // Log audit event
    await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
      action_type: "PROPOSAL_REJECTED",
      proposal_id: proposalId,
      actor_id: rejectedBy,
      approval_status: "REJECTED",
      details: { reason },
    });

    return data;
  }

  /**
   * Get pending proposals for a client
   */
  async getPendingProposals(clientId: string): Promise<AutonomyProposal[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
return [];
}
    return data;
  }

  /**
   * Get approved proposals ready for execution
   */
  async getApprovedProposals(clientId?: string): Promise<AutonomyProposal[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("status", "APPROVED")
      .order("created_at", { ascending: true });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
return [];
}
    return data;
  }

  /**
   * Generate proposals from delta report
   */
  async generateFromDelta(
    clientId: string,
    organizationId: string,
    deltaReport: Record<string, any>
  ): Promise<AutonomyProposal[]> {
    const proposals: AutonomyProposal[] = [];

    // Check for significant keyword losses
    if (deltaReport.keywords?.lost > 10) {
      const proposal = await this.createProposal({
        client_id: clientId,
        organization_id: organizationId,
        trigger: { type: "DELTA", source_id: deltaReport.audit_id, data: deltaReport },
        domain_scope: "SEO",
        change_type: "keyword_recovery",
        title: `Recover ${deltaReport.keywords.lost} lost keywords`,
        description: `Keywords have dropped significantly. Recommend content refresh and optimization.`,
        proposed_diff: {
          action: "keyword_recovery",
          keywords_affected: deltaReport.keywords.lost,
          recommended_pages: deltaReport.affected_pages || [],
        },
      });
      proposals.push(proposal);
    }

    // Check for backlink losses
    if (deltaReport.backlinks?.lost > 20) {
      const proposal = await this.createProposal({
        client_id: clientId,
        organization_id: organizationId,
        trigger: { type: "BACKLINK_CHANGE", data: deltaReport },
        domain_scope: "SEO",
        change_type: "backlink_recovery",
        title: `Address ${deltaReport.backlinks.lost} lost backlinks`,
        description: `Significant backlink losses detected. Recommend outreach campaign.`,
        proposed_diff: {
          action: "backlink_outreach",
          backlinks_lost: deltaReport.backlinks.lost,
          domains_lost: deltaReport.lost_domains || [],
        },
      });
      proposals.push(proposal);
    }

    // Check for health score drop
    if (deltaReport.health_score_delta < -15) {
      const proposal = await this.createProposal({
        client_id: clientId,
        organization_id: organizationId,
        trigger: { type: "ANOMALY", data: deltaReport },
        domain_scope: "SEO",
        change_type: "technical_audit",
        title: `Investigate ${Math.abs(deltaReport.health_score_delta)}% health score drop`,
        description: `Health score dropped significantly. Technical audit recommended.`,
        proposed_diff: {
          action: "technical_audit",
          previous_score: deltaReport.previous_health_score,
          current_score: deltaReport.current_health_score,
          delta: deltaReport.health_score_delta,
        },
      });
      proposals.push(proposal);
    }

    return proposals;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    clientId: string,
    organizationId: string,
    event: {
      action_type: string;
      proposal_id?: string;
      actor_id?: string;
      domain_scope?: DomainScope;
      risk_level?: RiskLevel;
      approval_status?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("autonomy_audit_log").insert({
      client_id: clientId,
      organization_id: organizationId,
      action_type: event.action_type,
      source: "ProposalEngine",
      actor_type: event.actor_id ? "HUMAN" : "SYSTEM",
      actor_id: event.actor_id,
      domain_scope: event.domain_scope,
      risk_level: event.risk_level,
      approval_status: event.approval_status,
      proposal_id: event.proposal_id,
      details: event.details || {},
      timestamp_utc: new Date().toISOString(),
    });
  }
}

export const proposalEngine = new ProposalEngine();
