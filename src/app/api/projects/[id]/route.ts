import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { TablesUpdate } from "@/types/database";

/**
 * GET /api/projects/[id]
 * Get a single project by ID with full details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        assignees:project_assignees(
          team_member:team_members(*)
        ),
        milestones:project_milestones(*),
        deliverables:deliverables(*),
        messages:project_messages(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const updates: TablesUpdate<"projects"> = {};

    // Only include fields that are provided
    if (body.title !== undefined) updates.title = body.title;
    if (body.client_name !== undefined) updates.client_name = body.client_name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.progress !== undefined) updates.progress = body.progress;
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.start_date !== undefined) updates.start_date = body.start_date;
    if (body.completed_date !== undefined) updates.completed_date = body.completed_date;
    if (body.budget_amount !== undefined) updates.budget_amount = body.budget_amount;
    if (body.workspace_id !== undefined) updates.workspace_id = body.workspace_id;

    // Auto-set completed_date when status changes to completed
    if (body.status === "completed" && !body.completed_date) {
      updates.completed_date = new Date().toISOString();
      updates.progress = 100;
    }

    const supabase = getSupabaseServer();
    const { data: project, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update assignees if provided
    if (body.assigneeIds !== undefined) {
      // Remove existing assignments
      await supabase.from("project_assignees").delete().eq("project_id", id);

      // Add new assignments
      if (body.assigneeIds.length > 0) {
        const assignments = body.assigneeIds.map((teamMemberId: string) => ({
          project_id: id,
          team_member_id: teamMemberId,
        }));

        await supabase.from("project_assignees").insert(assignments);
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (cascade delete will remove assignees, milestones, etc.)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
