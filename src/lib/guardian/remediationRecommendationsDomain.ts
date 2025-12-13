import { z } from "zod";
import {
  GuardianRemediationDeltaMetricsSchema,
  GuardianRemediationOverallEffect,
} from "@/lib/guardian/remediationSimulatorDomain";

export const GuardianRemediationRecommendationEffectSchema = z.enum([
  "positive",
  "neutral",
  "negative",
]);

export type GuardianRemediationRecommendationEffect = z.infer<
  typeof GuardianRemediationRecommendationEffectSchema
>;

export const GuardianRemediationRecommendationScoreSchema = z
  .number()
  .min(0)
  .max(100);

export const GuardianRemediationRecommendationConfidenceSchema = z
  .number()
  .min(0)
  .max(1);

export const GuardianRemediationRecommendationRationaleSchema = z
  .string()
  .min(1)
  .max(2000)
  .refine((s) => !s.includes("@"), "must not contain '@'");

export const GuardianRemediationRecommendationMetricsSnapshotSchema =
  GuardianRemediationDeltaMetricsSchema.strict();

export type GuardianRemediationRecommendationMetricsSnapshot = z.infer<
  typeof GuardianRemediationRecommendationMetricsSnapshotSchema
>;

export type GuardianRemediationRecommendation = {
  id: string;
  workspace_id: string;
  playbook_id: string;
  simulation_run_id: string;
  score: number;
  confidence: number;
  effect: GuardianRemediationRecommendationEffect;
  rationale: string;
  metrics_snapshot: GuardianRemediationRecommendationMetricsSnapshot;
  created_at: string;
};

export type GuardianRemediationScoringInput = {
  delta_metrics: GuardianRemediationRecommendationMetricsSnapshot;
  overall_effect: GuardianRemediationOverallEffect;
};

