import {
  FeatureCatalog,
  FeatureCatalogSchema,
  PlanTier,
  PlanTierSchema,
  TierEnum,
  TierFeatureMap,
  TierFeatureMapSchema,
  validateSafeMetadata,
} from "@/lib/guardian/gtm05PricingDomain";

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

async function requireSupabase(ctx?: ServiceContext): Promise<ServiceContext> {
  invariant(ctx?.supabase, "Missing service context: supabase");
  return ctx;
}

function normalizeCatalogRow(row: any): FeatureCatalog {
  const requires = Array.isArray(row?.requires_keys) ? row.requires_keys : [];
  const requiresKeys = requires.map((x: any) => {
    if (typeof x !== "string") {
throw new Error("Invalid requires_keys value");
}
    return x;
  });

  const parsed = FeatureCatalogSchema.safeParse({ ...row, requires_keys: requiresKeys });
  if (!parsed.success) {
throw new Error(`Invalid feature catalog row: ${parsed.error.message}`);
}
  return parsed.data;
}

export async function getWorkspacePlanTier(
  workspaceId: string,
  ctx?: ServiceContext
): Promise<PlanTier | null> {
  const context = await requireSupabase(ctx);

  const { data, error } = await context.supabase
    .from("guardian_plan_tiers")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
throw new Error(error.message);
}
  if (!data) {
return null;
}

  const parsed = PlanTierSchema.safeParse(data);
  if (!parsed.success) {
throw new Error(`Invalid plan tier row: ${parsed.error.message}`);
}
  return parsed.data;
}

export async function setWorkspacePlanTier(
  workspaceId: string,
  tier: unknown,
  notes?: unknown,
  ctx?: ServiceContext
): Promise<PlanTier> {
  const context = await requireSupabase(ctx);

  const parsedTier = TierEnum.safeParse(tier);
  if (!parsedTier.success) {
throw new Error("Invalid tier");
}

  const safeNotes = notes === undefined ? null : String(notes).slice(0, 4000);
  if (safeNotes && safeNotes.includes("@")) {
throw new Error("Invalid notes");
}

  const { data, error } = await context.supabase
    .from("guardian_plan_tiers")
    .upsert(
      {
        workspace_id: workspaceId,
        tier: parsedTier.data,
        effective_from: new Date().toISOString(),
        set_by: context.actorId ?? null,
        notes: safeNotes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    )
    .select("*")
    .single();

  if (error) {
throw new Error(error.message);
}

  const parsed = PlanTierSchema.safeParse(data);
  if (!parsed.success) {
throw new Error(`Invalid plan tier row: ${parsed.error.message}`);
}
  return parsed.data;
}

export async function listFeatureCatalog(ctx?: ServiceContext): Promise<FeatureCatalog[]> {
  const context = await requireSupabase(ctx);

  const { data, error } = await context.supabase
    .from("guardian_feature_catalog")
    .select("*")
    .order("module", { ascending: true })
    .order("key", { ascending: true })
    .limit(1000);

  if (error) {
throw new Error(error.message);
}
  return (data || []).map(normalizeCatalogRow);
}

export async function listTierFeatures(
  workspaceId: string,
  tier: unknown,
  ctx?: ServiceContext
): Promise<
  Array<{
    map: TierFeatureMap | null;
    feature: FeatureCatalog;
    included: boolean;
  }>
> {
  const context = await requireSupabase(ctx);

  const parsedTier = TierEnum.safeParse(tier);
  if (!parsedTier.success) {
throw new Error("Invalid tier");
}

  const [catalog, maps] = await Promise.all([
    listFeatureCatalog(ctx),
    (async () => {
      const { data, error } = await context.supabase
        .from("guardian_tier_feature_map")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("tier", parsedTier.data)
        .order("feature_key", { ascending: true })
        .limit(2000);
      if (error) {
throw new Error(error.message);
}
      return (data || []) as any[];
    })(),
  ]);

  const mapByKey = new Map<string, TierFeatureMap>();
  for (const row of maps) {
    const parsed = TierFeatureMapSchema.safeParse(row);
    if (!parsed.success) {
throw new Error(`Invalid tier feature map row: ${parsed.error.message}`);
}
    mapByKey.set(parsed.data.feature_key, parsed.data);
  }

  return catalog.map((feature) => {
    const map = mapByKey.get(feature.key) || null;
    const included = map ? !!map.included : false;
    return { map, feature, included };
  });
}

export async function listWorkspaceFeatureMatrix(
  workspaceId: string,
  ctx?: ServiceContext
): Promise<{
  workspace_id: string;
  tiers: Array<{
    tier: "internal" | "starter" | "pro" | "enterprise";
    features: Array<{
      feature: FeatureCatalog;
      included: boolean;
      notes: string | null;
      metadata: Record<string, string | number | boolean | null>;
    }>;
  }>;
}> {
  const context = await requireSupabase(ctx);

  const tiers = ["internal", "starter", "pro", "enterprise"] as const;
  const catalog = await listFeatureCatalog(ctx);

  const { data: maps, error } = await context.supabase
    .from("guardian_tier_feature_map")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(5000);

  if (error) {
throw new Error(error.message);
}

  const mapIndex = new Map<string, TierFeatureMap>();
  for (const row of maps || []) {
    const parsed = TierFeatureMapSchema.safeParse(row);
    if (!parsed.success) {
throw new Error(`Invalid tier feature map row: ${parsed.error.message}`);
}
    mapIndex.set(`${parsed.data.tier}:${parsed.data.feature_key}`, parsed.data);
  }

  const tierBlocks = tiers.map((t) => ({
    tier: t,
    features: catalog.map((feature) => {
      const map = mapIndex.get(`${t}:${feature.key}`) || null;
      const meta = validateSafeMetadata(map?.metadata);
      if (!meta.ok) {
throw new Error(`Invalid metadata: ${meta.error}`);
}
      return {
        feature,
        included: map ? !!map.included : false,
        notes: map?.notes ?? null,
        metadata: meta.value,
      };
    }),
  }));

  return { workspace_id: workspaceId, tiers: tierBlocks };
}
