/**
 * POST /api/autonomy/queue
 * Phase 7: Queue Autonomy Tasks
 *
 * Adds audit or snapshot task to BullMQ with priority.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const VALID_TASKS = ["onboarding", "snapshot", "geo", "full_audit"] as const;
type TaskType = typeof VALID_TASKS[number];

export async function POST(req: NextRequest) {
  try {
    // Authentication
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

    // Parse request body
    const body = await req.json();
    const { clientId, task, priority } = body;

    // Validate required fields
    if (!clientId || !task) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, task" },
        { status: 400 }
      );
    }

    // Validate task type
    if (!VALID_TASKS.includes(task as TaskType)) {
      return NextResponse.json(
        { error: `Invalid task. Must be one of: ${VALID_TASKS.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Get client profile
    const { data: client, error: fetchError } = await supabase
      .from("seo_client_profiles")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Determine priority based on tier and task type
    let taskPriority = priority || 5; // Default priority

    if (task === "onboarding") {
      taskPriority = 1; // Highest priority for onboarding
    } else if (client.subscription_tier === "Enterprise") {
      taskPriority = 2;
    } else if (client.subscription_tier === "Pro") {
      taskPriority = 3;
    } else if (client.subscription_tier === "Starter") {
      taskPriority = 4;
    }

    // Create queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from("autonomy_queue")
      .insert({
        client_id: clientId,
        task_type: task,
        priority: taskPriority,
        status: "queued",
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .select("queue_id, task_type, priority, status")
      .single();

    if (queueError || !queueEntry) {
      console.error("[API /autonomy/queue] Queue error:", queueError);
      return NextResponse.json(
        { error: "Failed to add task to queue" },
        { status: 500 }
      );
    }

    // Log the queue operation
    await supabase.from("client_storage_audit").insert({
      client_id: clientId,
      action: "autonomy_queued",
      metadata: {
        queue_id: queueEntry.queue_id,
        task_type: task,
        priority: taskPriority,
        queued_by: userId,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      queueId: queueEntry.queue_id,
      clientId,
      task: queueEntry.task_type,
      priority: queueEntry.priority,
      status: queueEntry.status,
      message: "Task added to autonomy queue successfully",
    });
  } catch (error) {
    console.error("[API /autonomy/queue] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
