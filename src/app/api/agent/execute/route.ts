/**
 * POST /api/agent/execute
 * Executes an approved agent plan safely through Synthex Desktop Agent Hooks
 * Rate limited: 5 requests/minute
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { AgentExecutor, createAgentExecutor } from "@/lib/agents/agentExecutor";
import { AgentArchiveBridge, createAgentArchiveBridge } from "@/lib/agents/agentArchiveBridge";
import { hookSystem, lifecycleManager, memoryManager, ensureWorkforceReady } from "@/lib/agents/workforce";

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

    // Ensure workforce engine is initialized (lazy, runs once)
    await ensureWorkforceReady(workspaceId);

    // Run workforce pre-execution hooks
    const hookResult = await hookSystem.execute('pre-execution', {
      agentId: 'orchestrator',
      workspaceId,
      action: `execute:${plan.objective || planId}`,
      inputs: { planId, objective: plan.objective, stepCount: plan.plan.steps.length },
      hookChain: [],
      timestamp: new Date().toISOString(),
      correlationId: runId,
    });

    if (!hookResult.shouldProceed) {
      const blockReasons = hookResult.results
        .filter((r) => r.action === 'block')
        .map((r) => r.reason);
      return NextResponse.json(
        { error: "Workforce hooks blocked execution", reasons: blockReasons },
        { status: 403 }
      );
    }

    // Spawn orchestrator in lifecycle manager
    try {
      await lifecycleManager.spawn('orchestrator');
      lifecycleManager.startTask('orchestrator', runId, runId);
    } catch {
      // May already be spawned or at capacity
    }

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

        // Complete task in lifecycle manager
        try {
          lifecycleManager.completeTask(
            'orchestrator',
            runId,
            executionState.status === 'completed',
            executionState.completed_at
              ? new Date(executionState.completed_at).getTime() - Date.now()
              : 0
          );
        } catch {
          // Best-effort lifecycle tracking
        }

        // Store execution result in workforce memory
        try {
          await memoryManager.set({
            scope: 'workspace',
            workspaceId,
            key: `execution:${planId}`,
            value: {
              planId,
              runId,
              objective: plan.objective,
              status: executionState.status,
              completedSteps: executionState.completed_steps,
              failedSteps: executionState.failed_steps,
              completedAt: executionState.completed_at,
            },
            importance: 70,
          });
        } catch {
          // Memory storage is best-effort
        }

        // Run post-execution hooks
        await hookSystem.execute('post-execution', {
          agentId: 'orchestrator',
          workspaceId,
          action: `execute:${plan.objective || planId}`,
          inputs: { executionState, planId, runId },
          hookChain: [],
          timestamp: new Date().toISOString(),
          correlationId: runId,
        });
      })
      .catch(async (error) => {
        console.error("Error executing plan:", error);
        supabase
          .from("agent_runs")
          .update({
            status: "failed",
            last_error: error.message,
          })
          .eq("id", runId);

        // Complete task as failed in lifecycle
        try {
          lifecycleManager.completeTask('orchestrator', runId, false, 0);
        } catch {
          // Best-effort
        }
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
