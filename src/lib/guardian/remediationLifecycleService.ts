import {
  DecidePayload,
  DecidePayloadSchema,
  GuardianRemediationLifecycleRow,
  GuardianRemediationLifecycleStatus,
  GuardianRemediationLifecycleStatusSchema,
  SupersedePayloadSchema,
} from "@/lib/guardian/remediationLifecycleDomain";

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

function nowIso(): string {
  return new Date().toISOString();
}

async function requireSupabase(ctx?: ServiceContext): Promise<ServiceContext> {
  invariant(ctx?.supabase, "Missing service context: supabase");
  return ctx;
}

async function assertRecommendationExists(
  supabase: SupabaseLike,
  workspaceId: string,
  recommendationId: string
): Promise<{ id: string; created_at: string; playbook_id: string } | null> {
  const { data, error } = await supabase
    .from("guardian_remediation_recommendations")
    .select("id, created_at, playbook_id")
    .eq("workspace_id", workspaceId)
    .eq("id", recommendationId)
    .maybeSingle();

  if (error) {
throw new Error(error.message);
}
  return (data as any) || null;
}

function isTerminal(status: GuardianRemediationLifecycleStatus): boolean {
  return status !== "open";
}

export async function ensureLifecycle(
  workspaceId: string,
  recommendationId: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationLifecycleRow> {
  const context = await requireSupabase(ctx);

  const rec = await assertRecommendationExists(context.supabase, workspaceId, recommendationId);
  if (!rec) {
throw new Error("Recommendation not found");
}

  const { data: existing, error: existingError } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("recommendation_id", recommendationId)
    .maybeSingle();

  if (existingError) {
throw new Error(existingError.message);
}
  if (existing) {
return existing as GuardianRemediationLifecycleRow;
}

  const { data: created, error: createError } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .insert({
      workspace_id: workspaceId,
      recommendation_id: recommendationId,
      status: "open",
      decided_at: null,
      decided_by: null,
      reason: null,
      notes: null,
      superseded_by: null,
      updated_at: nowIso(),
    })
    .select("*")
    .single();

  if (createError) {
throw new Error(createError.message);
}
  return created as GuardianRemediationLifecycleRow;
}

export async function listLifecycle(
  workspaceId: string,
  status?: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationLifecycleRow[]> {
  const context = await requireSupabase(ctx);

  let parsedStatus: GuardianRemediationLifecycleStatus | undefined;
  if (status) {
    const s = GuardianRemediationLifecycleStatusSchema.safeParse(status);
    if (!s.success) {
throw new Error("Invalid lifecycle status");
}
    parsedStatus = s.data;
  }

  let query = context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (parsedStatus) {
query = query.eq("status", parsedStatus);
}

  const { data, error } = await query;
  if (error) {
throw new Error(error.message);
}
  return (data || []) as GuardianRemediationLifecycleRow[];
}

export async function decideRecommendation(
  workspaceId: string,
  recommendationId: string,
  decision: { status: string; reason?: string; notes?: string; decidedBy: string },
  ctx?: ServiceContext
): Promise<GuardianRemediationLifecycleRow> {
  const context = await requireSupabase(ctx);

  const parsed = DecidePayloadSchema.safeParse(decision);
  if (!parsed.success) {
throw new Error("Invalid decision");
}

  if (context.actorId && context.actorId !== parsed.data.decidedBy) {
    throw new Error("Invalid decidedBy");
  }

  const lifecycle = await ensureLifecycle(workspaceId, recommendationId, ctx);

  if (isTerminal(lifecycle.status)) {
    throw new Error("Lifecycle is terminal");
  }

  const decidedAt = nowIso();
  const updateFields: Partial<GuardianRemediationLifecycleRow> = {
    status: parsed.data.status,
    decided_at: decidedAt,
    decided_by: parsed.data.decidedBy,
    reason: parsed.data.reason ?? null,
    notes: parsed.data.notes ?? null,
    updated_at: decidedAt,
    superseded_by: null,
  };

  const { data, error } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .update(updateFields)
    .eq("workspace_id", workspaceId)
    .eq("recommendation_id", recommendationId)
    .eq("status", "open")
    .select("*")
    .maybeSingle();

  if (error) {
throw new Error(error.message);
}
  if (!data) {
throw new Error("Lifecycle is terminal");
}
  return data as GuardianRemediationLifecycleRow;
}

export async function expireStaleRecommendations(
  workspaceId: string,
  days: number = 90,
  ctx?: ServiceContext
): Promise<{ expired: number }> {
  const context = await requireSupabase(ctx);

  const expiryDays = Math.min(Math.max(Math.floor(days), 1), 3650);

  const { data: openRows, error: openError } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .select("id, recommendation_id, status")
    .eq("workspace_id", workspaceId)
    .eq("status", "open")
    .limit(500);

  if (openError) {
throw new Error(openError.message);
}
  if (!openRows || openRows.length === 0) {
return { expired: 0 };
}

  const recIds = openRows.map((r: any) => r.recommendation_id).filter(Boolean);
  const { data: recs, error: recError } = await context.supabase
    .from("guardian_remediation_recommendations")
    .select("id, created_at")
    .eq("workspace_id", workspaceId)
    .in("id", recIds);

  if (recError) {
throw new Error(recError.message);
}

  const createdAtMap = new Map<string, string>();
  for (const r of recs || []) {
    if (r?.id && r?.created_at) {
createdAtMap.set(r.id, r.created_at);
}
  }

  const now = Date.now();
  const staleIds: string[] = [];
  for (const rid of recIds) {
    const createdAt = createdAtMap.get(rid);
    if (!createdAt) {
continue;
}
    const ageDays = Math.floor((now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > expiryDays) {
staleIds.push(rid);
}
  }

  if (staleIds.length === 0) {
return { expired: 0 };
}

  const decidedAt = nowIso();

  const { error: updateError } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .update({
      status: "expired",
      decided_at: decidedAt,
      decided_by: null,
      reason: "expired_after_90_days",
      updated_at: decidedAt,
    })
    .eq("workspace_id", workspaceId)
    .in("recommendation_id", staleIds)
    .eq("status", "open");

  if (updateError) {
throw new Error(updateError.message);
}

  return { expired: staleIds.length };
}

export async function supersedeRecommendation(
  workspaceId: string,
  oldRecommendationId: string,
  newRecommendationId: string,
  ctx?: ServiceContext
): Promise<GuardianRemediationLifecycleRow> {
  const context = await requireSupabase(ctx);
  invariant(context.actorId, "Decision requires decided_by");

  const parsed = SupersedePayloadSchema.safeParse({
    oldRecommendationId,
    newRecommendationId,
  });
  if (!parsed.success) {
throw new Error("Invalid supersede payload");
}

  const oldRec = await assertRecommendationExists(
    context.supabase,
    workspaceId,
    oldRecommendationId
  );
  const newRec = await assertRecommendationExists(
    context.supabase,
    workspaceId,
    newRecommendationId
  );
  if (!oldRec || !newRec) {
throw new Error("Recommendation not found");
}

  const oldCreated = new Date(oldRec.created_at).getTime();
  const newCreated = new Date(newRec.created_at).getTime();
  if (Number.isFinite(oldCreated) && Number.isFinite(newCreated) && newCreated <= oldCreated) {
    throw new Error("New recommendation must be newer than old recommendation");
  }

  // Ensure both lifecycle rows exist (new stays open by default).
  await ensureLifecycle(workspaceId, newRecommendationId, ctx);
  const lifecycle = await ensureLifecycle(workspaceId, oldRecommendationId, ctx);

  if (isTerminal(lifecycle.status)) {
    throw new Error("Lifecycle is terminal");
  }

  const decidedAt = nowIso();
  const payload: Partial<GuardianRemediationLifecycleRow> = {
    status: "superseded",
    decided_at: decidedAt,
    decided_by: context.actorId!,
    reason: "superseded_by_new_recommendation",
    notes: null,
    superseded_by: newRecommendationId,
    updated_at: decidedAt,
  };

  const { data, error } = await context.supabase
    .from("guardian_remediation_recommendation_lifecycle")
    .update(payload)
    .eq("workspace_id", workspaceId)
    .eq("recommendation_id", oldRecommendationId)
    .eq("status", "open")
    .select("*")
    .single();

  if (error) {
throw new Error(error.message);
}
  return data as GuardianRemediationLifecycleRow;
}
