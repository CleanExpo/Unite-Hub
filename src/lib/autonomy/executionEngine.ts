/**
 * Execution Engine - Phase 9 Week 7-8
 *
 * Executes approved proposals with safety checks and rollback support.
 */

import { getSupabaseServer } from "@/lib/supabase";
import { TrustModeService } from "@/lib/trust/trustModeService";
import {
  DomainScope,
  RiskLevel,
  ExecutorType,
  AutonomyProposal,
  AutonomyExecution,
} from "@/lib/validation/trustSchemas";

// =============================================================
// Types
// =============================================================

export interface ExecutionResult {
  success: boolean;
  execution_id: string;
  change_summary: string;
  affected_urls?: string[];
  error_message?: string;
  duration_ms: number;
}

export interface ExecutionContext {
  proposal: AutonomyProposal;
  executor_type: ExecutorType;
  executor_id?: string;
  dry_run?: boolean;
}

// =============================================================
// Execution Engine
// =============================================================

export class ExecutionEngine {
  private trustService: TrustModeService;

  constructor() {
    this.trustService = new TrustModeService();
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const { proposal, executor_type, executor_id, dry_run } = context;

    // Validate proposal is approved
    if (proposal.status !== "APPROVED") {
      throw new Error(`Cannot execute proposal in status: ${proposal.status}`);
    }

    // Check trusted mode is still active
    const trustStatus = await this.trustService.getStatus(proposal.client_id);
    if (trustStatus.trusted_mode_status !== "ACTIVE") {
      throw new Error("Trusted Mode is not active");
    }

    // Check daily execution limit
    const withinLimit = await this.checkDailyLimit(proposal.client_id);
    if (!withinLimit) {
      throw new Error("Daily execution limit reached");
    }

    // Check execution window
    const inWindow = await this.checkExecutionWindow(proposal.client_id);
    if (!inWindow && !dry_run) {
      throw new Error("Outside execution window");
    }

    const supabase = await getSupabaseServer();

    // Update proposal status to EXECUTING
    await supabase
      .from("autonomy_proposals")
      .update({ status: "EXECUTING" })
      .eq("id", proposal.id);

    try {
      // Take before snapshot
      const beforeSnapshot = await this.takeSnapshot(proposal);

      // Execute the change
      let result: {
        success: boolean;
        summary: string;
        affected_urls?: string[];
        error?: string;
      };

      if (dry_run) {
        result = {
          success: true,
          summary: `[DRY RUN] Would execute: ${proposal.title}`,
          affected_urls: [],
        };
      } else {
        result = await this.performExecution(proposal);
      }

      // Take after snapshot
      const afterSnapshot = result.success
        ? await this.takeSnapshot(proposal)
        : beforeSnapshot;

      const duration = Date.now() - startTime;

      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from("autonomy_executions")
        .insert({
          proposal_id: proposal.id,
          client_id: proposal.client_id,
          executor_type,
          executor_id,
          before_snapshot_path: beforeSnapshot,
          after_snapshot_path: afterSnapshot,
          change_summary: result.summary,
          affected_urls: result.affected_urls,
          rollback_token_id: proposal.rollback_token_id,
          rollback_available_until: proposal.rollback_deadline,
          success: result.success,
          error_message: result.error,
          duration_ms: duration,
        })
        .select()
        .single();

      if (execError) {
throw execError;
}

      // Update proposal status
      await supabase
        .from("autonomy_proposals")
        .update({
          status: result.success ? "EXECUTED" : "FAILED",
          executed_by: executor_id || "SYSTEM",
          executed_at: new Date().toISOString(),
          execution_error: result.error,
        })
        .eq("id", proposal.id);

      // Log audit event
      await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
        action_type: result.success ? "EXECUTION_COMPLETED" : "EXECUTION_FAILED",
        proposal_id: proposal.id,
        execution_id: execution.id,
        rollback_token_id: proposal.rollback_token_id,
        details: {
          executor_type,
          duration_ms: duration,
          dry_run,
          error: result.error,
        },
      });

      return {
        success: result.success,
        execution_id: execution.id,
        change_summary: result.summary,
        affected_urls: result.affected_urls,
        error_message: result.error,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update proposal to failed
      await supabase
        .from("autonomy_proposals")
        .update({
          status: "FAILED",
          execution_error: errorMessage,
        })
        .eq("id", proposal.id);

      // Log failure
      await this.logAuditEvent(proposal.client_id, proposal.organization_id, {
        action_type: "EXECUTION_FAILED",
        proposal_id: proposal.id,
        details: {
          error: errorMessage,
          duration_ms: duration,
        },
      });

      throw error;
    }
  }

  /**
   * Perform the actual execution based on domain and change type
   */
  private async performExecution(
    proposal: AutonomyProposal
  ): Promise<{
    success: boolean;
    summary: string;
    affected_urls?: string[];
    error?: string;
  }> {
    const { domain_scope, change_type, proposed_diff, target_url } = proposal;

    try {
      switch (domain_scope) {
        case "SEO":
          return await this.executeSEOChange(change_type, proposed_diff, target_url);

        case "CONTENT":
          return await this.executeContentChange(change_type, proposed_diff, target_url);

        case "ADS":
          return await this.executeAdsChange(change_type, proposed_diff);

        case "CRO":
          return await this.executeCROChange(change_type, proposed_diff, target_url);

        default:
          return {
            success: false,
            summary: `Unknown domain scope: ${domain_scope}`,
            error: "Invalid domain scope",
          };
      }
    } catch (error) {
      return {
        success: false,
        summary: `Execution failed for ${change_type}`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Execute SEO changes
   */
  private async executeSEOChange(
    changeType: string,
    diff: Record<string, any>,
    targetUrl?: string
  ): Promise<{ success: boolean; summary: string; affected_urls?: string[]; error?: string }> {
    // In production, these would connect to actual CMS/website APIs
    switch (changeType) {
      case "title_tag":
        return {
          success: true,
          summary: `Updated title tag: "${diff.new_title}"`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "meta_description":
        return {
          success: true,
          summary: `Updated meta description`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "canonical_fix":
        return {
          success: true,
          summary: `Fixed canonical tag to: ${diff.canonical_url}`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "internal_link":
        return {
          success: true,
          summary: `Added internal link from ${diff.source_url} to ${diff.target_url}`,
          affected_urls: [diff.source_url, diff.target_url],
        };

      case "keyword_recovery":
        return {
          success: true,
          summary: `Initiated keyword recovery for ${diff.keywords_affected} keywords`,
          affected_urls: diff.recommended_pages || [],
        };

      default:
        return {
          success: true,
          summary: `Executed SEO change: ${changeType}`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };
    }
  }

  /**
   * Execute Content changes
   */
  private async executeContentChange(
    changeType: string,
    diff: Record<string, any>,
    targetUrl?: string
  ): Promise<{ success: boolean; summary: string; affected_urls?: string[]; error?: string }> {
    switch (changeType) {
      case "faq_add":
        return {
          success: true,
          summary: `Added ${diff.questions?.length || 0} FAQ items`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "blog_post":
        return {
          success: true,
          summary: `Created blog post: "${diff.title}"`,
          affected_urls: [diff.url || "/blog/new-post"],
        };

      case "content_refresh":
        return {
          success: true,
          summary: `Refreshed content with updated statistics`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "alt_text":
        return {
          success: true,
          summary: `Updated alt text for ${diff.images?.length || 0} images`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      default:
        return {
          success: true,
          summary: `Executed content change: ${changeType}`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };
    }
  }

  /**
   * Execute Ads changes
   */
  private async executeAdsChange(
    changeType: string,
    diff: Record<string, any>
  ): Promise<{ success: boolean; summary: string; affected_urls?: string[]; error?: string }> {
    switch (changeType) {
      case "ad_copy_draft":
        return {
          success: true,
          summary: `Created draft ad copy: "${diff.headline}"`,
        };

      case "negative_keyword":
        return {
          success: true,
          summary: `Added ${diff.keywords?.length || 0} negative keywords`,
        };

      case "bid_adjust":
        return {
          success: true,
          summary: `Adjusted bids by ${diff.adjustment_percent}%`,
        };

      default:
        return {
          success: true,
          summary: `Executed ads change: ${changeType}`,
        };
    }
  }

  /**
   * Execute CRO changes
   */
  private async executeCROChange(
    changeType: string,
    diff: Record<string, any>,
    targetUrl?: string
  ): Promise<{ success: boolean; summary: string; affected_urls?: string[]; error?: string }> {
    switch (changeType) {
      case "ab_test_create":
        return {
          success: true,
          summary: `Created A/B test: "${diff.test_name}"`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      case "button_copy":
        return {
          success: true,
          summary: `Updated button copy to: "${diff.new_copy}"`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };

      default:
        return {
          success: true,
          summary: `Executed CRO change: ${changeType}`,
          affected_urls: targetUrl ? [targetUrl] : [],
        };
    }
  }

  /**
   * Check daily execution limit
   */
  private async checkDailyLimit(clientId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    // Get scopes to find limit
    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("max_daily_actions")
      .eq("client_id", clientId)
      .single();

    const maxDaily = scopes?.max_daily_actions || 10;

    // Count today's executions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("autonomy_executions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("executed_at", today.toISOString());

    return (count || 0) < maxDaily;
  }

  /**
   * Check if within execution window
   */
  private async checkExecutionWindow(clientId: string): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const { data: scopes } = await supabase
      .from("autonomy_scopes")
      .select("execution_window_start, execution_window_end, execution_timezone")
      .eq("client_id", clientId)
      .single();

    if (!scopes) {
return true;
} // No scopes = no restrictions

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = (scopes.execution_window_start || "09:00")
      .split(":")
      .map(Number);
    const [endHour, endMin] = (scopes.execution_window_end || "17:00")
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Take a snapshot for rollback
   */
  private async takeSnapshot(proposal: AutonomyProposal): Promise<string> {
    // In production, this would create an actual snapshot
    const snapshotId = `snapshot-${proposal.id}-${Date.now()}`;
    const path = `/data/clients/${proposal.client_id}/autonomy/snapshots/${snapshotId}.json`;

    // Would save current state to storage
    return path;
  }

  /**
   * Get execution history for a client
   */
  async getExecutionHistory(
    clientId: string,
    limit: number = 50
  ): Promise<AutonomyExecution[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("autonomy_executions")
      .select("*")
      .eq("client_id", clientId)
      .order("executed_at", { ascending: false })
      .limit(limit);

    if (error) {
return [];
}
    return data;
  }

  /**
   * Process all approved proposals for a client
   */
  async processApprovedProposals(clientId: string): Promise<ExecutionResult[]> {
    const supabase = await getSupabaseServer();

    const { data: proposals } = await supabase
      .from("autonomy_proposals")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: true });

    if (!proposals || proposals.length === 0) {
      return [];
    }

    const results: ExecutionResult[] = [];

    for (const proposal of proposals) {
      try {
        const result = await this.executeProposal({
          proposal,
          executor_type: "SYSTEM",
        });
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          execution_id: "",
          change_summary: `Failed to execute: ${proposal.title}`,
          error_message: error instanceof Error ? error.message : "Unknown error",
          duration_ms: 0,
        });
      }
    }

    return results;
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
      execution_id?: string;
      rollback_token_id?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("autonomy_audit_log").insert({
      client_id: clientId,
      organization_id: organizationId,
      action_type: event.action_type,
      source: "ExecutionEngine",
      actor_type: "SYSTEM",
      proposal_id: event.proposal_id,
      execution_id: event.execution_id,
      rollback_token_id: event.rollback_token_id,
      details: event.details || {},
      timestamp_utc: new Date().toISOString(),
    });
  }
}

export const executionEngine = new ExecutionEngine();
