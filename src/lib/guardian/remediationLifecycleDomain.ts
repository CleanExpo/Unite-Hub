import { z } from "zod";

export type LifecycleStatus =
  | "open"
  | "accepted"
  | "rejected"
  | "expired"
  | "superseded";

const safeOptionalText = z
  .string()
  .max(2000)
  .refine((s) => !s.includes("@"), "must not contain '@'")
  .optional();

const safeOptionalShortText = z
  .string()
  .max(200)
  .refine((s) => !s.includes("@"), "must not contain '@'")
  .optional();

export const GuardianRemediationLifecycleStatusSchema = z.enum([
  "open",
  "accepted",
  "rejected",
  "expired",
  "superseded",
]);

export type GuardianRemediationLifecycleStatus = z.infer<
  typeof GuardianRemediationLifecycleStatusSchema
>;

export const DecidePayloadSchema = z
  .object({
    status: z.enum(["accepted", "rejected"]),
    reason: safeOptionalShortText,
    notes: safeOptionalText,
    decidedBy: z.string().min(10).max(120),
  })
  .strict();

export type DecidePayload = z.infer<typeof DecidePayloadSchema>;

export const SupersedePayloadSchema = z
  .object({
    oldRecommendationId: z.string().min(10),
    newRecommendationId: z.string().min(10),
  })
  .strict();

export type SupersedePayload = z.infer<typeof SupersedePayloadSchema>;

export type GuardianRemediationLifecycleRow = {
  id: string;
  workspace_id: string;
  recommendation_id: string;
  status: GuardianRemediationLifecycleStatus;
  decided_at: string | null;
  decided_by: string | null;
  reason: string | null;
  notes: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
};

export const LifecycleRowSchema = z
  .object({
    id: z.string().min(10),
    workspace_id: z.string().min(10),
    recommendation_id: z.string().min(10),
    status: GuardianRemediationLifecycleStatusSchema,
    decided_at: z.string().datetime().nullable(),
    decided_by: z.string().min(10).max(120).nullable(),
    reason: z.string().max(200).nullable(),
    notes: z.string().max(2000).nullable(),
    superseded_by: z.string().min(10).nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.status === "open") {
      if (row.decided_at !== null) {
ctx.addIssue({ code: "custom", message: "open must not have decided_at" });
}
      if (row.decided_by !== null) {
ctx.addIssue({ code: "custom", message: "open must not have decided_by" });
}
      if (row.superseded_by !== null) {
ctx.addIssue({ code: "custom", message: "open must not have superseded_by" });
}
      return;
    }

    // Any non-open status is a terminal decision and must have decided_at.
    if (row.decided_at === null) {
ctx.addIssue({ code: "custom", message: "terminal status requires decided_at" });
}

    if (row.status === "accepted" || row.status === "rejected" || row.status === "superseded") {
      if (row.decided_by === null) {
ctx.addIssue({ code: "custom", message: `${row.status} requires decided_by` });
}
    }

    if (row.status === "expired") {
      // System initiated only.
      if (row.decided_by !== null) {
ctx.addIssue({ code: "custom", message: "expired must not have decided_by" });
}
      if (row.superseded_by !== null) {
ctx.addIssue({ code: "custom", message: "expired must not have superseded_by" });
}
    }

    if (row.status === "superseded") {
      if (row.superseded_by === null) {
ctx.addIssue({ code: "custom", message: "superseded requires superseded_by" });
}
    } else {
      if (row.superseded_by !== null) {
ctx.addIssue({ code: "custom", message: `${row.status} must not have superseded_by` });
}
    }
  });

// Canonical export names (per I07 contract)
export const LifecycleRow = LifecycleRowSchema;
export const DecidePayload = DecidePayloadSchema;
export const SupersedePayload = SupersedePayloadSchema;
