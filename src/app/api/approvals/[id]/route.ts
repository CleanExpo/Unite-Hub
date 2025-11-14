import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * GET /api/approvals/[id]
 * Get a single approval by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { data: approval, error } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching approval:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ approval });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/approvals/[id]
 * Delete an approval
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const supabase = getSupabaseServer();
    const { error } = await supabase.from("approvals").delete().eq("id", id);

    if (error) {
      console.error("Error deleting approval:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
