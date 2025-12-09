/**
 * E35: Remediation Engine API
 * GET: List remediation tasks
 * POST: Create new task or update status
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listRemediationTasks,
  createRemediationTask,
  updateRemediationStatus,
  linkRemediationTask,
  getRemediationSummary,
  getRemediationDetails,
} from "@/src/lib/founder/remediationService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");
    const taskId = searchParams.get("taskId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Get remediation summary
    if (action === "summary") {
      const summary = await getRemediationSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Get single task with details
    if (action === "details" && taskId) {
      const details = await getRemediationDetails(taskId);
      return NextResponse.json(details);
    }

    // List remediation tasks
    const status = searchParams.get("status") as any;
    const source = searchParams.get("source") as any;
    const priority = searchParams.get("priority") as any;

    const items = await listRemediationTasks(workspaceId, {
      status,
      source,
      priority,
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[remediation] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Update task status
    if (action === "update-status") {
      const { taskId, status } = body;
      if (!taskId || !status) {
        return NextResponse.json(
          { error: "taskId and status required" },
          { status: 400 }
        );
      }
      await updateRemediationStatus(taskId, status);
      return NextResponse.json({ success: true });
    }

    // Link task to entity
    if (action === "link-entity") {
      const { taskId, entityType, entityId, metadata } = body;
      if (!taskId || !entityType || !entityId) {
        return NextResponse.json(
          { error: "taskId, entityType, and entityId required" },
          { status: 400 }
        );
      }
      const linkId = await linkRemediationTask(taskId, entityType, entityId, metadata);
      return NextResponse.json({ linkId });
    }

    // Create new remediation task
    const { source, title, description, priority, suggestedDue, assignedTo } = body;
    if (!source || !title) {
      return NextResponse.json(
        { error: "source and title required" },
        { status: 400 }
      );
    }

    const taskId = await createRemediationTask({
      tenantId: workspaceId,
      source,
      title,
      description,
      priority,
      suggestedDue,
      assignedTo,
    });

    return NextResponse.json({ taskId });
  } catch (error: any) {
    console.error("[remediation] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
