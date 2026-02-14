/**
 * POST /api/agent/plan
 * Generates an autonomous agent plan from a user objective
 * Rate limited: 5 requests/minute
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { AgentPlanner } from "@/lib/agents/agentPlanner";
import { AgentSafety, createAgentSafety } from "@/lib/agents/agentSafety";
import { AgentArchiveBridge, createAgentArchiveBridge } from "@/lib/agents/agentArchiveBridge";
import { hookSystem, lifecycleManager, ensureWorkforceReady } from "@/lib/agents/workforce";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
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

    // Get request body
    const { workspaceId, objective, constraints, maxSteps, allowApprovalCommands } =
      await req.json();

    if (!workspaceId || !objective) {
      return NextResponse.json(
        { error: "workspaceId and objective are required" },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("org_id")
      .eq("id", workspaceId)
      .maybeSingle();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verify user is owner
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", workspace.org_id)
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can create agent plans" },
        { status: 403 }
      );
    }

    // Ensure workforce engine is initialized (lazy, runs once)
    await ensureWorkforceReady(workspaceId);

    // Run workforce pre-execution hooks (safety, permissions, rate-limit)
    const hookResult = await hookSystem.execute('pre-execution', {
      agentId: 'orchestrator',
      workspaceId,
      action: `plan:${objective}`,
      inputs: { objective, constraints, maxSteps },
      hookChain: [],
      timestamp: new Date().toISOString(),
      correlationId: `plan-${Date.now()}`,
    });

    if (!hookResult.shouldProceed) {
      const blockReasons = hookResult.results
        .filter((r) => r.action === 'block')
        .map((r) => r.reason);
      return NextResponse.json(
        { error: "Workforce hooks blocked plan generation", reasons: blockReasons },
        { status: 403 }
      );
    }

    // Spawn orchestrator agent in lifecycle manager
    try {
      await lifecycleManager.spawn('orchestrator');
    } catch {
      // May already be spawned
    }

    // Generate plan using AgentPlanner
    const planner = new AgentPlanner();
    const planResult = await planner.generatePlan({
      objective,
      workspaceId,
      constraints,
      maxSteps,
      allowApprovalCommands,
    });

    // Validate plan safety
    const safety = createAgentSafety(workspaceId);
    const safetyResult = await safety.validatePlan(planResult.plan);

    if (!safetyResult.valid && safetyResult.blocked_steps.length > 0) {
      return NextResponse.json(
        {
          error: "Plan contains blocked commands",
          errors: safetyResult.errors,
          blocked_steps: safetyResult.blocked_steps,
        },
        { status: 400 }
      );
    }

    // Create plan in database
    const { data: insertedPlan, error: insertError } = await supabase
      .from("agent_execution_plans")
      .insert({
        workspace_id: workspaceId,
        agent_name: "synthex",
        objective,
        plan: planResult.plan,
        reasoning_trace: planResult.plan.reasoning_trace,
        complexity_score: planResult.complexity_score,
        confidence_score: planResult.confidence_score,
        risk_score: safetyResult.risk_score,
        status: safetyResult.requires_approval ? "pending_approval" : "approved",
      })
      .select("id")
      .maybeSingle();

    if (insertError || !insertedPlan) {
      console.error("Error creating plan:", insertError);
      return NextResponse.json(
        { error: "Failed to create plan" },
        { status: 500 }
      );
    }

    const planId = insertedPlan.id;

    // Create risk assessment
    await supabase.from("agent_risk_assessments").insert({
      plan_id: planId,
      workspace_id: workspaceId,
      risk_score: safetyResult.risk_score,
      risk_factors: safetyResult.risk_factors,
      risk_summary: `Plan has ${safetyResult.risk_factors.length} risk factors. Approval required: ${safetyResult.requires_approval}`,
      requires_founder_approval: safetyResult.requires_approval,
      approval_status: safetyResult.requires_approval ? "pending" : "auto_approved",
    });

    // Create execution steps
    for (const step of planResult.plan.steps) {
      await supabase.from("agent_execution_steps").insert({
        plan_id: planId,
        step_number: step.step_number,
        action_type: step.action_type,
        command: step.command,
        description: step.description,
        promised_outcome: step.promised_outcome,
        status: "pending",
      });
    }

    // Log to archive
    const archive = createAgentArchiveBridge(workspaceId, userId);
    await archive.logPlanCreated(
      planId,
      objective,
      planResult.plan,
      planResult.plan.reasoning_trace || "",
      planResult.complexity_score,
      planResult.confidence_score
    );

    return NextResponse.json({
      success: true,
      plan_id: planId,
      objective,
      plan: planResult.plan,
      complexity_score: planResult.complexity_score,
      confidence_score: planResult.confidence_score,
      safety_validation: {
        valid: safetyResult.valid,
        risk_score: safetyResult.risk_score,
        requires_approval: safetyResult.requires_approval,
        warnings: safetyResult.warnings,
        risk_factors: safetyResult.risk_factors,
      },
      status: safetyResult.requires_approval ? "pending_approval" : "approved",
    });
  } catch (error) {
    console.error("Error in POST /api/agent/plan:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
