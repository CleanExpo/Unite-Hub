import { getSupabaseServer } from '@/lib/supabase';
import { GuardianEditionProfileDefinition } from './editionProfileService';

/**
 * Input to edition fit computation
 */
export interface GuardianEditionFitInput {
  tenantId: string;
  readinessSnapshot: {
    overallScore: number;
    overallStatus: string;
    capabilities: Array<{
      capabilityKey: string;
      score: number;
      status: string;
      details: Record<string, unknown>;
    }>;
  };
  edition: GuardianEditionProfileDefinition;
}

/**
 * Capability score detail within edition fit
 */
export interface CapabilityFitScore {
  score: number;
  status: string;
  weight: number;
}

/**
 * Identified gap in edition fit
 */
export interface EditionFitGap {
  capabilityKey: string;
  label?: string;
  gapType: 'missing' | 'low_score';
  currentScore?: number;
  targetScore?: number;
}

/**
 * Result of edition fit computation
 */
export interface GuardianEditionFitResult {
  editionKey: string;
  overallFitScore: number;
  status: 'not_started' | 'emerging' | 'aligned' | 'exceeds';
  capabilityScores: Record<string, CapabilityFitScore>;
  gaps: EditionFitGap[];
}

/**
 * Status buckets for overall fit score
 */
const STATUS_THRESHOLDS = {
  not_started: { min: 0, max: 24 },
  emerging: { min: 25, max: 59 },
  aligned: { min: 60, max: 89 },
  exceeds: { min: 90, max: 100 },
};

/**
 * Get tier-specific low-score threshold
 * Stricter editions require higher capability scores
 */
function getLowScoreThreshold(tier: string): number {
  switch (tier) {
    case 'core':
      return 40;
    case 'pro':
      return 60;
    case 'elite':
      return 75;
    case 'custom':
      return 50;
    default:
      return 50;
  }
}

/**
 * Map overall fit score to status bucket
 */
function scoreToStatus(score: number): 'not_started' | 'emerging' | 'aligned' | 'exceeds' {
  if (score < 25) return 'not_started';
  if (score < 60) return 'emerging';
  if (score < 90) return 'aligned';
  return 'exceeds';
}

/**
 * Compute edition fit for a single tenant + edition pair
 * Pure function: no side effects
 */
export function computeEditionFitForTenant(
  input: GuardianEditionFitInput
): GuardianEditionFitResult {
  const { tenantId, readinessSnapshot, edition } = input;

  const capabilityScores: Record<string, CapabilityFitScore> = {};
  const gaps: EditionFitGap[] = [];
  const requiredCapabilities = edition.capabilitiesRequired || [];
  const niceToHaveCapabilities = edition.capabilitiesNiceToHave || [];

  // Build capability score map from readiness snapshot
  const readinessMap = new Map(
    readinessSnapshot.capabilities.map((c) => [c.capabilityKey, c])
  );

  // Threshold for considering a score "low"
  const lowScoreThreshold = getLowScoreThreshold(edition.tier);

  // Process required capabilities
  let requiredWeightedSum = 0;
  let requiredWeightSum = 0;

  for (const capKey of requiredCapabilities) {
    const readinessCap = readinessMap.get(capKey);
    const weight = 1.0; // Equal weight for required capabilities

    if (!readinessCap) {
      // Missing capability
      capabilityScores[capKey] = { score: 0, status: 'not_configured', weight };
      gaps.push({
        capabilityKey: capKey,
        gapType: 'missing',
        targetScore: 60, // Suggest reaching "ready" status
      });
      // Missing capabilities contribute 0 to weighted sum
    } else if (readinessCap.score < lowScoreThreshold) {
      // Low-scoring capability
      capabilityScores[capKey] = {
        score: readinessCap.score,
        status: readinessCap.status,
        weight,
      };
      gaps.push({
        capabilityKey: capKey,
        gapType: 'low_score',
        currentScore: readinessCap.score,
        targetScore: lowScoreThreshold,
      });
      requiredWeightedSum += readinessCap.score * weight;
      requiredWeightSum += weight;
    } else {
      // Capability is at target level
      capabilityScores[capKey] = {
        score: readinessCap.score,
        status: readinessCap.status,
        weight,
      };
      requiredWeightedSum += readinessCap.score * weight;
      requiredWeightSum += weight;
    }
  }

  // Process nice-to-have capabilities (lower weight)
  const niceWeight = 0.5;
  for (const capKey of niceToHaveCapabilities) {
    const readinessCap = readinessMap.get(capKey);

    if (readinessCap) {
      capabilityScores[capKey] = {
        score: readinessCap.score,
        status: readinessCap.status,
        weight: niceWeight,
      };
      requiredWeightedSum += readinessCap.score * niceWeight;
      requiredWeightSum += niceWeight;
    }
  }

  // Calculate overall fit score
  const overallFitScore =
    requiredWeightSum > 0 ? Math.round(requiredWeightedSum / requiredWeightSum) : 0;
  const status = scoreToStatus(overallFitScore);

  return {
    editionKey: edition.key,
    overallFitScore: Math.max(0, Math.min(100, overallFitScore)),
    status,
    capabilityScores,
    gaps,
  };
}

/**
 * Compute edition fit snapshots for all active editions for a tenant
 * Loads readiness snapshot and computes fit for each edition
 */
export async function computeEditionFitSnapshotForTenant(
  tenantId: string,
  editions: GuardianEditionProfileDefinition[],
  now: Date = new Date()
): Promise<GuardianEditionFitResult[]> {
  const supabase = getSupabaseServer();

  // Load latest readiness snapshot
  const { data: latestReadiness, error: readinessError } = await supabase
    .from('guardian_tenant_readiness_scores')
    .select(
      `
      computed_at,
      overall_guardian_score,
      overall_status,
      capability_key,
      score,
      status,
      details
      `
    )
    .eq('workspace_id', tenantId)
    .order('computed_at', { ascending: false })
    .limit(50);

  if (readinessError) {
    throw new Error(`Failed to load readiness snapshot: ${readinessError.message}`);
  }

  if (!latestReadiness || latestReadiness.length === 0) {
    // No readiness data; return empty snapshot
    return editions.map((edition) => ({
      editionKey: edition.key,
      overallFitScore: 0,
      status: 'not_started',
      capabilityScores: {},
      gaps: edition.capabilitiesRequired.map((capKey) => ({
        capabilityKey: capKey,
        gapType: 'missing',
        targetScore: 60,
      })),
    }));
  }

  // Group readiness by computed_at to get latest snapshot
  const latestComputedAt = latestReadiness[0].computed_at;
  const snapshot = latestReadiness.filter((r: any) => r.computed_at === latestComputedAt);

  // Build readiness snapshot object
  const readinessSnapshot = {
    overallScore: snapshot[0].overall_guardian_score ?? 0,
    overallStatus: snapshot[0].overall_status ?? 'baseline',
    capabilities: snapshot.map((r: any) => ({
      capabilityKey: r.capability_key,
      score: r.score,
      status: r.status,
      details: r.details || {},
    })),
  };

  // Compute fit for each edition
  return editions
    .filter((edition) => edition.isActive !== false)
    .map((edition) =>
      computeEditionFitForTenant({
        tenantId,
        readinessSnapshot,
        edition,
      })
    );
}

/**
 * Persist edition fit snapshots to database
 * Appends new rows without deleting history
 */
export async function persistEditionFitSnapshotForTenant(
  tenantId: string,
  editions: GuardianEditionProfileDefinition[],
  now: Date = new Date()
): Promise<void> {
  // Compute fit results
  const fitResults = await computeEditionFitSnapshotForTenant(tenantId, editions, now);

  // Persist to database
  const supabase = getSupabaseServer();

  const rowsToInsert = fitResults.map((result) => ({
    tenant_id: tenantId,
    edition_key: result.editionKey,
    computed_at: now,
    overall_fit_score: result.overallFitScore,
    status: result.status,
    capability_scores: result.capabilityScores,
    gaps: result.gaps,
    recommendations_summary: {}, // Can be populated later
    metadata: {},
  }));

  const { error } = await supabase
    .from('guardian_tenant_edition_fit')
    .insert(rowsToInsert);

  if (error) {
    throw new Error(`Failed to persist edition fit snapshot: ${error.message}`);
  }

  console.log(
    `✓ Persisted edition fit snapshot for tenant ${tenantId} (${fitResults.length} editions)`
  );
}

/**
 * Load latest edition fit snapshot for a tenant + specific edition
 */
export async function loadLatestEditionFitForTenant(
  tenantId: string,
  editionKey: string
): Promise<GuardianEditionFitResult | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_tenant_edition_fit')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('edition_key', editionKey)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to load edition fit: ${error.message}`);
  }

  return {
    editionKey: data.edition_key,
    overallFitScore: data.overall_fit_score,
    status: data.status,
    capabilityScores: data.capability_scores,
    gaps: data.gaps,
  };
}

/**
 * Load all latest edition fit snapshots for a tenant
 */
export async function loadLatestEditionFitsForTenant(
  tenantId: string
): Promise<GuardianEditionFitResult[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_tenant_edition_fit')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('computed_at', { ascending: false })
    .limit(100); // Get up to 100 recent entries (multiple editions)

  if (error) {
    throw new Error(`Failed to load edition fits: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Find latest computed_at and filter to only those
  const latestComputedAt = data[0].computed_at;
  const latestSnapshot = data.filter((d) => d.computed_at === latestComputedAt);

  return latestSnapshot.map((row) => ({
    editionKey: row.edition_key,
    overallFitScore: row.overall_fit_score,
    status: row.status,
    capabilityScores: row.capability_scores,
    gaps: row.gaps,
  }));
}
