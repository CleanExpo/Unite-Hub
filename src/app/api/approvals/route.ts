import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import type { Approval, TablesInsert } from "@/types/database";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * GET /api/approvals
 * Get all approvals for an organization with optional filters
 */
export async function GET(request: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    let query = supabase
      .from("approvals")
      .select("*")
      .eq("org_id", orgId);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (type) {
      query = query.eq("type", type);
    }

    query = query.order("created_at", { ascending: false });

    const { data: approvals, error } = await query;

    if (error) {
      console.error("Error fetching approvals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/approvals
 * Create a new approval request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgId,
      projectId,
      title,
      description,
      clientName,
      type,
      priority,
      assetUrl,
      submittedById,
      submittedByName,
    } = body;

    if (!orgId || !title || !submittedByName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, title, submittedByName" },
        { status: 400 }
      );
    }

    const newApproval: TablesInsert<"approvals"> = {
      org_id: orgId,
      project_id: projectId || null,
      title,
      description: description || null,
      client_name: clientName || null,
      type: type || "document",
      priority: priority || "medium",
      status: "pending",
      asset_url: assetUrl || null,
      submitted_by_id: submittedById || null,
      submitted_by_name: submittedByName,
      reviewed_by_id: null,
      reviewed_at: null,
      decline_reason: null,
    };

    const supabase = await getSupabaseServer();
    const { data: approval, error } = await supabase
      .from("approvals")
      .insert(newApproval)
      .select()
      .single();

    if (error) {
      console.error("Error creating approval:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
