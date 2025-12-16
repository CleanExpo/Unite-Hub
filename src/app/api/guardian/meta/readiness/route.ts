import { NextRequest, NextResponse } from "next/server";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const headers = new Headers({
    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    "Content-Type": "application/json",
  });

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "workspaceId required", readiness: null },
      { status: 400, headers }
    );
  }

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("guardian_tenant_readiness_scores")
    .select("*")
    .eq("tenant_id", workspaceId)
    .order("computed_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      {
        success: true,
        readiness: null,
      },
      { headers }
    );
  }

  const latestComputedAt = data[0].computed_at;
  const snapshotRows = data.filter((row) => row.computed_at === latestComputedAt);

  return NextResponse.json(
    {
      success: true,
      readiness: {
        overall_guardian_score: snapshotRows[0].overall_guardian_score,
        overall_status: snapshotRows[0].overall_status,
        computed_at: snapshotRows[0].computed_at,
        capabilities: snapshotRows.map((row) => ({
          capabilityKey: row.capability_key,
          score: row.score,
          status: row.status,
        })),
      },
    },
    { headers }
  );
}
