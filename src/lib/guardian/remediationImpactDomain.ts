import { z } from "zod";
import {
  GuardianRemediationDeltaMetricsSchema,
  validateSafeMetadata,
} from "@/lib/guardian/remediationSimulatorDomain";

export const GuardianRemediationDriftTypeSchema = z.enum([
  "score_decay",
  "confidence_drop",
  "effect_flip",
  "stale",
]);

export type GuardianRemediationDriftType = z.infer<typeof GuardianRemediationDriftTypeSchema>;

export const GuardianRemediationDriftSeveritySchema = z.enum(["low", "medium", "high"]);

export type GuardianRemediationDriftSeverity = z.infer<
  typeof GuardianRemediationDriftSeveritySchema
>;

export const GuardianRemediationEffectSchema = z.enum(["positive", "neutral", "negative"]);

export type GuardianRemediationEffect = z.infer<typeof GuardianRemediationEffectSchema>;

export const GuardianRemediationImpactSnapshotSchema = z
  .object({
    recommendation_id: z.string().min(10),
    observed_at: z.string().min(10),
    score_at_time: z.number().int().min(0).max(100),
    confidence_at_time: z.number().min(0).max(1),
    effect: GuardianRemediationEffectSchema,
    metrics_snapshot: GuardianRemediationDeltaMetricsSchema,
  })
  .strict();

export type GuardianRemediationImpactSnapshot = z.infer<
  typeof GuardianRemediationImpactSnapshotSchema
>;

export type GuardianRemediationRecommendationImpactRow = {
  id: string;
  workspace_id: string;
  recommendation_id: string;
  observed_at: string;
  score_at_time: number;
  confidence_at_time: number;
  effect: GuardianRemediationEffect;
  metrics_snapshot: Record<string, unknown>;
  created_at: string;
};

export type GuardianRemediationDriftEventRow = {
  id: string;
  workspace_id: string;
  recommendation_id: string;
  detected_at: string;
  drift_type: GuardianRemediationDriftType;
  severity: GuardianRemediationDriftSeverity;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function validateDriftMetadata(metadata: unknown) {
  return validateSafeMetadata(metadata, { maxDepth: 4, maxStringLength: 200 });
}

