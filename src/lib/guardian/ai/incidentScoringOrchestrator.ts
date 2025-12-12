/**
 * H04: Incident Scoring Orchestrator
 * Orchestrates full pipeline: features → scoring → persistence → triage state
 *
 * Does NOT modify core incidents table.
 * Scores are advisory only; admins manage triage via triage state table.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { buildIncidentFeatures, validateFeaturesAreSafe } from './incidentFeatureBuilder';
import { scoreIncidentHeuristic, validateScoringRationale } from './incidentScoringModel';
import { generateIncidentTriageNarrative } from './incidentTriageAiHelper';
import { logMetaAuditEvent } from './metaAuditService';

export interface ScoreAndStoreOptions {
  windowHours?: number;
  model?: 'heuristic' | 'ai';
  actor?: string;
}

export interface ScoreAndStoreResult {
  scoreId: string;
  score: number;
  band: string;
  triageId: string;
}

/**
 * Score a single incident and persist result
 */
export async function scoreAndStoreIncident(
  tenantId: string,
  incidentId: string,
  options: ScoreAndStoreOptions = {}
): Promise<ScoreAndStoreResult> {
  const supabase = getSupabaseServer();
  const windowHours = options.windowHours || 24;
  const actor = options.actor || 'system';

  try {
    // 1. Build features
    const features = await buildIncidentFeatures(tenantId, incidentId, { hours: windowHours });

    // 2. Validate features
    const featuresValidation = validateFeaturesAreSafe(features);
    if (!featuresValidation.valid) {
      throw new Error(`Feature validation failed: ${featuresValidation.errors.join('; ')}`);
    }

    // 3. Score using heuristic model
    const heuristicScore = scoreIncidentHeuristic(features);

    // 4. Validate rationale
    const rationaleValidation = validateScoringRationale(heuristicScore.rationale);
    if (!rationaleValidation.valid) {
      throw new Error(`Rationale validation failed: ${rationaleValidation.errors.join('; ')}`);
    }

    // 5. Generate optional AI narrative if allowed
    const metadata: Record<string, any> = {
      components: heuristicScore.componentScores,
    };

    if (options.model === 'ai') {
      try {
        const aiNarrative = await generateIncidentTriageNarrative(tenantId, features, heuristicScore);
        metadata.ai_narrative = aiNarrative;
      } catch {
        // If AI fails, continue with heuristic only
      }
    }

    // 6. Insert score snapshot
    const { data: scoreData, error: scoreError } = await supabase
      .from('guardian_incident_scores')
      .insert({
        tenant_id: tenantId,
        incident_id: incidentId,
        model_key: options.model === 'ai' ? 'h04_v1_ai' : 'h04_v1_heuristic',
        computed_at: new Date().toISOString(),
        score: heuristicScore.score,
        severity_band: heuristicScore.band,
        features,
        rationale: heuristicScore.rationale,
        confidence: metadata.ai_narrative?.confidence || null,
        metadata,
      })
      .select('id')
      .single();

    if (scoreError || !scoreData) {
      throw new Error(`Failed to insert score: ${scoreError?.message}`);
    }

    const scoreId = scoreData.id;

    // 7. Upsert triage state (create if missing, update last_score/last_scored_at)
    const { data: triageData, error: triageError } = await supabase
      .from('guardian_incident_triage')
      .upsert(
        {
          tenant_id: tenantId,
          incident_id: incidentId,
          last_score: heuristicScore.score,
          last_scored_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,incident_id' }
      )
      .select('id')
      .single();

    if (triageError || !triageData) {
      throw new Error(`Failed to upsert triage state: ${triageError?.message}`);
    }

    const triageId = triageData.id;

    // 8. Log audit event
    await logMetaAuditEvent({
      tenantId,
      actor,
      source: 'incident_scoring',
      action: 'score_incident',
      entityType: 'incident',
      entityId: incidentId,
      summary: `Scored incident: band=${heuristicScore.band}, score=${heuristicScore.score}`,
      details: {
        scoreId,
        model: options.model === 'ai' ? 'h04_v1_ai' : 'h04_v1_heuristic',
        band: heuristicScore.band,
        score: heuristicScore.score,
        hasAiNarrative: !!metadata.ai_narrative,
      },
    });

    return {
      scoreId,
      score: heuristicScore.score,
      band: heuristicScore.band,
      triageId,
    };
  } catch (error) {
    // Log error for debugging
    await logMetaAuditEvent({
      tenantId,
      actor,
      source: 'incident_scoring',
      action: 'score_incident_failed',
      entityType: 'incident',
      entityId: incidentId,
      summary: `Failed to score incident: ${error instanceof Error ? error.message : String(error)}`,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

export interface ScoreRecentIncidentsOptions {
  maxIncidents?: number;
  lookbackHours?: number;
}

export interface ScoreRecentIncidentsResult {
  scored: number;
  skipped: number;
  errors: string[];
}

/**
 * Score all open incidents within lookback window
 */
export async function scoreRecentIncidents(
  tenantId: string,
  options: ScoreRecentIncidentsOptions = {}
): Promise<ScoreRecentIncidentsResult> {
  const supabase = getSupabaseServer();
  const maxIncidents = options.maxIncidents || 100;
  const lookbackHours = options.lookbackHours || 24;

  const lookbackStart = new Date(Date.now() - lookbackHours * 3600 * 1000);

  // Fetch recent open incidents
  const { data: incidents, error: fetchError } = await supabase
    .from('incidents')
    .select('id')
    .eq('workspace_id', tenantId)
    .in('status', ['open', 'in_progress'])
    .gte('created_at', lookbackStart.toISOString())
    .limit(maxIncidents);

  if (fetchError || !incidents) {
    throw new Error(`Failed to fetch incidents: ${fetchError?.message}`);
  }

  const result: ScoreRecentIncidentsResult = {
    scored: 0,
    skipped: 0,
    errors: [],
  };

  // Score each incident
  for (const incident of incidents) {
    try {
      await scoreAndStoreIncident(tenantId, incident.id);
      result.scored++;
    } catch (error) {
      result.skipped++;
      result.errors.push(
        `Incident ${incident.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return result;
}

/**
 * Get latest score snapshot for an incident
 */
export async function getLatestIncidentScore(tenantId: string, incidentId: string): Promise<any | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_incident_scores')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('incident_id', incidentId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get triage state for an incident
 */
export async function getTriageState(tenantId: string, incidentId: string): Promise<any | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_incident_triage')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('incident_id', incidentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Update triage state (admin action)
 */
export async function updateTriageState(
  tenantId: string,
  incidentId: string,
  updates: {
    triage_status?: string;
    priority_override?: number | null;
    owner?: string | null;
    notes?: string | null;
    tags?: string[];
  },
  actor?: string
): Promise<any> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_incident_triage')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('incident_id', incidentId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update triage state: ${error?.message}`);
  }

  // Log audit event
  await logMetaAuditEvent({
    tenantId,
    actor: actor || 'system',
    source: 'incident_triage',
    action: 'update_triage',
    entityType: 'triage_state',
    entityId: data.id,
    summary: `Updated triage state for incident`,
    details: updates,
  });

  return data;
}
