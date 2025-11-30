/**
 * POST /api/agent/execute
 * Executes an approved agent plan safely through Synthex Desktop Agent Hooks
 * Rate limited: 5 requests/minute
 */

// Route segment config for Vercel
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { AgentExecutor, createAgentExecutor } from "@/lib/agents/agentExecutor";
import { AgentArchiveBridge, createAgentArchiveBridge } from "@/lib/agents/agentArchiveBridge";

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
    const { workspaceId, planId, dryRun } = await req.json();

    if (!workspaceId || !planId) {
      return NextResponse.json(
        { error: "workspaceId and planId are required" },
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
        { error: "Only workspace owners can execute agent plans" },
        { status: 403 }
      );
    }

    // Fetch plan
    const { data: plan, error: planError } = await supabase
      .from("agent_execution_plans")
      .select("*")
      .eq("id", planId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check plan approval status
    if (!dryRun && plan.status === "pending_approval") {
      return NextResponse.json(
        { error: "Plan requires founder approval before execution" },
        { status: 403 }
      );
    }

    // Check approval status
    const { data: riskAssessment } = await supabase
      .from("agent_risk_assessments")
      .select("approval_status")
      .eq("plan_id", planId)
      .maybeSingle();

    if (
      !dryRun &&
      riskAssessment?.approval_status === "rejected"
    ) {
      return NextResponse.json(
        { error: "Plan has been rejected" },
        { status: 403 }
      );
    }

    // Create execution run
    const { data: run, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        plan_id: planId,
        workspace_id: workspaceId,
        status: "running",
        total_steps: plan.plan.steps.length,
      })
      .select("id")
      .maybeSingle();

    if (runError || !run) {
      return NextResponse.json(
        { error: "Failed to create execution run" },
        { status: 500 }
      );
    }

    const runId = run.id;

    // Update plan status
    await supabase
      .from("agent_execution_plans")
      .update({ status: "running" })
      .eq("id", planId);

    // Log execution started
    const archive = createAgentArchiveBridge(workspaceId, userId);
    await archive.logPlanExecutionStarted(planId, runId, plan.plan);

    // Execute plan
    const executor = createAgentExecutor(
      workspaceId,
      runId,
      planId,
      plan.plan,
      {
        dryRun,
        stopOnFirstFailure: false,
      }
    );

    // Start execution (don't wait for completion)
    executor
      .execute()
      .then(async (executionState) => {
        // Log completion
        await archive.logPlanExecutionCompleted(
          planId,
          runId,
          executionState
        );

        // Update run with final stats
        await supabase
          .from("agent_runs")
          .update({
            status: executionState.status,
            completed_steps: executionState.completed_steps,
            failed_steps: executionState.failed_steps,
            skipped_steps: executionState.skipped_steps,
            completed_at: executionState.completed_at,
          })
          .eq("id", runId);
      })
      .catch((error) => {
        console.error("Error executing plan:", error);
        supabase
          .from("agent_runs")
          .update({
            status: "failed",
            last_error: error.message,
          })
          .eq("id", runId);
      });

    // Return immediate response
    return NextResponse.json({
      success: true,
      run_id: runId,
      plan_id: planId,
      status: "execution_started",
      message: "Plan execution started. Use /api/agent/status to monitor progress.",
    });
  } catch (error) {
    console.error("Error in POST /api/agent/execute:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
