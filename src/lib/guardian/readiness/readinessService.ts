import { getSupabaseServer } from "@/lib/supabase";
import type { GuardianReadinessSnapshot } from "./readinessModel";

export async function loadLatestReadinessSnapshot(
  tenantId: string
): Promise<GuardianReadinessSnapshot | null> {
  const supabase = getSupabaseServer();

  const { data: rows, error } = await supabase
    .from("guardian_tenant_readiness_scores")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("computed_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load readiness snapshot: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
return null;
}

  const latestComputedAt = rows[0].computed_at;
  const snapshotRows = rows.filter((r: any) => r.computed_at === latestComputedAt);
  const first = snapshotRows[0];

  return {
    id: first.id,
    tenantId,
    computedAt: new Date(latestComputedAt),
    overallScore: first.overall_guardian_score ?? 0,
    overallStatus: first.overall_status ?? "baseline",
    capabilities: snapshotRows.map((r: any) => ({
      capabilityKey: r.capability_key,
      score: r.score ?? 0,
      status: r.status ?? "not_configured",
      details: r.details ?? null,
    })),
    metadata: first.metadata ?? null,
  } as GuardianReadinessSnapshot;
}

