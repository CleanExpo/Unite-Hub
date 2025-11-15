import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { TeamMember, TablesInsert } from "@/types/database";

/**
 * GET /api/team
 * Get all team members for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: teamMembers, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching team members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/team
 * Create a new team member
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, role, email, phone, avatar_url, initials, capacity_hours, skills, join_date } = body;

    if (!orgId || !name || !role || !email || !initials) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name, role, email, initials" },
        { status: 400 }
      );
    }

    const newMember: TablesInsert<"team_members"> = {
      org_id: orgId,
      name,
      role,
      email,
      phone: phone || null,
      avatar_url: avatar_url || null,
      initials,
      capacity_hours: capacity_hours || 40,
      hours_allocated: 0,
      current_projects: 0,
      skills: skills || [],
      join_date: join_date || new Date().toISOString().split("T")[0],
      is_active: true,
    };

    const supabase = await getSupabaseServer();
    const { data: teamMember, error } = await supabase
      .from("team_members")
      .insert(newMember)
      .select()
      .single();

    if (error) {
      console.error("Error creating team member:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
