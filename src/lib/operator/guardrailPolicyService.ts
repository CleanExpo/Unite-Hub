/**
 * Guardrail Policy Service - Phase 10 Week 7-8
 *
 * Maps risk level, domain, and operator score to allowed actions.
 * Supports sandbox simulation mode for training.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type GuardrailAction =
  | "ALLOW"
  | "BLOCK"
  | "REQUIRE_QUORUM"
  | "SIMULATE"
  | "ESCALATE"
  | "NOTIFY"
  | "COACH";

export type RiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";

export interface PlaybookRule {
  id: string;
  playbook_id: string;
  rule_name: string;
  rule_type: string;
  conditions: Record<string, unknown>;
  action: GuardrailAction;
  action_params: Record<string, unknown>;
  coaching_message: string | null;
  coaching_severity: string | null;
  priority: number;
  is_active: boolean;
}

export interface GuardrailEvaluationContext {
  operatorId: string;
  organizationId: string;
  domain?: string;
  riskLevel?: RiskLevel;
  operatorScore?: number;
  proposalId?: string;
  queueItemId?: string;
  isSandboxMode?: boolean;
}

export interface GuardrailEvaluationResult {
  action: GuardrailAction;
  blockingRuleId?: string;
  blockingRuleName?: string;
  evaluatedRules: string[];
  coachingHints: CoachingHint[];
  requiresQuorum: boolean;
  quorumSize?: number;
  sandboxOnly: boolean;
}

export interface CoachingHint {
  ruleId: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  type: "TIP" | "WARNING" | "BEST_PRACTICE" | "LEARNING" | "REMINDER";
}

export interface SandboxExecutionResult {
  id: string;
  simulatedResult: Record<string, unknown>;
  wouldHaveSucceeded: boolean;
  simulatedSideEffects: Record<string, unknown>[];
  insights: string[];
  warnings: string[];
}

export class GuardrailPolicyService {
  /**
   * Evaluate guardrail policies for a given context
   */
  async evaluateGuardrails(
    context: GuardrailEvaluationContext
  ): Promise<GuardrailEvaluationResult> {
    const supabase = await getSupabaseServer();

    // Get applicable playbooks and rules
    const rules = await this.getApplicableRules(
      context.organizationId,
      context.operatorId,
      context.domain,
      context.riskLevel
    );

    const evaluatedRules: string[] = [];
    const coachingHints: CoachingHint[] = [];
    let finalAction: GuardrailAction = "ALLOW";
    let blockingRuleId: string | undefined;
    let blockingRuleName: string | undefined;
    let requiresQuorum = false;
    let quorumSize: number | undefined;
    let sandboxOnly = context.isSandboxMode || false;

    // Evaluate rules in priority order
    for (const rule of rules) {
      if (!rule.is_active) {
continue;
}

      evaluatedRules.push(rule.id);

      // Check if conditions match
      const matches = this.evaluateConditions(rule.conditions, context);
      if (!matches) {
continue;
}

      // Process based on rule type
      switch (rule.rule_type) {
        case "GUARDRAIL":
          // Guardrails can override action
          if (this.isMoreRestrictive(rule.action, finalAction)) {
            finalAction = rule.action;
            if (rule.action === "BLOCK") {
              blockingRuleId = rule.id;
              blockingRuleName = rule.rule_name;
            }
            if (rule.action === "REQUIRE_QUORUM") {
              requiresQuorum = true;
              quorumSize = (rule.action_params.quorum_size as number) || 2;
            }
            if (rule.action === "SIMULATE") {
              sandboxOnly = true;
            }
          }
          break;

        case "COACHING":
          if (rule.coaching_message) {
            coachingHints.push({
              ruleId: rule.id,
              message: rule.coaching_message,
              severity: (rule.coaching_severity as "INFO" | "WARNING" | "CRITICAL") || "INFO",
              type: (rule.action_params.hint_type as CoachingHint["type"]) || "TIP",
            });
          }
          break;

        case "ESCALATION":
          if (rule.action === "ESCALATE") {
            // Mark for escalation
            finalAction = "ESCALATE";
          }
          break;
      }
    }

    // Log evaluation
    await this.logEvaluation(
      context,
      evaluatedRules,
      finalAction,
      blockingRuleId
    );

    return {
      action: finalAction,
      blockingRuleId,
      blockingRuleName,
      evaluatedRules,
      coachingHints,
      requiresQuorum,
      quorumSize,
      sandboxOnly,
    };
  }

  /**
   * Get applicable rules for an operator
   */
  private async getApplicableRules(
    organizationId: string,
    operatorId: string,
    domain?: string,
    riskLevel?: RiskLevel
  ): Promise<PlaybookRule[]> {
    const supabase = await getSupabaseServer();

    // Get operator's role
    const { data: profile } = await supabase
      .from("operator_profiles")
      .select("role")
      .eq("user_id", operatorId)
      .eq("organization_id", organizationId)
      .single();

    const operatorRole = profile?.role || "ANALYST";

    // Get playbooks assigned to this operator (by role or user)
    const { data: assignments } = await supabase
      .from("playbook_assignments")
      .select("playbook_id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .or(`target_role.eq.${operatorRole},target_user_id.eq.${operatorId}`);

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const playbookIds = assignments.map((a) => a.playbook_id);

    // Get active playbooks matching domain/risk
    const { data: playbooks } = await supabase
      .from("operator_playbooks")
      .select("id")
      .in("id", playbookIds)
      .eq("status", "ACTIVE")
      .or(
        `domain.is.null,domain.eq.${domain || ""},risk_level.is.null,risk_level.eq.${riskLevel || ""}`
      );

    if (!playbooks || playbooks.length === 0) {
      return [];
    }

    const activePlaybookIds = playbooks.map((p) => p.id);

    // Get rules from active playbooks
    const { data: rules, error } = await supabase
      .from("playbook_rules")
      .select("*")
      .in("playbook_id", activePlaybookIds)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      throw new Error(`Failed to get rules: ${error.message}`);
    }

    return rules || [];
  }

  /**
   * Evaluate rule conditions against context
   */
  private evaluateConditions(
    conditions: Record<string, unknown>,
    context: GuardrailEvaluationContext
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case "operator_score":
          if (context.operatorScore === undefined) {
continue;
}
          const scoreCondition = value as string;
          if (scoreCondition.startsWith("<")) {
            const threshold = parseFloat(scoreCondition.substring(1));
            if (!(context.operatorScore < threshold)) {
return false;
}
          } else if (scoreCondition.startsWith(">")) {
            const threshold = parseFloat(scoreCondition.substring(1));
            if (!(context.operatorScore > threshold)) {
return false;
}
          } else if (scoreCondition.startsWith("<=")) {
            const threshold = parseFloat(scoreCondition.substring(2));
            if (!(context.operatorScore <= threshold)) {
return false;
}
          } else if (scoreCondition.startsWith(">=")) {
            const threshold = parseFloat(scoreCondition.substring(2));
            if (!(context.operatorScore >= threshold)) {
return false;
}
          }
          break;

        case "domain":
          if (context.domain && context.domain !== value) {
return false;
}
          break;

        case "risk_level":
          if (context.riskLevel && context.riskLevel !== value) {
return false;
}
          break;

        case "is_sandbox":
          if (context.isSandboxMode !== value) {
return false;
}
          break;
      }
    }

    return true;
  }

  /**
   * Determine if one action is more restrictive than another
   */
  private isMoreRestrictive(
    newAction: GuardrailAction,
    currentAction: GuardrailAction
  ): boolean {
    const restrictionOrder: GuardrailAction[] = [
      "ALLOW",
      "COACH",
      "NOTIFY",
      "SIMULATE",
      "REQUIRE_QUORUM",
      "ESCALATE",
      "BLOCK",
    ];

    return (
      restrictionOrder.indexOf(newAction) >
      restrictionOrder.indexOf(currentAction)
    );
  }

  /**
   * Log guardrail evaluation
   */
  private async logEvaluation(
    context: GuardrailEvaluationContext,
    evaluatedRules: string[],
    finalAction: GuardrailAction,
    blockingRuleId?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("guardrail_evaluations").insert({
      organization_id: context.organizationId,
      operator_id: context.operatorId,
      proposal_id: context.proposalId,
      queue_item_id: context.queueItemId,
      domain: context.domain,
      risk_level: context.riskLevel,
      operator_score: context.operatorScore,
      evaluated_rules: evaluatedRules,
      final_action: finalAction,
      blocking_rule_id: blockingRuleId,
      evaluation_context: context,
    });
  }

  /**
   * Run execution in sandbox mode
   */
  async runSandboxSimulation(
    organizationId: string,
    operatorId: string,
    executionType: string,
    inputData: Record<string, unknown>,
    proposalId?: string,
    queueItemId?: string
  ): Promise<SandboxExecutionResult> {
    const supabase = await getSupabaseServer();

    // Simulate execution
    const simulatedResult = this.simulateExecution(executionType, inputData);

    // Record simulation
    const { data, error } = await supabase
      .from("sandbox_executions")
      .insert({
        organization_id: organizationId,
        operator_id: operatorId,
        proposal_id: proposalId,
        queue_item_id: queueItemId,
        execution_type: executionType,
        input_data: inputData,
        simulated_result: simulatedResult.result,
        would_have_succeeded: simulatedResult.success,
        simulated_side_effects: simulatedResult.sideEffects,
        insights: simulatedResult.insights,
        warnings: simulatedResult.warnings,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record simulation: ${error.message}`);
    }

    // Log to feedback events
    await supabase.from("feedback_events").insert({
      organization_id: organizationId,
      event_type: "SANDBOX_SIMULATION",
      actor_id: operatorId,
      metadata: {
        execution_type: executionType,
        would_have_succeeded: simulatedResult.success,
        insights_count: simulatedResult.insights.length,
      },
    });

    return {
      id: data.id,
      simulatedResult: simulatedResult.result,
      wouldHaveSucceeded: simulatedResult.success,
      simulatedSideEffects: simulatedResult.sideEffects,
      insights: simulatedResult.insights,
      warnings: simulatedResult.warnings,
    };
  }

  /**
   * Simulate an execution (mock implementation)
   */
  private simulateExecution(
    executionType: string,
    inputData: Record<string, unknown>
  ): {
    result: Record<string, unknown>;
    success: boolean;
    sideEffects: Record<string, unknown>[];
    insights: string[];
    warnings: string[];
  } {
    const insights: string[] = [];
    const warnings: string[] = [];
    const sideEffects: Record<string, unknown>[] = [];

    // Basic simulation logic
    let success = true;

    switch (executionType) {
      case "EMAIL_SEND":
        insights.push("Email would be sent to specified recipients");
        sideEffects.push({
          type: "EMAIL_DELIVERED",
          recipients: inputData.recipients,
        });
        if (!inputData.subject || !inputData.body) {
          success = false;
          warnings.push("Missing required email fields");
        }
        break;

      case "CONTENT_PUBLISH":
        insights.push("Content would be published to specified channel");
        sideEffects.push({
          type: "CONTENT_LIVE",
          channel: inputData.channel,
        });
        if (inputData.content && (inputData.content as string).length < 100) {
          warnings.push("Content may be too short for optimal engagement");
        }
        break;

      case "DATA_UPDATE":
        insights.push("Database records would be updated");
        sideEffects.push({
          type: "RECORDS_MODIFIED",
          count: inputData.recordCount || 1,
        });
        break;

      default:
        insights.push(`${executionType} would execute with provided parameters`);
    }

    return {
      result: {
        type: executionType,
        status: success ? "SIMULATED_SUCCESS" : "SIMULATED_FAILURE",
        timestamp: new Date().toISOString(),
      },
      success,
      sideEffects,
      insights,
      warnings,
    };
  }

  /**
   * Get coaching hints for an operator in a context
   */
  async getCoachingHints(
    organizationId: string,
    operatorId: string,
    contextType: "APPROVAL_QUEUE" | "REVIEW_THREAD" | "DASHBOARD" | "EXECUTION",
    proposalId?: string,
    queueItemId?: string
  ): Promise<CoachingHint[]> {
    // Get operator score
    const supabase = await getSupabaseServer();
    const { data: score } = await supabase
      .from("reviewer_scores")
      .select("reliability_score, accuracy_score")
      .eq("operator_id", operatorId)
      .eq("organization_id", organizationId)
      .single();

    // Get applicable rules
    const context: GuardrailEvaluationContext = {
      operatorId,
      organizationId,
      operatorScore: score?.reliability_score,
      proposalId,
      queueItemId,
    };

    const result = await this.evaluateGuardrails(context);

    // Record shown hints
    for (const hint of result.coachingHints) {
      await supabase.from("coaching_hints").insert({
        organization_id: organizationId,
        operator_id: operatorId,
        rule_id: hint.ruleId,
        context_type: contextType,
        hint_type: hint.type,
        message: hint.message,
        severity: hint.severity,
        related_proposal_id: proposalId,
        related_queue_item_id: queueItemId,
      });
    }

    return result.coachingHints;
  }

  /**
   * Record hint feedback
   */
  async recordHintFeedback(
    hintId: string,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from("coaching_hints")
      .update({
        was_dismissed: true,
        dismissed_at: new Date().toISOString(),
        was_helpful: wasHelpful,
        feedback,
      })
      .eq("id", hintId);
  }

  /**
   * Get sandbox execution history
   */
  async getSandboxHistory(
    organizationId: string,
    operatorId?: string,
    limit: number = 50
  ): Promise<SandboxExecutionResult[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("sandbox_executions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (operatorId) {
      query = query.eq("operator_id", operatorId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get sandbox history: ${error.message}`);
    }

    return (data || []).map((d) => ({
      id: d.id,
      simulatedResult: d.simulated_result,
      wouldHaveSucceeded: d.would_have_succeeded,
      simulatedSideEffects: d.simulated_side_effects,
      insights: d.insights,
      warnings: d.warnings,
    }));
  }
}

export default GuardrailPolicyService;
