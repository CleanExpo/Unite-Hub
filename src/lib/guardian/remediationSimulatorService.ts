import {
  GuardianRemediationAggregateMetrics,
  GuardianRemediationDeltaMetrics,
  GuardianRemediationOverallEffect,
  GuardianRemediationPlaybook,
  GuardianRemediationPlaybookConfig,
  GuardianRemediationPlaybookConfigSchema,
  GuardianRemediationSimulationRun,
  validateBaselineMetrics,
  validatePlaybookPayload,
  validateSafeMetadata,
} from "@/lib/guardian/remediationSimulatorDomain";

type SupabaseLike = {
  from: (table: string) => any;
};

type ServiceContext = {
  supabase: SupabaseLike;
  actorId?: string;
};

function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
throw new Error(message);
}
}

function safePct(delta: number, baseline: number): number {
  if (baseline === 0) {
return 0;
}
  return (delta / baseline) * 100;
}

function clampInt(value: number, min: number, max: number): number {
  const n = Math.round(value);
  return Math.max(min, Math.min(max, n));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scaleBreakdown(
  breakdown: Record<string, number>,
  newTotal: number
): Record<string, number> {
  const keys = Object.keys(breakdown).sort((a, b) => a.localeCompare(b));
  const baselineTotal = keys.reduce((sum, k) => sum + (Number(breakdown[k]) || 0), 0);
  if (baselineTotal <= 0) {
return { ...breakdown };
}

  const factor = newTotal / baselineTotal;
  const scaled: Record<string, number> = {};

  // Deterministic rounding with remainder distribution by key order
  let allocated = 0;
  for (const k of keys) {
    const v = Number(breakdown[k]) || 0;
    const next = Math.floor(v * factor);
    scaled[k] = next;
    allocated += next;
  }

  let remainder = Math.max(0, newTotal - allocated);
  for (const k of keys) {
    if (remainder <= 0) {
break;
}
    scaled[k] += 1;
    remainder -= 1;
  }

  return scaled;
}

function applyActionsVirtually(
  baseline: GuardianRemediationAggregateMetrics,
  config: GuardianRemediationPlaybookConfig
): GuardianRemediationAggregateMetrics {
  let alerts = baseline.alerts_total;
  let incidents = baseline.incidents_total;
  let correlations = baseline.correlations_total;
  let notifications = baseline.notifications_total;
  let avgRisk = baseline.avg_risk_score;

  let alertsBySeverity = baseline.alerts_by_severity
    ? { ...baseline.alerts_by_severity }
    : undefined;
  let incidentsByStatus = baseline.incidents_by_status
    ? { ...baseline.incidents_by_status }
    : undefined;

  const baseAlerts = baseline.alerts_total;
  const baseIncidents = baseline.incidents_total;

  let suppressedChannels = 0;

  for (const action of config.actions) {
    switch (action.type) {
      case "disable_rule": {
        // Deterministic estimate: each disabled rule reduces alert volume meaningfully.
        alerts = alerts * 0.88;
        incidents = incidents * 0.92;
        correlations = correlations * 0.96;
        break;
      }
      case "adjust_rule_threshold": {
        // delta > 0 => stricter => fewer alerts; delta < 0 => looser => more alerts
        const delta = clampNumber(action.delta, -50, 50);
        const changePct = delta * 0.002; // +/-10% max
        alerts = alerts * (1 - changePct);
        incidents = incidents * (1 - changePct * 0.6);
        break;
      }
      case "adjust_correlation_window": {
        const delta = clampNumber(action.window_minutes_delta, -30, 120);
        const normalized = delta / 120; // -0.25..1
        correlations = correlations * (1 + normalized * 0.15);
        incidents = incidents * (1 + normalized * 0.08);
        break;
      }
      case "increase_min_link_count": {
        const d = clampInt(action.delta, 1, 5);
        incidents = incidents * (1 - d * 0.07);
        correlations = correlations * (1 - d * 0.04);
        break;
      }
      case "suppress_notification_channel": {
        // Aggregate-only: track number of suppressed channels; apply capped reduction once at end.
        suppressedChannels += 1;
        break;
      }
    }

    alerts = clampNumber(alerts, 0, Number.MAX_SAFE_INTEGER);
    incidents = clampNumber(incidents, 0, Number.MAX_SAFE_INTEGER);
    correlations = clampNumber(correlations, 0, Number.MAX_SAFE_INTEGER);
    notifications = clampNumber(notifications, 0, Number.MAX_SAFE_INTEGER);
    avgRisk = clampNumber(avgRisk, 0, Number.MAX_SAFE_INTEGER);
  }

  // Notifications: apply suppression estimate once, capped.
  if (suppressedChannels > 0) {
    const reduction = clampNumber(suppressedChannels * 0.8, 0, 1);
    notifications = notifications * (1 - reduction);
  }

  // Risk score: scale with average of alert/incident volume change (no timestamps; deterministic).
  const alertRatio = baseAlerts === 0 ? 1 : alerts / baseAlerts;
  const incidentRatio = baseIncidents === 0 ? 1 : incidents / baseIncidents;
  const volumeRatio = (alertRatio + incidentRatio) / 2;
  avgRisk = avgRisk * clampNumber(volumeRatio, 0, 2);

  const alertsTotal = clampInt(alerts, 0, Number.MAX_SAFE_INTEGER);
  const incidentsTotal = clampInt(incidents, 0, Number.MAX_SAFE_INTEGER);
  const correlationsTotal = clampInt(correlations, 0, Number.MAX_SAFE_INTEGER);
  const notificationsTotal = clampInt(notifications, 0, Number.MAX_SAFE_INTEGER);
  const avgRiskScore = avgRisk;

  if (alertsBySeverity) {
    alertsBySeverity = scaleBreakdown(alertsBySeverity, alertsTotal);
  }
  if (incidentsByStatus) {
    incidentsByStatus = scaleBreakdown(incidentsByStatus, incidentsTotal);
  }

  return {
    alerts_total: alertsTotal,
    alerts_by_severity: alertsBySeverity,
    incidents_total: incidentsTotal,
    incidents_by_status: incidentsByStatus,
    correlations_total: correlationsTotal,
    notifications_total: notificationsTotal,
    avg_risk_score: avgRiskScore,
    window_days: baseline.window_days,
  };
}

function computeDeltaMetrics(
  baseline: GuardianRemediationAggregateMetrics,
  simulated: GuardianRemediationAggregateMetrics
): GuardianRemediationDeltaMetrics {
  const alertsDelta = baseline.alerts_total - simulated.alerts_total;
  const incidentsDelta = baseline.incidents_total - simulated.incidents_total;
  const correlationsDelta = baseline.correlations_total - simulated.correlations_total;
  const notificationsDelta = baseline.notifications_total - simulated.notifications_total;
  const avgRiskDelta = baseline.avg_risk_score - simulated.avg_risk_score;

  return {
    alerts_delta: alertsDelta,
    alerts_pct: safePct(alertsDelta, baseline.alerts_total),
    incidents_delta: incidentsDelta,
    incidents_pct: safePct(incidentsDelta, baseline.incidents_total),
    correlations_delta: correlationsDelta,
    correlations_pct: safePct(correlationsDelta, baseline.correlations_total),
    notifications_delta: notificationsDelta,
    notifications_pct: safePct(notificationsDelta, baseline.notifications_total),
    avg_risk_score_delta: avgRiskDelta,
    avg_risk_score_pct: safePct(avgRiskDelta, baseline.avg_risk_score),
  };
}

function classifyOverallEffect(delta: GuardianRemediationDeltaMetrics): GuardianRemediationOverallEffect {
  const positive =
    delta.alerts_pct >= 10 ||
    delta.incidents_pct >= 10 ||
    delta.avg_risk_score_pct >= 5;

  const negative =
    delta.alerts_pct <= -10 ||
    delta.incidents_pct <= -10 ||
    delta.avg_risk_score_pct <= -5;

  if (positive && !negative) {
return "positive";
}
  if (negative && !positive) {
return "negative";
}
  return "neutral";
}

function generateSummary(
  effect: GuardianRemediationOverallEffect,
  delta: GuardianRemediationDeltaMetrics
): string {
  const parts: string[] = [];
  parts.push(`overall_effect=${effect}`);
  parts.push(`alerts_pct=${delta.alerts_pct.toFixed(2)}`);
  parts.push(`incidents_pct=${delta.incidents_pct.toFixed(2)}`);
  parts.push(`notifications_pct=${delta.notifications_pct.toFixed(2)}`);
  parts.push(`avg_risk_score_pct=${delta.avg_risk_score_pct.toFixed(2)}`);
  return parts.join(" ");
}

function sanitizeMetadataErrorMessage(message: unknown): string {
  const raw = String(message ?? "error").slice(0, 200);
  // Enforce PII-free convention (no '@') and deterministic shape.
  return raw.replace(/@/g, "[at]");
}

async function requireSupabase(ctx?: ServiceContext): Promise<ServiceContext> {
  invariant(ctx?.supabase, "Missing service context: supabase");
  return ctx;
}

export async function createPlaybook(
  tenantId: string,
  payload: unknown,
  ctx?: ServiceContext
): Promise<GuardianRemediationPlaybook> {
  const context = await requireSupabase(ctx);

  const parsed = validatePlaybookPayload(payload);
  if (!parsed.ok) {
throw new Error(`Invalid playbook payload: ${parsed.error}`);
}

  const createdBy = ctx?.actorId ?? null;

  const { data, error } = await context.supabase
    .from("guardian_remediation_playbooks")
    .insert({
      tenant_id: tenantId,
      name: parsed.value.name,
      description: parsed.value.description ?? null,
      category: parsed.value.category ?? "guardian_core",
      is_active: parsed.value.is_active ?? true,
      config: parsed.value.config,
      created_by: createdBy,
      metadata: parsed.value.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
throw new Error(error.message);
}
  return data as GuardianRemediationPlaybook;
}

export async function listPlaybooks(
  tenantId: string,
  filters?: { is_active?: boolean; category?: string; limit?: number; offset?: number },
  ctx?: ServiceContext
): Promise<{ playbooks: GuardianRemediationPlaybook[]; total: number }> {
  const context = await requireSupabase(ctx);

  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
  const offset = Math.max(filters?.offset ?? 0, 0);

  let query = context.supabase
    .from("guardian_remediation_playbooks")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error, count } = await query;
  if (error) {
throw new Error(error.message);
}

  return { playbooks: (data || []) as GuardianRemediationPlaybook[], total: count || 0 };
}

export async function runSimulation(
  tenantId: string,
  playbookId: string,
  baselineMetrics: unknown,
  ctx?: ServiceContext
): Promise<GuardianRemediationSimulationRun> {
  const context = await requireSupabase(ctx);

  const baselineParsed = validateBaselineMetrics(baselineMetrics);
  if (!baselineParsed.ok) {
throw new Error(`Invalid baseline_metrics: ${baselineParsed.error}`);
}

  const { data: playbook, error: playbookError } = await context.supabase
    .from("guardian_remediation_playbooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", playbookId)
    .single();

  if (playbookError || !playbook) {
throw new Error("Playbook not found");
}
  if (!playbook.is_active) {
throw new Error("Playbook is not active");
}

  const configParsed = GuardianRemediationPlaybookConfigSchema.safeParse(playbook.config);
  if (!configParsed.success) {
    throw new Error("Playbook config is invalid");
  }

  const metadata = validateSafeMetadata({ created_by: ctx?.actorId ?? null });
  invariant(metadata.ok, metadata.ok ? "" : metadata.error);

  const { data: run, error: createError } = await context.supabase
    .from("guardian_remediation_simulation_runs")
    .insert({
      tenant_id: tenantId,
      playbook_id: playbookId,
      status: "running",
      baseline_metrics: baselineParsed.value,
      simulated_metrics: {},
      delta_metrics: {},
      metadata: metadata.value,
    })
    .select("*")
    .single();

  if (createError || !run) {
throw new Error(createError?.message || "Failed to create run");
}

  try {
    const config = configParsed.data as GuardianRemediationPlaybookConfig;
    const simulated = applyActionsVirtually(baselineParsed.value, config);
    const delta = computeDeltaMetrics(baselineParsed.value, simulated);
    const overall = classifyOverallEffect(delta);
    const summary = generateSummary(overall, delta);

    const { data: updated, error: updateError } = await context.supabase
      .from("guardian_remediation_simulation_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        simulated_metrics: simulated,
        delta_metrics: delta,
        overall_effect: overall,
        summary,
      })
      .eq("tenant_id", tenantId)
      .eq("id", run.id)
      .select("*")
      .single();

    if (updateError || !updated) {
throw new Error(updateError?.message || "Failed to update run");
}
    return updated as GuardianRemediationSimulationRun;
  } catch (e: any) {
    const message = sanitizeMetadataErrorMessage(e?.message || e);
    await context.supabase
      .from("guardian_remediation_simulation_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        summary: "simulation_failed",
        metadata: { ...(run.metadata || {}), error_message: message },
      })
      .eq("tenant_id", tenantId)
      .eq("id", run.id);
    throw new Error(String(e?.message || e));
  }
}

export async function getSimulationRun(
  tenantId: string,
  runId: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationSimulationRun | null> {
  const context = await requireSupabase(ctx);

  const { data, error } = await context.supabase
    .from("guardian_remediation_simulation_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", runId)
    .maybeSingle();

  if (error) {
throw new Error(error.message);
}
  return (data as GuardianRemediationSimulationRun) || null;
}

export async function listSimulationRuns(
  tenantId: string,
  playbookId?: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationSimulationRun[]> {
  const context = await requireSupabase(ctx);

  let query = context.supabase
    .from("guardian_remediation_simulation_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (playbookId) {
    query = query.eq("playbook_id", playbookId);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(error.message);
}
  return (data || []) as GuardianRemediationSimulationRun[];
}
