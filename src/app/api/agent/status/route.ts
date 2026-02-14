/**
 * GET /api/agent/status
 * Returns status of a plan, its steps, and the real-time execution log
 * Rate limited: 20 requests/minute
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const planId = req.nextUrl.searchParams.get("planId");
    const runId = req.nextUrl.searchParams.get("runId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
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
        { error: "Only workspace owners can view agent status" },
        { status: 403 }
      );
    }

    // If no planId or runId, return aggregate stats for the workspace
    if (!planId && !runId) {
      const [plansResult, runsResult] = await Promise.all([
        supabase
          .from("agent_execution_plans")
          .select("id, status, objective, created_at, complexity_score, confidence_score, risk_score")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("agent_runs")
          .select("id, status, plan_id, total_steps, completed_steps, failed_steps, skipped_steps, created_at, completed_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const plans = plansResult.data || [];
      const runs = runsResult.data || [];

      return NextResponse.json({
        success: true,
        workspace_id: workspaceId,
        aggregate: {
          totalPlans: plans.length,
          pendingApproval: plans.filter((p) => p.status === "pending_approval").length,
          runningExecutions: runs.filter((r) => r.status === "running").length,
          completedPlans: plans.filter((p) => p.status === "completed").length,
          approvedPlans: plans.filter((p) => p.status === "approved").length,
          failedPlans: plans.filter((p) => p.status === "failed").length,
        },
        recentPlans: plans.slice(0, 10),
        recentRuns: runs.slice(0, 10),
      });
    }

    // Get plan details if planId provided
    let planDetails = null;
    if (planId) {
      const { data: plan, error: planError } = await supabase
        .from("agent_execution_plans")
        .select("*")
        .eq("id", planId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (!planError && plan) {
        planDetails = plan;
      }
    }

    // Get run details if runId provided
    let runDetails = null;
    if (runId) {
      const { data: run, error: runError } = await supabase
        .from("agent_runs")
        .select("*")
        .eq("id", runId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (!runError && run) {
        runDetails = run;
      }
    }

    // Get execution steps
    let steps = [];
    if (planId) {
      const { data: stepsData, error: stepsError } = await supabase
        .from("agent_execution_steps")
        .select("*")
        .eq("plan_id", planId)
        .order("step_number", { ascending: true });

      if (!stepsError && stepsData) {
        steps = stepsData;
      }
    }

    // Get activity log
    let activityLog = [];
    if (planId) {
      const { data: logs, error: logsError } = await supabase
        .from("auditLogs")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!logsError && logs) {
        // Filter logs related to this plan
        activityLog = logs.filter((log) =>
          log.details?.plan_id === planId || log.action?.includes("agent")
        );
      }
    }

    // Get risk assessment
    let riskAssessment = null;
    if (planId) {
      const { data: risk, error: riskError } = await supabase
        .from("agent_risk_assessments")
        .select("*")
        .eq("plan_id", planId)
        .maybeSingle();

      if (!riskError && risk) {
        riskAssessment = risk;
      }
    }

    // Get uncertainty notes
    let uncertaintyNotes = [];
    if (planId) {
      const { data: notes, error: notesError } = await supabase
        .from("agent_uncertainty_notes")
        .select("*")
        .eq("plan_id", planId);

      if (!notesError && notes) {
        uncertaintyNotes = notes;
      }
    }

    // Calculate summary statistics
    const summary = {
      total_steps: steps.length,
      completed_steps: steps.filter((s) => s.status === "completed").length,
      failed_steps: steps.filter((s) => s.status === "failed").length,
      skipped_steps: steps.filter((s) => s.status === "skipped").length,
      pending_steps: steps.filter((s) => s.status === "pending").length,
      running_steps: steps.filter((s) => s.status === "running").length,
      total_execution_time_ms: steps.reduce(
        (sum, s) => sum + (s.execution_time_ms || 0),
        0
      ),
      success_rate:
        steps.length > 0
          ? ((steps.filter((s) => s.status === "completed").length /
              steps.length) *
              100).toFixed(2) + "%"
          : "N/A",
    };

    return NextResponse.json({
      success: true,
      workspace_id: workspaceId,
      plan: planDetails,
      run: runDetails,
      summary,
      steps: steps.map((step) => ({
        step_number: step.step_number,
        action_type: step.action_type,
        description: step.description,
        status: step.status,
        promised_outcome: step.promised_outcome,
        actual_outcome: step.actual_outcome,
        outcome_mismatch: step.outcome_mismatch,
        execution_time_ms: step.execution_time_ms,
        error_message: step.error_message,
        created_at: step.created_at,
        started_at: step.started_at,
        finished_at: step.finished_at,
      })),
      risk_assessment: riskAssessment,
      uncertainty_notes: uncertaintyNotes,
      activity_log: activityLog.slice(0, 20), // Last 20 activities
    });
  } catch (error) {
    console.error("Error in GET /api/agent/status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
