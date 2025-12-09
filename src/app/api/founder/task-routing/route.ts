/**
 * @fileoverview F02 Autonomous Task Routing API
 * GET: List tasks, get queue summary
 * POST: Enqueue task, assign task, update status
 */

import { NextRequest, NextResponse } from "next/server";
import {
  enqueueTask,
  assignTask,
  updateTaskStatus,
  listTasks,
  getQueueSummary,
} from "@/src/lib/founder/taskRoutingService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get("workspaceId");
    const action = searchParams.get("action");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    // Summary action
    if (action === "summary") {
      const summary = await getQueueSummary(workspaceId);
      return NextResponse.json({ summary });
    }

    // Default: List tasks
    const status = searchParams.get("status") as any;
    const assignedTo = searchParams.get("assignedTo") as any;
    const taskType = searchParams.get("taskType") as any;
    const limit = parseInt(searchParams.get("limit") || "500");

    const tasks = await listTasks(workspaceId, {
      status,
      assignedTo,
      taskType,
      limit,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("[task-routing] GET error:", error);
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

    const body = await req.json();

    // Assign task
    if (action === "assign") {
      await assignTask({
        taskId: body.taskId,
        assignedTo: body.assignedTo,
        assignedEntity: body.assignedEntity,
      });
      return NextResponse.json({ success: true });
    }

    // Update status
    if (action === "update-status") {
      await updateTaskStatus({
        taskId: body.taskId,
        status: body.status,
        result: body.result,
      });
      return NextResponse.json({ success: true });
    }

    // Default: Enqueue task
    const taskId = await enqueueTask({
      tenantId: workspaceId,
      taskCode: body.taskCode,
      taskTitle: body.taskTitle,
      taskType: body.taskType,
      priority: body.priority,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      metadata: body.metadata,
    });

    return NextResponse.json({ taskId });
  } catch (error: any) {
    console.error("[task-routing] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
