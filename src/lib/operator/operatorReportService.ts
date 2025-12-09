/**
 * Operator Report Service - Phase 10 Week 9
 *
 * Generates reports summarizing operator mode activity including reviews,
 * decisions, playbook usage, guardrail triggers, and sandbox simulations.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export interface OperatorOverviewReport {
  period: { start: string; end: string };
  summary: {
    totalReviews: number;
    approvals: number;
    rejections: number;
    deferrals: number;
    avgReviewTime: number;
    consensusRate: number;
  };
  operators: {
    total: number;
    active: number;
    avgReliabilityScore: number;
  };
  guardrails: {
    totalEvaluations: number;
    blocked: number;
    quorumRequired: number;
    simulated: number;
  };
  playbooks: {
    active: number;
    rulesTriggered: number;
    coachingHintsShown: number;
  };
  sandbox: {
    simulations: number;
    successRate: number;
  };
}

export interface GuardrailUsageReport {
  period: { start: string; end: string };
  byAction: Record<string, number>;
  byDomain: Record<string, number>;
  byRiskLevel: Record<string, number>;
  topBlockingRules: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
  }>;
  operatorImpact: Array<{
    operatorId: string;
    blocked: number;
    quorumRequired: number;
    allowed: number;
  }>;
}

export interface PlaybookImpactReport {
  period: { start: string; end: string };
  playbooks: Array<{
    id: string;
    name: string;
    status: string;
    assignedTo: number;
    rulesCount: number;
    triggers: number;
    effectivenessScore: number;
  }>;
  ruleEffectiveness: Array<{
    ruleId: string;
    ruleName: string;
    triggers: number;
    followedAdvice: number;
    ignoredAdvice: number;
  }>;
  coachingImpact: {
    hintsShown: number;
    markedHelpful: number;
    markedUnhelpful: number;
    helpfulRate: number;
  };
}

export interface GuardrailValidationResult {
  isValid: boolean;
  conflicts: Array<{
    ruleId1: string;
    ruleId2: string;
    type: string;
    description: string;
  }>;
  unreachableRules: Array<{
    ruleId: string;
    ruleName: string;
    reason: string;
  }>;
  duplicateConditions: Array<{
    ruleIds: string[];
    conditions: Record<string, unknown>;
  }>;
  warnings: string[];
}

export class OperatorReportService {
  /**
   * Generate overview report
   */
  async generateOverviewReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OperatorOverviewReport> {
    const supabase = await getSupabaseServer();

    // Get accuracy history for review stats
    const { data: history } = await supabase
      .from("accuracy_history")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("decision_at", startDate.toISOString())
      .lte("decision_at", endDate.toISOString());

    const reviews = history || [];
    const approvals = reviews.filter((r) => r.decision === "APPROVE").length;
    const rejections = reviews.filter((r) => r.decision === "REJECT").length;
    const deferrals = reviews.filter((r) => r.decision === "DEFER").length;
    const avgTime =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.review_time_seconds || 0), 0) /
          reviews.length
        : 0;

    // Get operator scores
    const { data: scores } = await supabase
      .from("reviewer_scores")
      .select("*")
      .eq("organization_id", organizationId);

    const operatorScores = scores || [];
    const avgReliability =
      operatorScores.length > 0
        ? operatorScores.reduce((sum, s) => sum + s.reliability_score, 0) /
          operatorScores.length
        : 0;

    // Get guardrail evaluations
    const { data: evaluations } = await supabase
      .from("guardrail_evaluations")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const evals = evaluations || [];
    const blocked = evals.filter((e) => e.final_action === "BLOCK").length;
    const quorum = evals.filter(
      (e) => e.final_action === "REQUIRE_QUORUM"
    ).length;
    const simulated = evals.filter((e) => e.final_action === "SIMULATE").length;

    // Get playbooks
    const { data: playbooks } = await supabase
      .from("operator_playbooks")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "ACTIVE");

    // Get coaching hints
    const { data: hints } = await supabase
      .from("coaching_hints")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("shown_at", startDate.toISOString())
      .lte("shown_at", endDate.toISOString());

    // Get sandbox executions
    const { data: sandbox } = await supabase
      .from("sandbox_executions")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const sandboxExecs = sandbox || [];
    const sandboxSuccess = sandboxExecs.filter(
      (s) => s.would_have_succeeded
    ).length;

    // Get consensus votes for consensus rate
    const { data: votes } = await supabase
      .from("consensus_votes")
      .select("queue_item_id, vote")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const votesByItem = new Map<string, string[]>();
    (votes || []).forEach((v) => {
      if (!votesByItem.has(v.queue_item_id)) {
        votesByItem.set(v.queue_item_id, []);
      }
      votesByItem.get(v.queue_item_id)!.push(v.vote);
    });

    let consensusCount = 0;
    votesByItem.forEach((itemVotes) => {
      const allSame = itemVotes.every((v) => v === itemVotes[0]);
      if (allSame) {
consensusCount++;
}
    });

    const consensusRate =
      votesByItem.size > 0 ? (consensusCount / votesByItem.size) * 100 : 0;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalReviews: reviews.length,
        approvals,
        rejections,
        deferrals,
        avgReviewTime: Math.round(avgTime),
        consensusRate: Math.round(consensusRate),
      },
      operators: {
        total: operatorScores.length,
        active: operatorScores.filter((s) => s.total_reviews > 0).length,
        avgReliabilityScore: Math.round(avgReliability * 10) / 10,
      },
      guardrails: {
        totalEvaluations: evals.length,
        blocked,
        quorumRequired: quorum,
        simulated,
      },
      playbooks: {
        active: (playbooks || []).length,
        rulesTriggered: evals.filter((e) => e.evaluated_rules?.length > 0).length,
        coachingHintsShown: (hints || []).length,
      },
      sandbox: {
        simulations: sandboxExecs.length,
        successRate:
          sandboxExecs.length > 0
            ? Math.round((sandboxSuccess / sandboxExecs.length) * 100)
            : 0,
      },
    };
  }

  /**
   * Generate guardrail usage report
   */
  async generateGuardrailUsageReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GuardrailUsageReport> {
    const supabase = await getSupabaseServer();

    const { data: evaluations } = await supabase
      .from("guardrail_evaluations")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const evals = evaluations || [];

    // Count by action
    const byAction: Record<string, number> = {};
    evals.forEach((e) => {
      byAction[e.final_action] = (byAction[e.final_action] || 0) + 1;
    });

    // Count by domain
    const byDomain: Record<string, number> = {};
    evals.forEach((e) => {
      if (e.domain) {
        byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;
      }
    });

    // Count by risk level
    const byRiskLevel: Record<string, number> = {};
    evals.forEach((e) => {
      if (e.risk_level) {
        byRiskLevel[e.risk_level] = (byRiskLevel[e.risk_level] || 0) + 1;
      }
    });

    // Top blocking rules
    const blockingRules: Record<string, number> = {};
    evals
      .filter((e) => e.blocking_rule_id)
      .forEach((e) => {
        blockingRules[e.blocking_rule_id] =
          (blockingRules[e.blocking_rule_id] || 0) + 1;
      });

    const topBlockingRules = Object.entries(blockingRules)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ruleId, count]) => ({
        ruleId,
        ruleName: `Rule ${ruleId.slice(0, 8)}`,
        count,
      }));

    // Operator impact
    const operatorStats: Record<
      string,
      { blocked: number; quorumRequired: number; allowed: number }
    > = {};
    evals.forEach((e) => {
      if (!e.operator_id) {
return;
}
      if (!operatorStats[e.operator_id]) {
        operatorStats[e.operator_id] = {
          blocked: 0,
          quorumRequired: 0,
          allowed: 0,
        };
      }
      if (e.final_action === "BLOCK") {
        operatorStats[e.operator_id].blocked++;
      } else if (e.final_action === "REQUIRE_QUORUM") {
        operatorStats[e.operator_id].quorumRequired++;
      } else if (e.final_action === "ALLOW") {
        operatorStats[e.operator_id].allowed++;
      }
    });

    const operatorImpact = Object.entries(operatorStats).map(
      ([operatorId, stats]) => ({
        operatorId,
        ...stats,
      })
    );

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      byAction,
      byDomain,
      byRiskLevel,
      topBlockingRules,
      operatorImpact,
    };
  }

  /**
   * Generate playbook impact report
   */
  async generatePlaybookImpactReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PlaybookImpactReport> {
    const supabase = await getSupabaseServer();

    // Get playbooks
    const { data: playbooks } = await supabase
      .from("operator_playbooks")
      .select("*, playbook_rules(*), playbook_assignments(*)")
      .eq("organization_id", organizationId);

    const playbookData = (playbooks || []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      assignedTo: p.playbook_assignments?.length || 0,
      rulesCount: p.playbook_rules?.length || 0,
      triggers: 0, // Would need to count from evaluations
      effectivenessScore: 75, // Placeholder
    }));

    // Get coaching hints for impact
    const { data: hints } = await supabase
      .from("coaching_hints")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("shown_at", startDate.toISOString())
      .lte("shown_at", endDate.toISOString());

    const allHints = hints || [];
    const helpful = allHints.filter((h) => h.was_helpful === true).length;
    const unhelpful = allHints.filter((h) => h.was_helpful === false).length;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      playbooks: playbookData,
      ruleEffectiveness: [], // Would need detailed tracking
      coachingImpact: {
        hintsShown: allHints.length,
        markedHelpful: helpful,
        markedUnhelpful: unhelpful,
        helpfulRate:
          allHints.length > 0
            ? Math.round((helpful / allHints.length) * 100)
            : 0,
      },
    };
  }

  /**
   * Validate guardrails for conflicts and issues
   */
  async validateGuardrails(
    organizationId: string
  ): Promise<GuardrailValidationResult> {
    const supabase = await getSupabaseServer();

    // Get all active rules
    const { data: playbooks } = await supabase
      .from("operator_playbooks")
      .select("id, playbook_rules(*)")
      .eq("organization_id", organizationId)
      .eq("status", "ACTIVE");

    const allRules: Array<{
      id: string;
      playbook_id: string;
      rule_name: string;
      conditions: Record<string, unknown>;
      action: string;
      priority: number;
      is_active: boolean;
    }> = [];

    (playbooks || []).forEach((p) => {
      (p.playbook_rules || []).forEach((r: unknown) => {
        const rule = r as {
          id: string;
          playbook_id: string;
          rule_name: string;
          conditions: Record<string, unknown>;
          action: string;
          priority: number;
          is_active: boolean;
        };
        if (rule.is_active) {
          allRules.push(rule);
        }
      });
    });

    const conflicts: GuardrailValidationResult["conflicts"] = [];
    const unreachableRules: GuardrailValidationResult["unreachableRules"] = [];
    const duplicateConditions: GuardrailValidationResult["duplicateConditions"] =
      [];
    const warnings: string[] = [];

    // Check for conflicting rules
    for (let i = 0; i < allRules.length; i++) {
      for (let j = i + 1; j < allRules.length; j++) {
        const r1 = allRules[i];
        const r2 = allRules[j];

        // Same conditions but different actions
        if (
          JSON.stringify(r1.conditions) === JSON.stringify(r2.conditions) &&
          r1.action !== r2.action
        ) {
          if (r1.action === "BLOCK" && r2.action === "ALLOW") {
            conflicts.push({
              ruleId1: r1.id,
              ruleId2: r2.id,
              type: "CONFLICTING_ACTIONS",
              description: `Rule "${r1.rule_name}" blocks while "${r2.rule_name}" allows with same conditions`,
            });
          }
        }

        // Duplicate conditions
        if (JSON.stringify(r1.conditions) === JSON.stringify(r2.conditions)) {
          const existing = duplicateConditions.find(
            (d) =>
              JSON.stringify(d.conditions) === JSON.stringify(r1.conditions)
          );
          if (existing) {
            if (!existing.ruleIds.includes(r2.id)) {
              existing.ruleIds.push(r2.id);
            }
          } else {
            duplicateConditions.push({
              ruleIds: [r1.id, r2.id],
              conditions: r1.conditions,
            });
          }
        }
      }
    }

    // Check for unreachable rules
    for (const rule of allRules) {
      // Rules with empty conditions after a BLOCK with empty conditions
      if (Object.keys(rule.conditions).length === 0 && rule.action !== "BLOCK") {
        const hasBlockAll = allRules.some(
          (r) =>
            Object.keys(r.conditions).length === 0 &&
            r.action === "BLOCK" &&
            r.priority > rule.priority
        );
        if (hasBlockAll) {
          unreachableRules.push({
            ruleId: rule.id,
            ruleName: rule.rule_name,
            reason: "Blocked by higher-priority BLOCK rule with same conditions",
          });
        }
      }
    }

    // Add warnings
    if (allRules.length === 0) {
      warnings.push("No active guardrail rules found");
    }

    const blockAllRules = allRules.filter(
      (r) => Object.keys(r.conditions).length === 0 && r.action === "BLOCK"
    );
    if (blockAllRules.length > 0) {
      warnings.push(
        `Found ${blockAllRules.length} rule(s) that block all actions unconditionally`
      );
    }

    return {
      isValid: conflicts.length === 0 && unreachableRules.length === 0,
      conflicts,
      unreachableRules,
      duplicateConditions,
      warnings,
    };
  }
}

export default OperatorReportService;
