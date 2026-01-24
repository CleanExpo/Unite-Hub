/**
 * Time Entries API
 *
 * CRUD operations for time tracking entries.
 * Supports active timer management and time entry logging.
 */

import type { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { successResponse } from "@/lib/api-helpers";
import { withErrorBoundary, ValidationError, DatabaseError } from "@/lib/errors/boundaries";
import { apiRateLimit } from "@/lib/rate-limit";

export interface TimeEntry {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  billable: boolean;
  hourly_rate: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ActiveTimer {
  id: string;
  workspace_id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  started_at: string;
  description: string | null;
}

/**
 * GET /api/time-entries
 *
 * Fetch time entries and active timer for current user.
 *
 * Query Parameters:
 * - workspaceId (required): Workspace ID
 * - projectId: Filter by project
 * - startDate: Filter entries from date
 * - endDate: Filter entries to date
 * - limit: Max entries (default: 50)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const projectId = req.nextUrl.searchParams.get("projectId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10);

  if (!workspaceId) {
    throw new ValidationError("workspaceId parameter is required");
  }

  // Dev test mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const isTestMode = req.headers.get('x-test-mode') === 'true';

  let userId: string;
  let supabase;
  if (isDev && isTestMode) {
    userId = '00000000-0000-0000-0000-000000000001'; // Test UUID
    supabase = supabaseAdmin; // Use admin to bypass RLS in test mode
  } else {
    const auth = await validateUserAndWorkspace(req, workspaceId);
    userId = auth.userId;
    supabase = await getSupabaseServer();
  }

  // Fetch active timer
  const { data: activeTimer } = await supabase
    .from("active_timers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  // Fetch time entries (no join - project data fetched separately if needed)
  let query = supabase
    .from("time_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (startDate) {
    query = query.gte("started_at", startDate);
  }

  if (endDate) {
    query = query.lte("started_at", endDate);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error('[time-entries] Query error:', error);
    throw new DatabaseError(`Failed to fetch time entries: ${error.message}`);
  }

  // Calculate summary stats
  const totalMinutes = (entries || []).reduce(
    (sum, entry) => sum + (entry.duration_minutes || 0),
    0
  );
  const billableMinutes = (entries || []).reduce(
    (sum, entry) => sum + (entry.billable ? entry.duration_minutes || 0 : 0),
    0
  );

  return successResponse({
    entries: entries || [],
    activeTimer,
    summary: {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      billableHours: Math.round((billableMinutes / 60) * 100) / 100,
      entryCount: entries?.length || 0,
    },
  });
});

/**
 * POST /api/time-entries
 *
 * Create time entry or start/stop timer.
 *
 * Body:
 * - action: "start_timer" | "stop_timer" | "create_entry"
 * - workspaceId: Workspace ID
 * - projectId: Optional project ID
 * - taskId: Optional task ID
 * - description: Optional description
 * - For create_entry: startedAt, endedAt, durationMinutes, billable, hourlyRate, tags
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const body = await req.json();
  const { action, workspaceId, projectId, taskId, description } = body;

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required");
  }

  if (!action) {
    throw new ValidationError("action is required (start_timer, stop_timer, create_entry)");
  }

  // Dev test mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const isTestMode = req.headers.get('x-test-mode') === 'true';

  let userId: string;
  let supabase;
  if (isDev && isTestMode) {
    userId = '00000000-0000-0000-0000-000000000001'; // Test UUID
    supabase = supabaseAdmin;
  } else {
    const auth = await validateUserAndWorkspace(req, workspaceId);
    userId = auth.userId;
    supabase = await getSupabaseServer();
  }

  // Handle timer actions
  if (action === "start_timer") {
    // Check for existing timer
    const { data: existing } = await supabase
      .from("active_timers")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (existing) {
      throw new ValidationError("Timer already running. Stop it first.");
    }

    // Start new timer
    const { data: timer, error } = await supabase
      .from("active_timers")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        project_id: projectId || null,
        task_id: taskId || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError("Failed to start timer");
    }

    return successResponse({ message: "Timer started", timer });
  }

  if (action === "stop_timer") {
    // Get active timer
    const { data: timer, error: fetchError } = await supabase
      .from("active_timers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !timer) {
      throw new ValidationError("No active timer to stop");
    }

    const endedAt = new Date().toISOString();

    // Create time entry from timer
    const { data: entry, error: entryError } = await supabase
      .from("time_entries")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        project_id: timer.project_id,
        task_id: timer.task_id,
        started_at: timer.started_at,
        ended_at: endedAt,
        description: timer.description,
        billable: body.billable ?? true,
        hourly_rate: body.hourlyRate || null,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (entryError) {
      throw new DatabaseError("Failed to create time entry");
    }

    // Delete active timer
    await supabase
      .from("active_timers")
      .delete()
      .eq("id", timer.id);

    return successResponse({
      message: "Timer stopped",
      entry,
    });
  }

  if (action === "create_entry") {
    const { startedAt, endedAt, durationMinutes, billable, hourlyRate, tags } = body;

    if (!startedAt) {
      throw new ValidationError("startedAt is required for manual entry");
    }

    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        project_id: projectId || null,
        task_id: taskId || null,
        started_at: startedAt,
        ended_at: endedAt || null,
        duration_minutes: durationMinutes || null,
        description: description || null,
        billable: billable ?? true,
        hourly_rate: hourlyRate || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError("Failed to create time entry");
    }

    return successResponse({ message: "Time entry created", entry });
  }

  throw new ValidationError("Invalid action");
});

/**
 * PATCH /api/time-entries
 *
 * Update a time entry.
 *
 * Body:
 * - entryId: Time entry ID
 * - workspaceId: Workspace ID
 * - Updates: description, billable, hourlyRate, tags, endedAt, durationMinutes
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const body = await req.json();
  const { entryId, workspaceId, ...updates } = body;

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required");
  }

  if (!entryId) {
    throw new ValidationError("entryId is required");
  }

  // Dev test mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const isTestMode = req.headers.get('x-test-mode') === 'true';

  let userId: string;
  if (isDev && isTestMode) {
    userId = '00000000-0000-0000-0000-000000000001'; // Test UUID
  } else {
    const auth = await validateUserAndWorkspace(req, workspaceId);
    userId = auth.userId;
  }
  const supabase = await getSupabaseServer();

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (updates.description !== undefined) {
updateData.description = updates.description;
}
  if (updates.billable !== undefined) {
updateData.billable = updates.billable;
}
  if (updates.hourlyRate !== undefined) {
updateData.hourly_rate = updates.hourlyRate;
}
  if (updates.tags !== undefined) {
updateData.tags = updates.tags;
}
  if (updates.endedAt !== undefined) {
updateData.ended_at = updates.endedAt;
}
  if (updates.durationMinutes !== undefined) {
updateData.duration_minutes = updates.durationMinutes;
}
  if (updates.projectId !== undefined) {
updateData.project_id = updates.projectId;
}

  const { data, error } = await supabase
    .from("time_entries")
    .update(updateData)
    .eq("id", entryId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError("Failed to update time entry");
  }

  return successResponse({ message: "Time entry updated", entry: data });
});

/**
 * DELETE /api/time-entries
 *
 * Delete a time entry.
 *
 * Body:
 * - entryId: Time entry ID
 * - workspaceId: Workspace ID
 */
export const DELETE = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const body = await req.json();
  const { entryId, workspaceId } = body;

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required");
  }

  if (!entryId) {
    throw new ValidationError("entryId is required");
  }

  // Dev test mode bypass
  const isDev = process.env.NODE_ENV === 'development';
  const isTestMode = req.headers.get('x-test-mode') === 'true';

  let userId: string;
  if (isDev && isTestMode) {
    userId = '00000000-0000-0000-0000-000000000001'; // Test UUID
  } else {
    const auth = await validateUserAndWorkspace(req, workspaceId);
    userId = auth.userId;
  }
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) {
    throw new DatabaseError("Failed to delete time entry");
  }

  return successResponse({ message: "Time entry deleted" });
});
