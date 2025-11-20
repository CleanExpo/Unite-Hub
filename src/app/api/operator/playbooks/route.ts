/**
 * Operator Playbooks API - Phase 10 Week 7-8
 *
 * CRUD operations for playbooks, rules, and assignments.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { GuardrailPolicyService } from "@/lib/operator/guardrailPolicyService";
import { z } from "zod";

const guardrailService = new GuardrailPolicyService();

// Validation schemas
const createPlaybookSchema = z.object({
  action: z.literal("create_playbook"),
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().optional(),
  risk_level: z.enum(["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]).optional(),
});

const updatePlaybookSchema = z.object({
  action: z.literal("update_playbook"),
  playbook_id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
  risk_level: z.enum(["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

const createRuleSchema = z.object({
  action: z.literal("create_rule"),
  playbook_id: z.string().uuid(),
  rule_name: z.string().min(1),
  rule_type: z.enum(["GUARDRAIL", "COACHING", "AUTOMATION", "ESCALATION", "VALIDATION"]),
  conditions: z.record(z.unknown()).optional(),
  rule_action: z.enum(["ALLOW", "BLOCK", "REQUIRE_QUORUM", "SIMULATE", "ESCALATE", "NOTIFY", "COACH"]),
  action_params: z.record(z.unknown()).optional(),
  coaching_message: z.string().optional(),
  coaching_severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  priority: z.number().optional(),
});

const updateRuleSchema = z.object({
  action: z.literal("update_rule"),
  rule_id: z.string().uuid(),
  rule_name: z.string().min(1).optional(),
  conditions: z.record(z.unknown()).optional(),
  rule_action: z.enum(["ALLOW", "BLOCK", "REQUIRE_QUORUM", "SIMULATE", "ESCALATE", "NOTIFY", "COACH"]).optional(),
  action_params: z.record(z.unknown()).optional(),
  coaching_message: z.string().optional(),
  coaching_severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  priority: z.number().optional(),
  is_active: z.boolean().optional(),
});

const assignPlaybookSchema = z.object({
  action: z.literal("assign_playbook"),
  playbook_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  assignment_type: z.enum(["ROLE", "USER", "TEAM"]),
  target_role: z.enum(["OWNER", "MANAGER", "ANALYST"]).optional(),
  target_user_id: z.string().uuid().optional(),
  target_team_id: z.string().uuid().optional(),
});

const evaluateGuardrailsSchema = z.object({
  action: z.literal("evaluate"),
  organization_id: z.string().uuid(),
  domain: z.string().optional(),
  risk_level: z.enum(["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]).optional(),
  proposal_id: z.string().uuid().optional(),
  queue_item_id: z.string().uuid().optional(),
  is_sandbox_mode: z.boolean().optional(),
});

const runSandboxSchema = z.object({
  action: z.literal("run_sandbox"),
  organization_id: z.string().uuid(),
  execution_type: z.string(),
  input_data: z.record(z.unknown()),
  proposal_id: z.string().uuid().optional(),
  queue_item_id: z.string().uuid().optional(),
});

const hintFeedbackSchema = z.object({
  action: z.literal("hint_feedback"),
  hint_id: z.string().uuid(),
  was_helpful: z.boolean(),
  feedback: z.string().optional(),
});

/**
 * GET /api/operator/playbooks
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "playbooks";
    const organizationId = searchParams.get("organization_id");
    const playbookId = searchParams.get("playbook_id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organization_id is required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    switch (type) {
      case "playbooks": {
        const { data, error } = await supabase
          .from("operator_playbooks")
          .select("*")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: false });

        if (error) {
          throw new Error(`Failed to get playbooks: ${error.message}`);
        }
        return NextResponse.json({ playbooks: data });
      }

      case "rules": {
        if (!playbookId) {
          return NextResponse.json(
            { error: "playbook_id is required for rules" },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from("playbook_rules")
          .select("*")
          .eq("playbook_id", playbookId)
          .order("priority", { ascending: false });

        if (error) {
          throw new Error(`Failed to get rules: ${error.message}`);
        }
        return NextResponse.json({ rules: data });
      }

      case "assignments": {
        const { data, error } = await supabase
          .from("playbook_assignments")
          .select("*, operator_playbooks(name)")
          .eq("organization_id", organizationId)
          .eq("is_active", true);

        if (error) {
          throw new Error(`Failed to get assignments: ${error.message}`);
        }
        return NextResponse.json({ assignments: data });
      }

      case "evaluations": {
        const { data, error } = await supabase
          .from("guardrail_evaluations")
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          throw new Error(`Failed to get evaluations: ${error.message}`);
        }
        return NextResponse.json({ evaluations: data });
      }

      case "sandbox_history": {
        const history = await guardrailService.getSandboxHistory(
          organizationId,
          searchParams.get("operator_id") || undefined
        );
        return NextResponse.json({ history });
      }

      case "coaching_hints": {
        const contextType = searchParams.get("context_type") as
          | "APPROVAL_QUEUE"
          | "REVIEW_THREAD"
          | "DASHBOARD"
          | "EXECUTION";

        const hints = await guardrailService.getCoachingHints(
          organizationId,
          userId,
          contextType || "DASHBOARD",
          searchParams.get("proposal_id") || undefined,
          searchParams.get("queue_item_id") || undefined
        );

        return NextResponse.json({ hints });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Playbooks GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/operator/playbooks
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action } = body;
    const supabase = await getSupabaseServer();

    switch (action) {
      case "create_playbook": {
        const parsed = createPlaybookSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from("operator_playbooks")
          .insert({
            organization_id: parsed.data.organization_id,
            name: parsed.data.name,
            description: parsed.data.description,
            domain: parsed.data.domain,
            risk_level: parsed.data.risk_level,
            created_by: userId,
            updated_by: userId,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create playbook: ${error.message}`);
        }

        return NextResponse.json({ playbook: data, message: "Playbook created" });
      }

      case "update_playbook": {
        const parsed = updatePlaybookSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const updateData: Record<string, unknown> = {
          updated_by: userId,
          updated_at: new Date().toISOString(),
        };

        if (parsed.data.name) updateData.name = parsed.data.name;
        if (parsed.data.description !== undefined)
          updateData.description = parsed.data.description;
        if (parsed.data.domain !== undefined) updateData.domain = parsed.data.domain;
        if (parsed.data.risk_level !== undefined)
          updateData.risk_level = parsed.data.risk_level;
        if (parsed.data.status) updateData.status = parsed.data.status;

        const { data, error } = await supabase
          .from("operator_playbooks")
          .update(updateData)
          .eq("id", parsed.data.playbook_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update playbook: ${error.message}`);
        }

        return NextResponse.json({ playbook: data, message: "Playbook updated" });
      }

      case "create_rule": {
        const parsed = createRuleSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from("playbook_rules")
          .insert({
            playbook_id: parsed.data.playbook_id,
            rule_name: parsed.data.rule_name,
            rule_type: parsed.data.rule_type,
            conditions: parsed.data.conditions || {},
            action: parsed.data.rule_action,
            action_params: parsed.data.action_params || {},
            coaching_message: parsed.data.coaching_message,
            coaching_severity: parsed.data.coaching_severity,
            priority: parsed.data.priority || 100,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create rule: ${error.message}`);
        }

        return NextResponse.json({ rule: data, message: "Rule created" });
      }

      case "update_rule": {
        const parsed = updateRuleSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (parsed.data.rule_name) updateData.rule_name = parsed.data.rule_name;
        if (parsed.data.conditions) updateData.conditions = parsed.data.conditions;
        if (parsed.data.rule_action) updateData.action = parsed.data.rule_action;
        if (parsed.data.action_params)
          updateData.action_params = parsed.data.action_params;
        if (parsed.data.coaching_message !== undefined)
          updateData.coaching_message = parsed.data.coaching_message;
        if (parsed.data.coaching_severity)
          updateData.coaching_severity = parsed.data.coaching_severity;
        if (parsed.data.priority !== undefined)
          updateData.priority = parsed.data.priority;
        if (parsed.data.is_active !== undefined)
          updateData.is_active = parsed.data.is_active;

        const { data, error } = await supabase
          .from("playbook_rules")
          .update(updateData)
          .eq("id", parsed.data.rule_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update rule: ${error.message}`);
        }

        return NextResponse.json({ rule: data, message: "Rule updated" });
      }

      case "delete_rule": {
        const { rule_id } = body;

        const { error } = await supabase
          .from("playbook_rules")
          .delete()
          .eq("id", rule_id);

        if (error) {
          throw new Error(`Failed to delete rule: ${error.message}`);
        }

        return NextResponse.json({ message: "Rule deleted" });
      }

      case "assign_playbook": {
        const parsed = assignPlaybookSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from("playbook_assignments")
          .insert({
            playbook_id: parsed.data.playbook_id,
            organization_id: parsed.data.organization_id,
            assignment_type: parsed.data.assignment_type,
            target_role: parsed.data.target_role,
            target_user_id: parsed.data.target_user_id,
            target_team_id: parsed.data.target_team_id,
            assigned_by: userId,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to assign playbook: ${error.message}`);
        }

        return NextResponse.json({
          assignment: data,
          message: "Playbook assigned",
        });
      }

      case "unassign_playbook": {
        const { assignment_id } = body;

        const { error } = await supabase
          .from("playbook_assignments")
          .update({ is_active: false })
          .eq("id", assignment_id);

        if (error) {
          throw new Error(`Failed to unassign playbook: ${error.message}`);
        }

        return NextResponse.json({ message: "Playbook unassigned" });
      }

      case "evaluate": {
        const parsed = evaluateGuardrailsSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const result = await guardrailService.evaluateGuardrails({
          operatorId: userId,
          organizationId: parsed.data.organization_id,
          domain: parsed.data.domain,
          riskLevel: parsed.data.risk_level,
          proposalId: parsed.data.proposal_id,
          queueItemId: parsed.data.queue_item_id,
          isSandboxMode: parsed.data.is_sandbox_mode,
        });

        return NextResponse.json({ result });
      }

      case "run_sandbox": {
        const parsed = runSandboxSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        const result = await guardrailService.runSandboxSimulation(
          parsed.data.organization_id,
          userId,
          parsed.data.execution_type,
          parsed.data.input_data,
          parsed.data.proposal_id,
          parsed.data.queue_item_id
        );

        return NextResponse.json({ result });
      }

      case "hint_feedback": {
        const parsed = hintFeedbackSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid request", details: parsed.error.errors },
            { status: 400 }
          );
        }

        await guardrailService.recordHintFeedback(
          parsed.data.hint_id,
          parsed.data.was_helpful,
          parsed.data.feedback
        );

        return NextResponse.json({ message: "Feedback recorded" });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Playbooks POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
