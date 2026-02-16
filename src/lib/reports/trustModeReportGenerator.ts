/**
 * Trust Mode Report Generator - Phase 9 Week 9
 *
 * Generates comprehensive reports on trusted mode usage,
 * signatures, approvals, and executions.
 */

import { getSupabaseServer } from "@/lib/supabase";

export interface TrustModeReport {
  generated_at: string;
  period: {
    from: string;
    to: string;
  };
  client_id: string;
  organization_id: string;

  trust_status: {
    current_status: string;
    activated_at?: string;
    last_activity?: string;
  };

  signatures: {
    total: number;
    signed: number;
    pending: number;
    declined: number;
    expired: number;
  };

  proposals: {
    total: number;
    by_status: Record<string, number>;
    by_domain: Record<string, number>;
    by_risk: Record<string, number>;
    auto_approved: number;
    manually_approved: number;
  };

  executions: {
    total: number;
    successful: number;
    failed: number;
    average_duration_ms: number;
    by_domain: Record<string, number>;
  };

  rollbacks: {
    total: number;
    soft_undo: number;
    hard_undo: number;
    escalated: number;
  };

  audit_summary: {
    total_events: number;
    by_action: Record<string, number>;
    by_actor: Record<string, number>;
  };

  recommendations: string[];
}

export class TrustModeReportGenerator {
  /**
   * Generate a comprehensive trust mode report
   */
  async generateReport(
    clientId: string,
    organizationId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<TrustModeReport> {
    const supabase = await getSupabaseServer();
    const now = new Date();
    const from = fromDate || new Date(now.setDate(now.getDate() - 30)).toISOString();
    const to = toDate || new Date().toISOString();

    // Get trust status
    const { data: trustRequest } = await supabase
      .from("trusted_mode_requests")
      .select("*")
      .eq("client_id", clientId)
      .single();

    // Get signatures
    const { data: signatures } = await supabase
      .from("signature_requests")
      .select("status")
      .eq("client_id", clientId);

    // Get proposals
    const { data: proposals } = await supabase
      .from("autonomy_proposals")
      .select("status, domain, risk_level, approved_by, created_at")
      .eq("client_id", clientId)
      .gte("created_at", from)
      .lte("created_at", to);

    // Get executions
    const { data: executions } = await supabase
      .from("autonomy_executions")
      .select(`
        *,
        autonomy_proposals!inner(domain)
      `)
      .eq("autonomy_proposals.client_id", clientId)
      .gte("executed_at", from)
      .lte("executed_at", to);

    // Get audit events
    const { data: auditEvents } = await supabase
      .from("autonomy_audit_log")
      .select("action_type, actor_type")
      .eq("client_id", clientId)
      .gte("timestamp_utc", from)
      .lte("timestamp_utc", to);

    // Process data
    const signatureStats = this.processSignatures(signatures || []);
    const proposalStats = this.processProposals(proposals || []);
    const executionStats = this.processExecutions(executions || []);
    const rollbackStats = this.processRollbacks(proposals || []);
    const auditStats = this.processAudit(auditEvents || []);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      proposalStats,
      executionStats,
      rollbackStats
    );

    return {
      generated_at: new Date().toISOString(),
      period: { from, to },
      client_id: clientId,
      organization_id: organizationId,

      trust_status: {
        current_status: trustRequest?.status || "NOT_INITIALIZED",
        activated_at: trustRequest?.activated_at,
        last_activity: trustRequest?.updated_at,
      },

      signatures: signatureStats,
      proposals: proposalStats,
      executions: executionStats,
      rollbacks: rollbackStats,
      audit_summary: auditStats,
      recommendations,
    };
  }

  private processSignatures(signatures: { status: string }[]) {
    const stats = {
      total: signatures.length,
      signed: 0,
      pending: 0,
      declined: 0,
      expired: 0,
    };

    signatures.forEach((sig) => {
      if (sig.status === "SIGNED") stats.signed++;
      else if (sig.status === "SENT" || sig.status === "DELIVERED") stats.pending++;
      else if (sig.status === "DECLINED") stats.declined++;
      else if (sig.status === "EXPIRED") stats.expired++;
    });

    return stats;
  }

  private processProposals(proposals: { status: string; domain: string; risk_level: string; approved_by: string | null; created_at: string }[]) {
    const byStatus: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    const byRisk: Record<string, number> = {};
    let autoApproved = 0;
    let manuallyApproved = 0;

    proposals.forEach((p) => {
      // By status
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;

      // By domain
      byDomain[p.domain] = (byDomain[p.domain] || 0) + 1;

      // By risk
      byRisk[p.risk_level] = (byRisk[p.risk_level] || 0) + 1;

      // Auto vs manual
      if (p.status === "APPROVED" || p.status === "EXECUTED") {
        if (p.approved_by === "SYSTEM") {
          autoApproved++;
        } else {
          manuallyApproved++;
        }
      }
    });

    return {
      total: proposals.length,
      by_status: byStatus,
      by_domain: byDomain,
      by_risk: byRisk,
      auto_approved: autoApproved,
      manually_approved: manuallyApproved,
    };
  }

  private processExecutions(executions: { autonomy_proposals?: { domain: string } | null; execution_duration_ms?: number; rollback_type?: string | null }[]) {
    const byDomain: Record<string, number> = {};
    let totalDuration = 0;
    let successful = 0;
    let failed = 0;

    executions.forEach((e) => {
      const domain = e.autonomy_proposals?.domain || "UNKNOWN";
      byDomain[domain] = (byDomain[domain] || 0) + 1;

      if (e.execution_duration_ms) {
        totalDuration += e.execution_duration_ms;
      }

      // Determine success/failure based on rollback status
      if (e.rollback_type) {
        failed++;
      } else {
        successful++;
      }
    });

    return {
      total: executions.length,
      successful,
      failed,
      average_duration_ms:
        executions.length > 0 ? Math.round(totalDuration / executions.length) : 0,
      by_domain: byDomain,
    };
  }

  private processRollbacks(proposals: { status: string }[]) {
    const stats = {
      total: 0,
      soft_undo: 0,
      hard_undo: 0,
      escalated: 0,
    };

    proposals.forEach((p) => {
      if (p.status === "ROLLED_BACK") {
        stats.total++;
        // Would need execution data to determine type
      }
    });

    return stats;
  }

  private processAudit(events: { action_type: string; actor_type: string }[]) {
    const byAction: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    events.forEach((e) => {
      byAction[e.action_type] = (byAction[e.action_type] || 0) + 1;
      byActor[e.actor_type] = (byActor[e.actor_type] || 0) + 1;
    });

    return {
      total_events: events.length,
      by_action: byAction,
      by_actor: byActor,
    };
  }

  private generateRecommendations(
    proposals: TrustModeReport['proposals'],
    executions: TrustModeReport['executions'],
    rollbacks: TrustModeReport['rollbacks']
  ): string[] {
    const recommendations: string[] = [];

    // High rejection rate
    const rejectedCount = proposals.by_status["REJECTED"] || 0;
    if (rejectedCount > proposals.total * 0.3) {
      recommendations.push(
        "High rejection rate detected. Consider reviewing proposal quality and risk assessment."
      );
    }

    // High rollback rate
    if (rollbacks.total > executions.total * 0.2) {
      recommendations.push(
        "Elevated rollback rate. Review execution validation and pre-flight checks."
      );
    }

    // Slow executions
    if (executions.average_duration_ms > 10000) {
      recommendations.push(
        "Average execution time is high. Consider optimizing change application logic."
      );
    }

    // Domain imbalance
    const domains = Object.keys(proposals.by_domain);
    if (domains.length === 1) {
      recommendations.push(
        `All proposals are in ${domains[0]} domain. Consider expanding autonomy scope.`
      );
    }

    // High risk concentration
    const highRisk = proposals.by_risk["HIGH"] || 0;
    if (highRisk > proposals.total * 0.5) {
      recommendations.push(
        "Majority of proposals are HIGH risk. Review risk classification thresholds."
      );
    }

    // Low automation
    if (proposals.auto_approved < proposals.manually_approved * 0.5) {
      recommendations.push(
        "Low auto-approval rate. Consider relaxing LOW risk auto-approval criteria."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "System is operating within normal parameters. No immediate actions required."
      );
    }

    return recommendations;
  }

  /**
   * Generate report as formatted text
   */
  formatReportAsText(report: TrustModeReport): string {
    const lines: string[] = [
      "═══════════════════════════════════════════════════════════════",
      "                    TRUST MODE REPORT",
      "═══════════════════════════════════════════════════════════════",
      "",
      `Generated: ${new Date(report.generated_at).toLocaleString()}`,
      `Period: ${new Date(report.period.from).toLocaleDateString()} - ${new Date(report.period.to).toLocaleDateString()}`,
      "",
      "─────────────────────────────────────────────────────────────",
      "TRUST STATUS",
      "─────────────────────────────────────────────────────────────",
      `  Current Status: ${report.trust_status.current_status}`,
      `  Activated: ${report.trust_status.activated_at ? new Date(report.trust_status.activated_at).toLocaleString() : "N/A"}`,
      "",
      "─────────────────────────────────────────────────────────────",
      "SIGNATURES",
      "─────────────────────────────────────────────────────────────",
      `  Total: ${report.signatures.total}`,
      `  Signed: ${report.signatures.signed}`,
      `  Pending: ${report.signatures.pending}`,
      `  Declined: ${report.signatures.declined}`,
      "",
      "─────────────────────────────────────────────────────────────",
      "PROPOSALS",
      "─────────────────────────────────────────────────────────────",
      `  Total: ${report.proposals.total}`,
      `  Auto-Approved: ${report.proposals.auto_approved}`,
      `  Manually Approved: ${report.proposals.manually_approved}`,
      "",
      "  By Status:",
      ...Object.entries(report.proposals.by_status).map(
        ([k, v]) => `    ${k}: ${v}`
      ),
      "",
      "  By Domain:",
      ...Object.entries(report.proposals.by_domain).map(
        ([k, v]) => `    ${k}: ${v}`
      ),
      "",
      "  By Risk Level:",
      ...Object.entries(report.proposals.by_risk).map(
        ([k, v]) => `    ${k}: ${v}`
      ),
      "",
      "─────────────────────────────────────────────────────────────",
      "EXECUTIONS",
      "─────────────────────────────────────────────────────────────",
      `  Total: ${report.executions.total}`,
      `  Successful: ${report.executions.successful}`,
      `  Failed: ${report.executions.failed}`,
      `  Avg Duration: ${report.executions.average_duration_ms}ms`,
      "",
      "─────────────────────────────────────────────────────────────",
      "ROLLBACKS",
      "─────────────────────────────────────────────────────────────",
      `  Total: ${report.rollbacks.total}`,
      `  Soft Undo: ${report.rollbacks.soft_undo}`,
      `  Hard Undo: ${report.rollbacks.hard_undo}`,
      `  Escalated: ${report.rollbacks.escalated}`,
      "",
      "─────────────────────────────────────────────────────────────",
      "RECOMMENDATIONS",
      "─────────────────────────────────────────────────────────────",
      ...report.recommendations.map((r) => `  • ${r}`),
      "",
      "═══════════════════════════════════════════════════════════════",
    ];

    return lines.join("\n");
  }
}

export const trustModeReportGenerator = new TrustModeReportGenerator();
