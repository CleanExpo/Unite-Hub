import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { Project, TablesInsert } from "@/types/database";

/**
 * GET /api/projects
 * Get all projects for an organization with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    let query = supabase
      .from("projects")
      .select(`
        *,
        assignees:project_assignees(
          team_member:team_members(*)
        ),
        milestones:project_milestones(*)
      `)
      .eq("org_id", orgId);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    query = query.order("created_at", { ascending: false });

    const { data: projects, error } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgId,
      workspaceId,
      title,
      clientName,
      description,
      status,
      priority,
      dueDate,
      startDate,
      budgetAmount,
      assigneeIds,
    } = body;

    if (!orgId || !title || !clientName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, title, clientName" },
        { status: 400 }
      );
    }

    const newProject: TablesInsert<"projects"> = {
      org_id: orgId,
      workspace_id: workspaceId || null,
      title,
      client_name: clientName,
      description: description || null,
      status: status || "on-track",
      priority: priority || "medium",
      progress: 0,
      due_date: dueDate || null,
      start_date: startDate || null,
      completed_date: null,
      budget_amount: budgetAmount || null,
      budget_currency: "USD",
    };

    const supabase = getSupabaseServer();
    const { data: project, error } = await supabase
      .from("projects")
      .insert(newProject)
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Assign team members if provided
    if (assigneeIds && assigneeIds.length > 0) {
      const assignments = assigneeIds.map((teamMemberId: string) => ({
        project_id: project.id,
        team_member_id: teamMemberId,
      }));

      const { error: assignError } = await supabase
        .from("project_assignees")
        .insert(assignments);

      if (assignError) {
        console.error("Error assigning team members:", assignError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
