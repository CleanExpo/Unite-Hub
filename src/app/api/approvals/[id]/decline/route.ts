import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * POST /api/approvals/[id]/decline
 * Decline an approval request
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reviewedById, reason } = body;

    const supabase = getSupabaseServer();
    const { data: approval, error } = await supabase
      .from("approvals")
      .update({
        status: "declined",
        reviewed_by_id: reviewedById || null,
        reviewed_at: new Date().toISOString(),
        decline_reason: reason || "No reason provided",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error declining approval:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
