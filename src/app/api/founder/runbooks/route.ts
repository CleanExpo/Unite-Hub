/**
 * /api/founder/runbooks
 *
 * Runbook & Playbook Center API (Phase E30)
 * GET: List runbooks, steps, assignments, or get status
 * POST: Create runbook, add step, assign runbook, update step execution
 * PUT: Update runbook, step, or assignment
 * DELETE: Delete runbook or step
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { hasPermission } from "@/lib/core/permissionService";
import * as runbookService from "@/lib/founder/runbookService";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canView = await hasPermission(user.id, workspaceId, "settings", "read");
    if (!canView) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // List runbooks (default action)
    if (!action || action === "list") {
      const category = searchParams.get("category") as runbookService.RunbookCategory | null;
      const isTemplate = searchParams.get("isTemplate");
      const runbooks = await runbookService.listRunbooks(
        workspaceId,
        category || undefined,
        isTemplate !== null ? isTemplate === "true" : undefined
      );
      return NextResponse.json({ runbooks });
    }

    // Get single runbook
    if (action === "get") {
      const runbookId = searchParams.get("runbookId");
      if (!runbookId) {
        return NextResponse.json({ error: "runbookId required" }, { status: 400 });
      }
      const runbook = await runbookService.getRunbook(runbookId);
      if (!runbook) {
        return NextResponse.json({ error: "Runbook not found" }, { status: 404 });
      }
      return NextResponse.json({ runbook });
    }

    // List runbook steps
    if (action === "list-steps") {
      const runbookId = searchParams.get("runbookId");
      if (!runbookId) {
        return NextResponse.json({ error: "runbookId required" }, { status: 400 });
      }
      const steps = await runbookService.listRunbookSteps(runbookId);
      return NextResponse.json({ steps });
    }

    // List assignments
    if (action === "list-assignments") {
      const status = searchParams.get("status") as runbookService.RunbookAssignmentStatus | null;
      const assignedTo = searchParams.get("assignedTo");
      const assignments = await runbookService.listRunbookAssignments(
        workspaceId,
        status || undefined,
        assignedTo || undefined
      );
      return NextResponse.json({ assignments });
    }

    // Get assignment status
    if (action === "get-status") {
      const assignmentId = searchParams.get("assignmentId");
      if (!assignmentId) {
        return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
      }
      const status = await runbookService.getRunbookStatus(assignmentId);
      return NextResponse.json({ status });
    }

    // List step executions
    if (action === "list-executions") {
      const assignmentId = searchParams.get("assignmentId");
      if (!assignmentId) {
        return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
      }
      const executions = await runbookService.listStepExecutions(assignmentId);
      return NextResponse.json({ executions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/runbooks GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Create runbook
    if (action === "create-runbook") {
      const { category, title, description, isTemplate, estimatedDurationMinutes, tags } = body;
      if (!category || !title) {
        return NextResponse.json(
          { error: "category and title required" },
          { status: 400 }
        );
      }
      const runbookId = await runbookService.createRunbook({
        tenantId: workspaceId,
        category,
        title,
        description,
        createdBy: user.id,
        isTemplate,
        estimatedDurationMinutes,
        tags,
      });
      return NextResponse.json({ runbookId });
    }

    // Create runbook step
    if (action === "create-step") {
      const {
        runbookId,
        stepOrder,
        title,
        description,
        actionType,
        estimatedMinutes,
        dependencies,
        config,
      } = body;
      if (!runbookId || stepOrder === undefined || !title) {
        return NextResponse.json(
          { error: "runbookId, stepOrder, and title required" },
          { status: 400 }
        );
      }
      const stepId = await runbookService.createRunbookStep({
        runbookId,
        stepOrder,
        title,
        description,
        actionType,
        estimatedMinutes,
        dependencies,
        config,
      });
      return NextResponse.json({ stepId });
    }

    // Assign runbook
    if (action === "assign-runbook") {
      const { runbookId, assignedTo, context } = body;
      if (!runbookId || !assignedTo) {
        return NextResponse.json(
          { error: "runbookId and assignedTo required" },
          { status: 400 }
        );
      }
      const assignmentId = await runbookService.assignRunbook({
        tenantId: workspaceId,
        runbookId,
        assignedTo,
        assignedBy: user.id,
        context,
      });
      return NextResponse.json({ assignmentId });
    }

    // Update assignment status
    if (action === "update-assignment-status") {
      const { assignmentId, status } = body;
      if (!assignmentId || !status) {
        return NextResponse.json(
          { error: "assignmentId and status required" },
          { status: 400 }
        );
      }
      await runbookService.updateAssignmentStatus(assignmentId, status);
      return NextResponse.json({ success: true });
    }

    // Execute step
    if (action === "execute-step") {
      const { executionId, status, notes, result } = body;
      if (!executionId || !status) {
        return NextResponse.json(
          { error: "executionId and status required" },
          { status: 400 }
        );
      }
      await runbookService.executeRunbookStep({
        executionId,
        status,
        executedBy: user.id,
        notes,
        result,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/runbooks POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Update runbook
    if (action === "update-runbook") {
      const { runbookId, updates } = body;
      if (!runbookId || !updates) {
        return NextResponse.json(
          { error: "runbookId and updates required" },
          { status: 400 }
        );
      }
      await runbookService.updateRunbook(runbookId, updates);
      return NextResponse.json({ success: true });
    }

    // Update step
    if (action === "update-step") {
      const { stepId, updates } = body;
      if (!stepId || !updates) {
        return NextResponse.json(
          { error: "stepId and updates required" },
          { status: 400 }
        );
      }
      await runbookService.updateRunbookStep(stepId, updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/runbooks PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const canWrite = await hasPermission(user.id, workspaceId, "settings", "write");
    if (!canWrite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete runbook
    if (action === "delete-runbook") {
      const runbookId = searchParams.get("runbookId");
      if (!runbookId) {
        return NextResponse.json({ error: "runbookId required" }, { status: 400 });
      }
      await runbookService.deleteRunbook(runbookId);
      return NextResponse.json({ success: true });
    }

    // Delete step
    if (action === "delete-step") {
      const stepId = searchParams.get("stepId");
      if (!stepId) {
        return NextResponse.json({ error: "stepId required" }, { status: 400 });
      }
      await runbookService.deleteRunbookStep(stepId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] /founder/runbooks DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
