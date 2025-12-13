import { z } from "zod";

export const TierEnum = z.enum(["internal", "starter", "pro", "enterprise"]);
export type TierEnum = z.infer<typeof TierEnum>;

export const ModuleEnum = z.enum(["G", "H", "I", "Z", "GTM"]);
export type ModuleEnum = z.infer<typeof ModuleEnum>;

const uuidString = z.string().min(10).max(64);
const safeOptionalText = z
  .string()
  .max(4000)
  .refine((s) => !s.includes("@"), "must not contain '@'")
  .nullable()
  .optional();

const safeMetadata = z
  .record(z.string().min(1).max(64), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .default({});

export const PlanTierSchema = z
  .object({
    workspace_id: uuidString,
    tier: TierEnum,
    effective_from: z.string().datetime(),
    set_by: z.string().max(120).nullable(),
    notes: z.string().max(4000).nullable(),
    metadata: safeMetadata,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict();

export type PlanTier = z.infer<typeof PlanTierSchema>;

export const FeatureCatalogSchema = z
  .object({
    key: z.string().min(1).max(120),
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    module: ModuleEnum,
    route: z.string().max(400).nullable(),
    docs_ref: z.string().max(400).nullable(),
    requires_keys: z.array(z.string().min(1).max(120)),
    is_available: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict();

export type FeatureCatalog = z.infer<typeof FeatureCatalogSchema>;

export const TierFeatureMapSchema = z
  .object({
    workspace_id: uuidString,
    tier: TierEnum,
    feature_key: z.string().min(1).max(120),
    included: z.boolean(),
    notes: z.string().max(4000).nullable(),
    metadata: safeMetadata,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict();

export type TierFeatureMap = z.infer<typeof TierFeatureMapSchema>;

export const SetPlanTierPayloadSchema = z
  .object({
    tier: TierEnum,
    notes: safeOptionalText,
    metadata: safeMetadata.optional(),
  })
  .strict();

export type SetPlanTierPayload = z.infer<typeof SetPlanTierPayloadSchema>;

export function validateSafeMetadata(value: unknown) {
  // Keep metadata deterministic and PII-free by convention (no nested objects/arrays).
  const parsed = safeMetadata.safeParse(value);
  if (!parsed.success) {
return { ok: false as const, error: parsed.error.message };
}
  return { ok: true as const, value: parsed.data };
}
