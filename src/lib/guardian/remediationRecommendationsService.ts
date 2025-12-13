import {
  GuardianRemediationRecommendation,
  GuardianRemediationRecommendationConfidenceSchema,
  GuardianRemediationRecommendationEffect,
  GuardianRemediationRecommendationEffectSchema,
  GuardianRemediationRecommendationMetricsSnapshotSchema,
  GuardianRemediationRecommendationRationaleSchema,
  GuardianRemediationRecommendationScoreSchema,
} from "@/lib/guardian/remediationRecommendationsDomain";
import { GuardianRemediationOverallEffectSchema } from "@/lib/guardian/remediationSimulatorDomain";

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

function normalizePct(pct: number, scale: number): number {
  if (!Number.isFinite(pct)) {
return 0;
}
  return clampNumber(pct / scale, -1, 1);
}

function pctToPhrase(label: string, pct: number): string {
  const n = Number(pct);
  if (!Number.isFinite(n) || Math.abs(n) < 0.005) {
return `${label}: unchanged`;
}
  const abs = Math.abs(n).toFixed(2);
  return n >= 0 ? `${label}: reduced ${abs}%` : `${label}: increased ${abs}%`;
}

export function scoreRecommendation(input: {
  delta_metrics: unknown;
  overall_effect: unknown;
}): {
  score: number;
  confidence: number;
  effect: GuardianRemediationRecommendationEffect;
  rationale: string;
  metricsSnapshot: any;
} {
  const deltasParsed = GuardianRemediationRecommendationMetricsSnapshotSchema.safeParse(
    input.delta_metrics
  );
  if (!deltasParsed.success) {
    throw new Error("Invalid delta_metrics");
  }

  const effectParsed = GuardianRemediationOverallEffectSchema.safeParse(input.overall_effect);
  if (!effectParsed.success) {
    throw new Error("Invalid overall_effect");
  }

  const delta = deltasParsed.data;
  const overall = effectParsed.data;

  const alertsNorm = normalizePct(delta.alerts_pct, 50);
  const incidentsNorm = normalizePct(delta.incidents_pct, 50);
  const riskNorm = normalizePct(delta.avg_risk_score_pct, 25);
  const correlationsNorm = normalizePct(delta.correlations_pct, 50);
  const notificationsNorm = normalizePct(delta.notifications_pct, 50);

  // Weights: alerts/incidents most important; notifications lowest.
  const weights = {
    alerts: 0.32,
    incidents: 0.32,
    risk: 0.2,
    correlations: 0.08,
    notifications: 0.08,
  } as const;

  const raw =
    alertsNorm * weights.alerts +
    incidentsNorm * weights.incidents +
    riskNorm * weights.risk +
    correlationsNorm * weights.correlations +
    notificationsNorm * weights.notifications;

  let score = ((raw + 1) / 2) * 100;

  // Penalize explicitly negative outcomes.
  if (overall === "negative") {
score -= 10;
}
  if (overall === "positive") {
score += 5;
}

  score = clampNumber(score, 0, 100);

  // Confidence: magnitude + consistency across key metrics (alerts/incidents/risk).
  const key = [alertsNorm, incidentsNorm, riskNorm];
  const magnitude = clampNumber(
    key.reduce((sum, v) => sum + Math.abs(v), 0) / key.length,
    0,
    1
  );

  const signOf = (v: number) => (v > 0.02 ? 1 : v < -0.02 ? -1 : 0);
  const expected = overall === "positive" ? 1 : overall === "negative" ? -1 : 0;
  const consistentCount = key.filter((v) => {
    const s = signOf(v);
    if (expected === 0) {
return s === 0;
}
    return s === expected;
  }).length;
  const consistency = consistentCount / key.length;

  let confidence = 0.25 + 0.5 * magnitude + 0.25 * consistency;
  confidence = clampNumber(confidence, 0, 1);

  const rationale = [
    `effect=${overall}`,
    pctToPhrase("alerts", delta.alerts_pct),
    pctToPhrase("incidents", delta.incidents_pct),
    pctToPhrase("risk", delta.avg_risk_score_pct),
    pctToPhrase("notifications", delta.notifications_pct),
    `score=${score.toFixed(1)}`,
    `confidence=${confidence.toFixed(2)}`,
  ].join("; ");

  const safeEffect = GuardianRemediationRecommendationEffectSchema.parse(overall);
  const safeScore = GuardianRemediationRecommendationScoreSchema.parse(score);
  const safeConfidence = GuardianRemediationRecommendationConfidenceSchema.parse(confidence);
  const safeRationale = GuardianRemediationRecommendationRationaleSchema.parse(rationale);

  return {
    score: safeScore,
    confidence: safeConfidence,
    effect: safeEffect,
    rationale: safeRationale,
    metricsSnapshot: delta,
  };
}

async function requireSupabase(ctx?: ServiceContext): Promise<ServiceContext> {
  invariant(ctx?.supabase, "Missing service context: supabase");
  return ctx;
}

export async function generateRecommendations(
  workspaceId: string,
  hours: number = 24,
  ctx?: ServiceContext
): Promise<{ recommendations: GuardianRemediationRecommendation[]; generated: number }> {
  const context = await requireSupabase(ctx);

  const windowHours = Math.min(Math.max(Math.floor(hours), 1), 168);
  const sinceIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data: runs, error: runsError } = await context.supabase
    .from("guardian_remediation_simulation_runs")
    .select("id, playbook_id, created_at, delta_metrics, overall_effect, status")
    .eq("tenant_id", workspaceId)
    .eq("status", "completed")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(200);

  if (runsError) {
throw new Error(runsError.message);
}

  const payloads: any[] = [];
  for (const run of runs || []) {
    if (!run?.id || !run?.playbook_id) {
continue;
}
    if (run.overall_effect === null || run.overall_effect === undefined) {
continue;
}

    const scored = scoreRecommendation({
      delta_metrics: run.delta_metrics,
      overall_effect: run.overall_effect,
    });

    payloads.push({
      workspace_id: workspaceId,
      playbook_id: run.playbook_id,
      simulation_run_id: run.id,
      score: scored.score,
      confidence: scored.confidence,
      effect: scored.effect,
      rationale: scored.rationale,
      metrics_snapshot: scored.metricsSnapshot,
    });
  }

  if (payloads.length === 0) {
    return { recommendations: [], generated: 0 };
  }

  const { error: upsertError } = await context.supabase
    .from("guardian_remediation_recommendations")
    .upsert(payloads, { onConflict: "workspace_id,simulation_run_id" });

  if (upsertError) {
throw new Error(upsertError.message);
}

  const recommendations = await listRecommendations(workspaceId, ctx);
  return { recommendations, generated: payloads.length };
}

export async function listRecommendations(
  workspaceId: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationRecommendation[]> {
  const context = await requireSupabase(ctx);

  const { data, error } = await context.supabase
    .from("guardian_remediation_recommendations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("score", { ascending: false })
    .order("confidence", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
throw new Error(error.message);
}
  return (data || []) as GuardianRemediationRecommendation[];
}

