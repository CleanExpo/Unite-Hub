/**
 * Synthex Journey Service
 *
 * Handles cohort-based journey analysis including:
 * - Cohort creation and evaluation
 * - Journey tracking and stage progression
 * - Event logging and milestone tracking
 * - Analytics and velocity metrics
 *
 * Phase: B14 - Cohort-Based Journey Analysis Engine
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

// ============================================
// Lazy Anthropic Client
// ============================================
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================
// Types
// ============================================

export type CohortRuleType =
  | 'score_above'
  | 'score_below'
  | 'tag_contains'
  | 'tag_not_contains'
  | 'stage_in'
  | 'stage_not_in'
  | 'churn_risk_above'
  | 'ltv_above'
  | 'days_inactive'
  | 'composite';

export interface CohortRule {
  type: CohortRuleType;
  threshold?: number;
  tag?: string;
  stages?: string[];
  operator?: 'and' | 'or';
  rules?: CohortRule[];
}

export interface Cohort {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  rule: CohortRule;
  isDynamic: boolean;
  refreshIntervalHours: number;
  lastEvaluatedAt: string | null;
  memberCount: number;
  avgScore: number;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CohortMember {
  id: string;
  cohortId: string;
  contactId: string;
  tenantId: string;
  joinedAt: string;
  scoreAtJoin: number;
  matchReason: Record<string, unknown>;
  isActive: boolean;
  leftAt: string | null;
  createdAt: string;
}

export type JourneyStage =
  | 'awareness'
  | 'consideration'
  | 'decision'
  | 'retention'
  | 'advocacy';

export interface Journey {
  id: string;
  tenantId: string;
  cohortId: string | null;
  contactId: string;
  currentStage: JourneyStage;
  stageScore: number;
  totalScore: number;
  stagesVisited: string[];
  stageHistory: Array<{
    stage: string;
    enteredAt: string;
    exitedAt?: string;
    score: number;
  }>;
  daysInCurrentStage: number;
  avgDaysPerStage: number | null;
  velocityScore: number | null;
  predictedNextStage: string | null;
  predictedConversionDate: string | null;
  conversionProbability: number | null;
  isActive: boolean;
  completedAt: string | null;
  droppedAt: string | null;
  dropReason: string | null;
  enteredAt: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  cohort?: Cohort;
}

export type JourneyEventType =
  | 'stage_enter'
  | 'stage_exit'
  | 'score_change'
  | 'action_taken'
  | 'milestone_reached'
  | 'automation_triggered';

export interface JourneyEvent {
  id: string;
  journeyId: string;
  tenantId: string;
  contactId: string | null;
  eventType: JourneyEventType;
  eventSource: string | null;
  payload: Record<string, unknown>;
  scoreDelta: number;
  newTotalScore: number | null;
  fromStage: string | null;
  toStage: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface JourneyAnalytics {
  id: string;
  tenantId: string;
  cohortId: string | null;
  snapshotDate: string;
  stageDistribution: Record<string, number>;
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  droppedJourneys: number;
  conversionRate: number | null;
  avgJourneyDurationDays: number | null;
  stageTransitions: Record<string, number>;
  bottleneckStages: string[];
  dropOffStages: string[];
  avgVelocityScore: number | null;
  createdAt: string;
}

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

// ============================================
// Cohort CRUD
// ============================================

export async function createCohort(
  tenantId: string,
  name: string,
  rule: CohortRule,
  options?: {
    description?: string;
    isDynamic?: boolean;
    refreshIntervalHours?: number;
    color?: string;
    icon?: string;
  }
): Promise<ServiceResult<Cohort>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_cohorts')
      .insert({
        tenant_id: tenantId,
        name,
        rule,
        description: options?.description || null,
        is_dynamic: options?.isDynamic ?? true,
        refresh_interval_hours: options?.refreshIntervalHours ?? 24,
        color: options?.color || null,
        icon: options?.icon || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: mapCohortFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.createCohort] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function listCohorts(
  tenantId: string
): Promise<ServiceResult<Cohort[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_cohorts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const cohorts = (data || []).map(mapCohortFromDb);
    return { data: cohorts, error: null };
  } catch (error) {
    console.error('[journeyService.listCohorts] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function getCohort(cohortId: string): Promise<ServiceResult<Cohort>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_cohorts')
      .select('*')
      .eq('id', cohortId)
      .single();

    if (error) throw error;

    return { data: mapCohortFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.getCohort] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function deleteCohort(cohortId: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_cohorts')
      .delete()
      .eq('id', cohortId);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error) {
    console.error('[journeyService.deleteCohort] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Cohort Evaluation (AI-Powered)
// ============================================

export async function evaluateCohort(
  tenantId: string,
  cohortId: string
): Promise<ServiceResult<{ matches: string[]; evaluated: number }>> {
  try {
    // Get cohort rule
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('synthex_cohorts')
      .select('*')
      .eq('id', cohortId)
      .single();

    if (cohortError) throw cohortError;

    // Get all contacts with their scores and lead models
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select(`
        *,
        synthex_audience_scores(*),
        synthex_lead_models(*)
      `)
      .eq('tenant_id', tenantId);

    if (contactsError) throw contactsError;

    const matches: string[] = [];
    const rule = cohort.rule as CohortRule;

    for (const contact of contacts || []) {
      const isMatch = await evaluateContactAgainstRule(contact, rule);
      if (isMatch) {
        matches.push(contact.id);

        // Add to cohort members if not already
        await supabaseAdmin
          .from('synthex_cohort_members')
          .upsert({
            cohort_id: cohortId,
            contact_id: contact.id,
            tenant_id: tenantId,
            score_at_join: contact.synthex_audience_scores?.[0]?.engagement_score || 0,
            match_reason: { rule: rule.type },
            is_active: true,
          }, {
            onConflict: 'cohort_id,contact_id',
          });
      }
    }

    // Update cohort stats
    await supabaseAdmin
      .from('synthex_cohorts')
      .update({
        member_count: matches.length,
        last_evaluated_at: new Date().toISOString(),
      })
      .eq('id', cohortId);

    return {
      data: { matches, evaluated: contacts?.length || 0 },
      error: null,
    };
  } catch (error) {
    console.error('[journeyService.evaluateCohort] Error:', error);
    return { data: null, error: error as Error };
  }
}

async function evaluateContactAgainstRule(
  contact: Record<string, unknown>,
  rule: CohortRule
): Promise<boolean> {
  const scores = (contact.synthex_audience_scores as Array<Record<string, unknown>>)?.[0];
  const leadModel = (contact.synthex_lead_models as Array<Record<string, unknown>>)?.[0];
  const tags = (contact.tags as string[]) || [];

  switch (rule.type) {
    case 'score_above':
      return (scores?.engagement_score as number || 0) >= (rule.threshold || 0);

    case 'score_below':
      return (scores?.engagement_score as number || 0) < (rule.threshold || 0);

    case 'tag_contains':
      return rule.tag ? tags.includes(rule.tag) : false;

    case 'tag_not_contains':
      return rule.tag ? !tags.includes(rule.tag) : true;

    case 'stage_in':
      const currentStage = leadModel?.current_stage as string;
      return rule.stages ? rule.stages.includes(currentStage) : false;

    case 'stage_not_in':
      const stage = leadModel?.current_stage as string;
      return rule.stages ? !rule.stages.includes(stage) : true;

    case 'churn_risk_above':
      return (leadModel?.churn_risk as number || 0) >= (rule.threshold || 0);

    case 'ltv_above':
      return (leadModel?.ltv_estimate as number || 0) >= (rule.threshold || 0);

    case 'composite':
      if (!rule.rules) return false;
      const results = await Promise.all(
        rule.rules.map((r) => evaluateContactAgainstRule(contact, r))
      );
      return rule.operator === 'or'
        ? results.some((r) => r)
        : results.every((r) => r);

    default:
      return false;
  }
}

// ============================================
// Journey CRUD
// ============================================

export async function createJourney(
  tenantId: string,
  contactId: string,
  options?: {
    cohortId?: string;
    initialStage?: JourneyStage;
  }
): Promise<ServiceResult<Journey>> {
  try {
    const stage = options?.initialStage || 'awareness';

    const { data, error } = await supabaseAdmin
      .from('synthex_journeys')
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        cohort_id: options?.cohortId || null,
        current_stage: stage,
        stages_visited: [stage],
        stage_history: [{
          stage,
          enteredAt: new Date().toISOString(),
          score: 0,
        }],
      })
      .select()
      .single();

    if (error) throw error;

    return { data: mapJourneyFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.createJourney] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function listJourneys(
  tenantId: string,
  options?: {
    cohortId?: string;
    stage?: JourneyStage;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<ServiceResult<Journey[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_journeys')
      .select('*, synthex_cohorts(*)')
      .eq('tenant_id', tenantId)
      .order('last_activity_at', { ascending: false });

    if (options?.cohortId) {
      query = query.eq('cohort_id', options.cohortId);
    }
    if (options?.stage) {
      query = query.eq('current_stage', options.stage);
    }
    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const journeys = (data || []).map((row) => {
      const journey = mapJourneyFromDb(row);
      if (row.synthex_cohorts) {
        journey.cohort = mapCohortFromDb(row.synthex_cohorts);
      }
      return journey;
    });

    return { data: journeys, error: null };
  } catch (error) {
    console.error('[journeyService.listJourneys] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function getJourney(journeyId: string): Promise<ServiceResult<Journey>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_journeys')
      .select('*, synthex_cohorts(*)')
      .eq('id', journeyId)
      .single();

    if (error) throw error;

    const journey = mapJourneyFromDb(data);
    if (data.synthex_cohorts) {
      journey.cohort = mapCohortFromDb(data.synthex_cohorts);
    }

    return { data: journey, error: null };
  } catch (error) {
    console.error('[journeyService.getJourney] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function advanceStage(
  journeyId: string,
  newStage: JourneyStage,
  scoreDelta: number = 0
): Promise<ServiceResult<Journey>> {
  try {
    // Get current journey
    const { data: current, error: getError } = await supabaseAdmin
      .from('synthex_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();

    if (getError) throw getError;

    const now = new Date().toISOString();
    const stageHistory = [...(current.stage_history || [])];

    // Close current stage
    if (stageHistory.length > 0) {
      stageHistory[stageHistory.length - 1].exitedAt = now;
    }

    // Add new stage
    stageHistory.push({
      stage: newStage,
      enteredAt: now,
      score: current.stage_score + scoreDelta,
    });

    const stagesVisited = [...new Set([...(current.stages_visited || []), newStage])];
    const newTotalScore = current.total_score + scoreDelta;

    // Update journey
    const { data, error } = await supabaseAdmin
      .from('synthex_journeys')
      .update({
        current_stage: newStage,
        stages_visited: stagesVisited,
        stage_history: stageHistory,
        stage_score: 0, // Reset stage score
        total_score: newTotalScore,
        days_in_current_stage: 0,
        last_activity_at: now,
      })
      .eq('id', journeyId)
      .select()
      .single();

    if (error) throw error;

    // Log event
    await addJourneyEvent(journeyId, current.tenant_id, 'stage_enter', {
      from_stage: current.current_stage,
      to_stage: newStage,
      payload: { scoreDelta },
      score_delta: scoreDelta,
      new_total_score: newTotalScore,
    });

    return { data: mapJourneyFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.advanceStage] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Journey Events
// ============================================

export async function addJourneyEvent(
  journeyId: string,
  tenantId: string,
  eventType: JourneyEventType,
  options?: {
    contactId?: string;
    eventSource?: string;
    payload?: Record<string, unknown>;
    score_delta?: number;
    new_total_score?: number;
    from_stage?: string;
    to_stage?: string;
  }
): Promise<ServiceResult<JourneyEvent>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_journey_events')
      .insert({
        journey_id: journeyId,
        tenant_id: tenantId,
        contact_id: options?.contactId || null,
        event_type: eventType,
        event_source: options?.eventSource || null,
        payload: options?.payload || {},
        score_delta: options?.score_delta || 0,
        new_total_score: options?.new_total_score || null,
        from_stage: options?.from_stage || null,
        to_stage: options?.to_stage || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data: mapEventFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.addJourneyEvent] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function listJourneyEvents(
  journeyId: string,
  options?: { limit?: number }
): Promise<ServiceResult<JourneyEvent[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_journey_events')
      .select('*')
      .eq('journey_id', journeyId)
      .order('occurred_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = (data || []).map(mapEventFromDb);
    return { data: events, error: null };
  } catch (error) {
    console.error('[journeyService.listJourneyEvents] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Analytics
// ============================================

export async function generateAnalytics(
  tenantId: string,
  cohortId?: string
): Promise<ServiceResult<JourneyAnalytics>> {
  try {
    let query = supabaseAdmin
      .from('synthex_journeys')
      .select('*')
      .eq('tenant_id', tenantId);

    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    }

    const { data: journeys, error } = await query;

    if (error) throw error;

    const total = journeys?.length || 0;
    const active = journeys?.filter((j) => j.is_active).length || 0;
    const completed = journeys?.filter((j) => j.completed_at).length || 0;
    const dropped = journeys?.filter((j) => j.dropped_at).length || 0;

    // Stage distribution
    const stageDistribution: Record<string, number> = {};
    for (const journey of journeys || []) {
      const stage = journey.current_stage;
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    }

    // Stage transitions (simplified)
    const stageTransitions: Record<string, number> = {};
    for (const journey of journeys || []) {
      const history = journey.stage_history || [];
      for (let i = 0; i < history.length - 1; i++) {
        const key = `${history[i].stage}_to_${history[i + 1].stage}`;
        stageTransitions[key] = (stageTransitions[key] || 0) + 1;
      }
    }

    const analytics = {
      tenant_id: tenantId,
      cohort_id: cohortId || null,
      snapshot_date: new Date().toISOString().split('T')[0],
      stage_distribution: stageDistribution,
      total_journeys: total,
      active_journeys: active,
      completed_journeys: completed,
      dropped_journeys: dropped,
      conversion_rate: total > 0 ? completed / total : null,
      stage_transitions: stageTransitions,
      bottleneck_stages: [],
      drop_off_stages: [],
    };

    // Upsert analytics
    const { data, error: upsertError } = await supabaseAdmin
      .from('synthex_journey_analytics')
      .upsert(analytics, {
        onConflict: 'tenant_id,cohort_id,snapshot_date',
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return { data: mapAnalyticsFromDb(data), error: null };
  } catch (error) {
    console.error('[journeyService.generateAnalytics] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// AI-Powered Journey Prediction
// ============================================

export async function predictNextStage(
  journeyId: string
): Promise<ServiceResult<{ nextStage: string; probability: number; reasoning: string }>> {
  try {
    const { data: journey, error: journeyError } = await supabaseAdmin
      .from('synthex_journeys')
      .select('*')
      .eq('id', journeyId)
      .single();

    if (journeyError) throw journeyError;

    const stageHistory = journey.stage_history || [];
    const currentStage = journey.current_stage;
    const daysInStage = journey.days_in_current_stage || 0;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Analyze this customer journey and predict the next stage:

Current Stage: ${currentStage}
Days in Current Stage: ${daysInStage}
Stage History: ${JSON.stringify(stageHistory)}
Total Score: ${journey.total_score}
Velocity Score: ${journey.velocity_score || 'N/A'}

Possible stages: awareness, consideration, decision, retention, advocacy

Respond in JSON format:
{
  "nextStage": "stage_name",
  "probability": 0.0-1.0,
  "reasoning": "brief explanation"
}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse prediction');

    const prediction = JSON.parse(jsonMatch[0]);

    // Update journey with prediction
    await supabaseAdmin
      .from('synthex_journeys')
      .update({
        predicted_next_stage: prediction.nextStage,
        conversion_probability: prediction.probability,
      })
      .eq('id', journeyId);

    return { data: prediction, error: null };
  } catch (error) {
    console.error('[journeyService.predictNextStage] Error:', error);
    return { data: null, error: error as Error };
  }
}

// ============================================
// Mappers
// ============================================

function mapCohortFromDb(row: Record<string, unknown>): Cohort {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    name: row.name as string,
    description: row.description as string | null,
    rule: row.rule as CohortRule,
    isDynamic: row.is_dynamic as boolean,
    refreshIntervalHours: row.refresh_interval_hours as number,
    lastEvaluatedAt: row.last_evaluated_at as string | null,
    memberCount: row.member_count as number,
    avgScore: row.avg_score as number,
    color: row.color as string | null,
    icon: row.icon as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapJourneyFromDb(row: Record<string, unknown>): Journey {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    cohortId: row.cohort_id as string | null,
    contactId: row.contact_id as string,
    currentStage: row.current_stage as JourneyStage,
    stageScore: row.stage_score as number,
    totalScore: row.total_score as number,
    stagesVisited: row.stages_visited as string[],
    stageHistory: row.stage_history as Journey['stageHistory'],
    daysInCurrentStage: row.days_in_current_stage as number,
    avgDaysPerStage: row.avg_days_per_stage as number | null,
    velocityScore: row.velocity_score as number | null,
    predictedNextStage: row.predicted_next_stage as string | null,
    predictedConversionDate: row.predicted_conversion_date as string | null,
    conversionProbability: row.conversion_probability as number | null,
    isActive: row.is_active as boolean,
    completedAt: row.completed_at as string | null,
    droppedAt: row.dropped_at as string | null,
    dropReason: row.drop_reason as string | null,
    enteredAt: row.entered_at as string,
    lastActivityAt: row.last_activity_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEventFromDb(row: Record<string, unknown>): JourneyEvent {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    tenantId: row.tenant_id as string,
    contactId: row.contact_id as string | null,
    eventType: row.event_type as JourneyEventType,
    eventSource: row.event_source as string | null,
    payload: row.payload as Record<string, unknown>,
    scoreDelta: row.score_delta as number,
    newTotalScore: row.new_total_score as number | null,
    fromStage: row.from_stage as string | null,
    toStage: row.to_stage as string | null,
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}

function mapAnalyticsFromDb(row: Record<string, unknown>): JourneyAnalytics {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    cohortId: row.cohort_id as string | null,
    snapshotDate: row.snapshot_date as string,
    stageDistribution: row.stage_distribution as Record<string, number>,
    totalJourneys: row.total_journeys as number,
    activeJourneys: row.active_journeys as number,
    completedJourneys: row.completed_journeys as number,
    droppedJourneys: row.dropped_journeys as number,
    conversionRate: row.conversion_rate as number | null,
    avgJourneyDurationDays: row.avg_journey_duration_days as number | null,
    stageTransitions: row.stage_transitions as Record<string, number>,
    bottleneckStages: row.bottleneck_stages as string[],
    dropOffStages: row.drop_off_stages as string[],
    avgVelocityScore: row.avg_velocity_score as number | null,
    createdAt: row.created_at as string,
  };
}
