import { z } from "zod";

const safeIdentifier = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9._:-]+$/, "invalid identifier");

const safeHumanText = z
  .string()
  .min(1)
  .max(200)
  .refine((s) => !s.includes("@"), "must not contain '@'");

const safeOptionalText = z
  .string()
  .max(2000)
  .refine((s) => !s.includes("@"), "must not contain '@'")
  .optional();

export const GuardianRemediationActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("adjust_rule_threshold"),
    rule_id: safeIdentifier,
    metric: z.enum(["severity", "threshold", "confidence"]),
    delta: z.number().min(-50).max(50),
  }),
  z.object({
    type: z.literal("disable_rule"),
    rule_id: safeIdentifier,
  }),
  z.object({
    type: z.literal("adjust_correlation_window"),
    window_minutes_delta: z.number().min(-30).max(120),
  }),
  z.object({
    type: z.literal("increase_min_link_count"),
    delta: z.number().int().min(1).max(5),
  }),
  z.object({
    type: z.literal("suppress_notification_channel"),
    channel: z.enum(["email", "slack", "webhook", "pagerduty"]),
    duration_minutes: z.number().int().min(15).max(1440),
  }),
]);

export type GuardianRemediationAction = z.infer<typeof GuardianRemediationActionSchema>;

export const GuardianRemediationPlaybookConfigSchema = z
  .object({
    actions: z.array(GuardianRemediationActionSchema).min(1).max(20),
    notes: safeOptionalText,
  })
  .strict();

export type GuardianRemediationPlaybookConfig = z.infer<
  typeof GuardianRemediationPlaybookConfigSchema
>;

export const GuardianRemediationAggregateMetricsSchema = z
  .object({
    alerts_total: z.number().int().nonnegative(),
    alerts_by_severity: z
      .record(z.string().min(1).max(32), z.number().int().nonnegative())
      .optional(),
    incidents_total: z.number().int().nonnegative(),
    incidents_by_status: z
      .record(z.string().min(1).max(32), z.number().int().nonnegative())
      .optional(),
    correlations_total: z.number().int().nonnegative(),
    notifications_total: z.number().int().nonnegative(),
    avg_risk_score: z.number().nonnegative(),
    window_days: z.number().int().positive().max(365).optional(),
  })
  .strict();

export type GuardianRemediationAggregateMetrics = z.infer<
  typeof GuardianRemediationAggregateMetricsSchema
>;

export const GuardianRemediationDeltaMetricsSchema = z
  .object({
    alerts_delta: z.number(),
    alerts_pct: z.number(),
    incidents_delta: z.number(),
    incidents_pct: z.number(),
    correlations_delta: z.number(),
    correlations_pct: z.number(),
    notifications_delta: z.number(),
    notifications_pct: z.number(),
    avg_risk_score_delta: z.number(),
    avg_risk_score_pct: z.number(),
  })
  .strict();

export type GuardianRemediationDeltaMetrics = z.infer<
  typeof GuardianRemediationDeltaMetricsSchema
>;

export const GuardianRemediationSimulationStatusSchema = z.enum([
  "running",
  "completed",
  "failed",
]);

export const GuardianRemediationOverallEffectSchema = z.enum([
  "positive",
  "neutral",
  "negative",
]);

export type GuardianRemediationSimulationStatus = "running" | "completed" | "failed";
export type GuardianRemediationOverallEffect = "positive" | "neutral" | "negative";

export type GuardianRemediationPlaybook = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  config: GuardianRemediationPlaybookConfig;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GuardianRemediationSimulationRun = {
  id: string;
  tenant_id: string;
  playbook_id: string;
  created_at: string;
  started_at: string;
  finished_at: string | null;
  status: GuardianRemediationSimulationStatus;
  baseline_metrics: GuardianRemediationAggregateMetrics;
  simulated_metrics: Record<string, unknown>;
  delta_metrics: Record<string, unknown>;
  overall_effect: GuardianRemediationOverallEffect | null;
  summary: string | null;
  metadata: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function validateSafeMetadata(
  value: unknown,
  options?: { maxDepth?: number; maxStringLength?: number }
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const maxDepth = options?.maxDepth ?? 4;
  const maxStringLength = options?.maxStringLength ?? 200;

  const visit = (v: unknown, depth: number): boolean => {
    if (depth > maxDepth) {
return false;
}
    if (v === null) {
return true;
}
    if (typeof v === "number" || typeof v === "boolean") {
return true;
}
    if (typeof v === "string") {
      if (v.length > maxStringLength) {
return false;
}
      if (v.includes("@")) {
return false;
}
      return true;
    }
    if (Array.isArray(v)) {
return v.every((x) => visit(x, depth + 1));
}
    if (isPlainObject(v)) {
return Object.values(v).every((x) => visit(x, depth + 1));
}
    return false;
  };

  if (value === undefined || value === null) {
return { ok: true, value: {} };
}
  if (!isPlainObject(value)) {
return { ok: false, error: "metadata must be an object" };
}
  if (!visit(value, 0)) {
return { ok: false, error: "metadata contains unsupported or unsafe values" };
}
  return { ok: true, value };
}

export function validatePlaybookPayload(payload: unknown): {
  ok: true;
  value: {
    name: string;
    description?: string | null;
    category?: string;
    config: GuardianRemediationPlaybookConfig;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
  };
} | { ok: false; error: string } {
  const schema = z
    .object({
      name: safeHumanText,
      description: safeOptionalText.nullable().optional(),
      category: z.string().min(1).max(64).optional(),
      config: GuardianRemediationPlaybookConfigSchema,
      is_active: z.boolean().optional(),
      metadata: z.unknown().optional(),
    })
    .strict();

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
return { ok: false, error: parsed.error.message };
}

  const meta = validateSafeMetadata(parsed.data.metadata);
  if (!meta.ok) {
return { ok: false, error: meta.error };
}

  return { ok: true, value: { ...parsed.data, metadata: meta.value } };
}

export function validateBaselineMetrics(payload: unknown): {
  ok: true;
  value: GuardianRemediationAggregateMetrics;
} | { ok: false; error: string } {
  const parsed = GuardianRemediationAggregateMetricsSchema.safeParse(payload);
  if (!parsed.success) {
return { ok: false, error: parsed.error.message };
}
  return { ok: true, value: parsed.data };
}
