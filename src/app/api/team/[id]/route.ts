import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { TablesUpdate } from "@/types/database";

/**
 * GET /api/team/[id]
 * Get a single team member by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching team member:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/team/[id]
 * Update a team member
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const updates: TablesUpdate<"team_members"> = {};

    // Only include fields that are provided
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.initials !== undefined) updates.initials = body.initials;
    if (body.capacity_hours !== undefined) updates.capacity_hours = body.capacity_hours;
    if (body.hours_allocated !== undefined) updates.hours_allocated = body.hours_allocated;
    if (body.skills !== undefined) updates.skills = body.skills;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const supabase = getSupabaseServer();
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating team member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/team/[id]
 * Soft delete a team member (set is_active to false)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting team member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
