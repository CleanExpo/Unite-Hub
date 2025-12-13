import {
  GuardianRemediationDriftSeverity,
  GuardianRemediationDriftType,
  GuardianRemediationEffect,
  GuardianRemediationRecommendationImpactRow,
  GuardianRemediationDriftEventRow,
  validateDriftMetadata,
} from "@/lib/guardian/remediationImpactDomain";

type SupabaseLike = {
  from: (table: string) => any;
};

type ServiceContext = {
  supabase: SupabaseLike;
};

function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
throw new Error(message);
}
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function nowIso(): string {
  return new Date().toISOString();
}

async function requireSupabase(ctx?: ServiceContext): Promise<ServiceContext> {
  invariant(ctx?.supabase, "Missing service context: supabase");
  return ctx;
}

function severityForScoreDecay(drop: number): GuardianRemediationDriftSeverity | null {
  if (drop >= 30) {
return "high";
}
  if (drop >= 15) {
return "medium";
}
  return null;
}

function severityForConfidenceDrop(drop: number): GuardianRemediationDriftSeverity | null {
  if (drop >= 0.4) {
return "high";
}
  if (drop >= 0.2) {
return "medium";
}
  return null;
}

async function driftEventExistsSince(
  supabase: SupabaseLike,
  workspaceId: string,
  recommendationId: string,
  driftType: GuardianRemediationDriftType,
  sinceIso: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("guardian_remediation_drift_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("recommendation_id", recommendationId)
    .eq("drift_type", driftType)
    .gte("detected_at", sinceIso)
    .limit(1);

  if (error) {
throw new Error(error.message);
}
  return Array.isArray(data) && data.length > 0;
}

async function insertDriftEvent(params: {
  supabase: SupabaseLike;
  workspaceId: string;
  recommendationId: string;
  detectedAt: string;
  driftType: GuardianRemediationDriftType;
  severity: GuardianRemediationDriftSeverity;
  description: string;
  metadata: Record<string, unknown>;
}): Promise<GuardianRemediationDriftEventRow | null> {
  const meta = validateDriftMetadata(params.metadata);
  if (!meta.ok) {
throw new Error(`Invalid drift metadata: ${meta.error}`);
}

  const { data, error } = await params.supabase
    .from("guardian_remediation_drift_events")
    .insert({
      workspace_id: params.workspaceId,
      recommendation_id: params.recommendationId,
      detected_at: params.detectedAt,
      drift_type: params.driftType,
      severity: params.severity,
      description: params.description,
      metadata: meta.value,
    })
    .select("*")
    .single();

  if (error) {
throw new Error(error.message);
}
  return (data as GuardianRemediationDriftEventRow) || null;
}

export async function recordImpactSnapshot(
  workspaceId: string,
  ctx?: ServiceContext
): Promise<{ recorded: number; observed_at: string }> {
  const context = await requireSupabase(ctx);

  const observedAt = nowIso();

  const { data: recs, error: recsError } = await context.supabase
    .from("guardian_remediation_recommendations")
    .select("id, score, confidence, effect, metrics_snapshot")
    .eq("workspace_id", workspaceId)
    .order("score", { ascending: false })
    .limit(200);

  if (recsError) {
throw new Error(recsError.message);
}

  const rows =
    (recs || []).map((r: any) => ({
      workspace_id: workspaceId,
      recommendation_id: r.id,
      observed_at: observedAt,
      score_at_time: clampNumber(Math.round(Number(r.score) || 0), 0, 100),
      confidence_at_time: clampNumber(round2(Number(r.confidence) || 0), 0, 1),
      effect: r.effect,
      metrics_snapshot: r.metrics_snapshot || {},
    })) || [];

  if (rows.length === 0) {
return { recorded: 0, observed_at: observedAt };
}

  const { error: insertError } = await context.supabase
    .from("guardian_remediation_recommendation_impacts")
    .insert(rows);

  if (insertError) {
throw new Error(insertError.message);
}

  return { recorded: rows.length, observed_at: observedAt };
}

export async function listImpacts(
  workspaceId: string,
  recommendationId: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationRecommendationImpactRow[]> {
  const context = await requireSupabase(ctx);

  const { data, error } = await context.supabase
    .from("guardian_remediation_recommendation_impacts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("recommendation_id", recommendationId)
    .order("observed_at", { ascending: false })
    .limit(200);

  if (error) {
throw new Error(error.message);
}
  return (data || []) as GuardianRemediationRecommendationImpactRow[];
}

export async function listDriftEvents(
  workspaceId: string,
  hours: number = 168,
  ctx?: ServiceContext
): Promise<GuardianRemediationDriftEventRow[]> {
  const context = await requireSupabase(ctx);

  const windowHours = Math.min(Math.max(Math.floor(hours), 1), 720);
  const sinceIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await context.supabase
    .from("guardian_remediation_drift_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("detected_at", sinceIso)
    .order("detected_at", { ascending: false })
    .limit(200);

  if (error) {
throw new Error(error.message);
}
  return (data || []) as GuardianRemediationDriftEventRow[];
}

export async function detectDrift(
  workspaceId: string,
  ctx?: ServiceContext
): Promise<{ inserted: number; events: GuardianRemediationDriftEventRow[] }> {
  const context = await requireSupabase(ctx);

  const detectedAt = nowIso();

  const { data: recs, error: recsError } = await context.supabase
    .from("guardian_remediation_recommendations")
    .select("id, playbook_id")
    .eq("workspace_id", workspaceId)
    .limit(200);

  if (recsError) {
throw new Error(recsError.message);
}

  const events: GuardianRemediationDriftEventRow[] = [];

  for (const rec of recs || []) {
    const recommendationId = rec.id as string;
    const playbookId = rec.playbook_id as string;

    // Load latest two snapshots for this recommendation.
    const { data: impacts, error: impactsError } = await context.supabase
      .from("guardian_remediation_recommendation_impacts")
      .select("observed_at, score_at_time, confidence_at_time, effect")
      .eq("workspace_id", workspaceId)
      .eq("recommendation_id", recommendationId)
      .order("observed_at", { ascending: false })
      .limit(2);

    if (impactsError) {
throw new Error(impactsError.message);
}

    const latest = impacts?.[0];
    const previous = impacts?.[1];

    // Compare latest vs previous snapshot for decay/flip.
    if (latest && previous) {
      const compareSince = previous.observed_at as string;

      const scoreDrop = Number(previous.score_at_time) - Number(latest.score_at_time);
      const scoreSeverity = severityForScoreDecay(scoreDrop);
      if (scoreSeverity) {
        const exists = await driftEventExistsSince(
          context.supabase,
          workspaceId,
          recommendationId,
          "score_decay",
          compareSince
        );
        if (!exists) {
          const ev = await insertDriftEvent({
            supabase: context.supabase,
            workspaceId,
            recommendationId,
            detectedAt,
            driftType: "score_decay",
            severity: scoreSeverity,
            description: `Score decayed by ${scoreDrop} points (from ${previous.score_at_time} to ${latest.score_at_time})`,
            metadata: {
              previous_score: previous.score_at_time,
              current_score: latest.score_at_time,
              drop_points: scoreDrop,
              thresholds: { medium: 15, high: 30 },
            },
          });
          if (ev) {
events.push(ev);
}
        }
      }

      const confDrop = Number(previous.confidence_at_time) - Number(latest.confidence_at_time);
      const confSeverity = severityForConfidenceDrop(confDrop);
      if (confSeverity) {
        const exists = await driftEventExistsSince(
          context.supabase,
          workspaceId,
          recommendationId,
          "confidence_drop",
          compareSince
        );
        if (!exists) {
          const ev = await insertDriftEvent({
            supabase: context.supabase,
            workspaceId,
            recommendationId,
            detectedAt,
            driftType: "confidence_drop",
            severity: confSeverity,
            description: `Confidence dropped by ${round2(confDrop)} (from ${previous.confidence_at_time} to ${latest.confidence_at_time})`,
            metadata: {
              previous_confidence: previous.confidence_at_time,
              current_confidence: latest.confidence_at_time,
              drop: round2(confDrop),
              thresholds: { medium: 0.2, high: 0.4 },
            },
          });
          if (ev) {
events.push(ev);
}
        }
      }

      const prevEffect = previous.effect as GuardianRemediationEffect;
      const currentEffect = latest.effect as GuardianRemediationEffect;
      if (prevEffect === "positive" && currentEffect !== "positive") {
        const exists = await driftEventExistsSince(
          context.supabase,
          workspaceId,
          recommendationId,
          "effect_flip",
          compareSince
        );
        if (!exists) {
          const ev = await insertDriftEvent({
            supabase: context.supabase,
            workspaceId,
            recommendationId,
            detectedAt,
            driftType: "effect_flip",
            severity: "high",
            description: `Effect flipped from positive to ${currentEffect}`,
            metadata: {
              previous_effect: prevEffect,
              current_effect: currentEffect,
            },
          });
          if (ev) {
events.push(ev);
}
        }
      }
    }

    // Staleness: check for most recent completed simulation run for this playbook.
    const { data: latestRun, error: runError } = await context.supabase
      .from("guardian_remediation_simulation_runs")
      .select("created_at")
      .eq("tenant_id", workspaceId)
      .eq("playbook_id", playbookId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runError) {
throw new Error(runError.message);
}

    const lastSimAt = latestRun?.created_at ? new Date(latestRun.created_at).getTime() : null;
    const ageDays = lastSimAt
      ? Math.floor((Date.now() - lastSimAt) / (1000 * 60 * 60 * 24))
      : 9999;

    let staleSeverity: GuardianRemediationDriftSeverity | null = null;
    if (ageDays >= 60) {
staleSeverity = "high";
} else if (ageDays >= 30) {
staleSeverity = "medium";
}

    if (staleSeverity) {
      // Avoid spamming: only one stale event per 24h.
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const exists = await driftEventExistsSince(
        context.supabase,
        workspaceId,
        recommendationId,
        "stale",
        since
      );
      if (!exists) {
        const ev = await insertDriftEvent({
          supabase: context.supabase,
          workspaceId,
          recommendationId,
          detectedAt,
          driftType: "stale",
          severity: staleSeverity,
          description: `No new simulation run in ${ageDays} days`,
          metadata: {
            playbook_id: playbookId,
            last_simulation_created_at: latestRun?.created_at ?? null,
            age_days: ageDays,
            thresholds_days: { medium: 30, high: 60 },
          },
        });
        if (ev) {
events.push(ev);
}
      }
    }
  }

  return { inserted: events.length, events };
}

