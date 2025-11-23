/**
 * Lead Score Engine
 * Phase 59: Real-data lead scoring without fake urgency
 */

import { getSupabaseServer } from '@/lib/supabase';

// Lead funnel stages
export type FunnelStage =
  | 'visitor'
  | 'engaged'
  | 'lead'
  | 'trial'
  | 'early_activation'
  | 'activation_day_30'
  | 'activation_day_60'
  | 'activation_day_90';

// Events for scoring
export type LeadEvent =
  | 'scroll_depth'
  | 'cta_click'
  | 'pricing_view'
  | 'signup_start'
  | 'signup_complete'
  | 'dashboard_first_login'
  | 'first_action'
  | 'first_visual'
  | 'first_strategy_pack'
  | 'first_success_score';

export interface LeadScore {
  score: number;
  stage: FunnelStage;
  signals: string[];
  last_activity: string;
  days_in_stage: number;
  conversion_likelihood: 'low' | 'medium' | 'high';
}

export interface LeadProfile {
  id: string;
  email: string;
  name?: string;
  industry?: string;
  source: string;
  created_at: string;
  score: LeadScore;
  events: LeadEventRecord[];
}

export interface LeadEventRecord {
  event: LeadEvent;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Event point values (real behavior signals only)
const EVENT_POINTS: Record<LeadEvent, number> = {
  scroll_depth: 5,
  cta_click: 10,
  pricing_view: 15,
  signup_start: 20,
  signup_complete: 30,
  dashboard_first_login: 15,
  first_action: 20,
  first_visual: 25,
  first_strategy_pack: 30,
  first_success_score: 35,
};

// Stage thresholds
const STAGE_THRESHOLDS: Record<FunnelStage, number> = {
  visitor: 0,
  engaged: 10,
  lead: 30,
  trial: 50,
  early_activation: 70,
  activation_day_30: 85,
  activation_day_60: 100,
  activation_day_90: 120,
};

/**
 * Calculate lead score from events
 */
export function calculateLeadScore(events: LeadEventRecord[]): number {
  let score = 0;

  for (const event of events) {
    score += EVENT_POINTS[event.event] || 0;
  }

  // Cap score at 150 to prevent inflation
  return Math.min(score, 150);
}

/**
 * Determine funnel stage from score
 */
export function getFunnelStage(score: number): FunnelStage {
  if (score >= STAGE_THRESHOLDS.activation_day_90) return 'activation_day_90';
  if (score >= STAGE_THRESHOLDS.activation_day_60) return 'activation_day_60';
  if (score >= STAGE_THRESHOLDS.activation_day_30) return 'activation_day_30';
  if (score >= STAGE_THRESHOLDS.early_activation) return 'early_activation';
  if (score >= STAGE_THRESHOLDS.trial) return 'trial';
  if (score >= STAGE_THRESHOLDS.lead) return 'lead';
  if (score >= STAGE_THRESHOLDS.engaged) return 'engaged';
  return 'visitor';
}

/**
 * Get conversion likelihood based on signals
 */
export function getConversionLikelihood(
  score: number,
  events: LeadEventRecord[]
): 'low' | 'medium' | 'high' {
  // High value events
  const hasHighValueEvents = events.some((e) =>
    ['first_strategy_pack', 'first_visual', 'first_success_score'].includes(e.event)
  );

  // Multiple interactions
  const interactionCount = events.length;

  if (score >= 70 && hasHighValueEvents) return 'high';
  if (score >= 40 || interactionCount >= 5) return 'medium';
  return 'low';
}

/**
 * Generate signals from events
 */
export function generateSignals(events: LeadEventRecord[]): string[] {
  const signals: string[] = [];

  // Check for specific behaviors
  if (events.some((e) => e.event === 'pricing_view')) {
    signals.push('Viewed pricing - evaluating options');
  }

  if (events.some((e) => e.event === 'signup_complete')) {
    signals.push('Completed signup - ready for trial');
  }

  if (events.some((e) => e.event === 'first_strategy_pack')) {
    signals.push('Generated strategy pack - engaged with core value');
  }

  if (events.some((e) => e.event === 'first_visual')) {
    signals.push('Created visual content - exploring capabilities');
  }

  // Check for recency
  const recent = events.filter((e) => {
    const age = Date.now() - new Date(e.timestamp).getTime();
    return age < 7 * 24 * 60 * 60 * 1000; // 7 days
  });

  if (recent.length >= 3) {
    signals.push('Active in last 7 days');
  }

  // Note: NO fake urgency signals like "limited time" or "competitors viewing"

  return signals;
}

/**
 * Track a lead event
 */
export async function trackLeadEvent(
  leadId: string,
  event: LeadEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('lead_events').insert({
    lead_id: leadId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });

  // Update lead score
  await updateLeadScore(leadId);
}

/**
 * Update lead score from all events
 */
export async function updateLeadScore(leadId: string): Promise<LeadScore> {
  const supabase = await getSupabaseServer();

  // Get all events for lead
  const { data: events, error } = await supabase
    .from('lead_events')
    .select('event, created_at, metadata')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error || !events) {
    return {
      score: 0,
      stage: 'visitor',
      signals: [],
      last_activity: new Date().toISOString(),
      days_in_stage: 0,
      conversion_likelihood: 'low',
    };
  }

  const eventRecords: LeadEventRecord[] = events.map((e) => ({
    event: e.event as LeadEvent,
    timestamp: e.created_at,
    metadata: e.metadata,
  }));

  const score = calculateLeadScore(eventRecords);
  const stage = getFunnelStage(score);
  const signals = generateSignals(eventRecords);
  const likelihood = getConversionLikelihood(score, eventRecords);

  const lastActivity = eventRecords.length > 0
    ? eventRecords[eventRecords.length - 1].timestamp
    : new Date().toISOString();

  // Get days in current stage
  const stageEntryEvent = eventRecords.find((e) => {
    const eventScore = calculateLeadScore(eventRecords.filter(
      (ev) => new Date(ev.timestamp) <= new Date(e.timestamp)
    ));
    return getFunnelStage(eventScore) === stage;
  });

  const daysInStage = stageEntryEvent
    ? Math.floor((Date.now() - new Date(stageEntryEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const leadScore: LeadScore = {
    score,
    stage,
    signals,
    last_activity: lastActivity,
    days_in_stage: daysInStage,
    conversion_likelihood: likelihood,
  };

  // Store updated score
  await supabase
    .from('leads')
    .update({ score: leadScore })
    .eq('id', leadId);

  return leadScore;
}

/**
 * Get lead profile with score
 */
export async function getLeadProfile(leadId: string): Promise<LeadProfile | null> {
  const supabase = await getSupabaseServer();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) return null;

  const { data: events } = await supabase
    .from('lead_events')
    .select('event, created_at, metadata')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  return {
    id: lead.id,
    email: lead.email,
    name: lead.name,
    industry: lead.industry,
    source: lead.source,
    created_at: lead.created_at,
    score: lead.score || {
      score: 0,
      stage: 'visitor',
      signals: [],
      last_activity: lead.created_at,
      days_in_stage: 0,
      conversion_likelihood: 'low',
    },
    events: (events || []).map((e) => ({
      event: e.event as LeadEvent,
      timestamp: e.created_at,
      metadata: e.metadata,
    })),
  };
}

/**
 * Get leads by funnel stage
 */
export async function getLeadsByStage(stage: FunnelStage): Promise<LeadProfile[]> {
  const supabase = await getSupabaseServer();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('score->stage', stage);

  if (error || !leads) return [];

  // Get events for each lead
  const profiles: LeadProfile[] = [];
  for (const lead of leads) {
    const profile = await getLeadProfile(lead.id);
    if (profile) profiles.push(profile);
  }

  return profiles;
}

/**
 * Get funnel summary
 */
export async function getFunnelSummary(): Promise<Record<FunnelStage, number>> {
  const supabase = await getSupabaseServer();

  const { data: leads } = await supabase.from('leads').select('score');

  const summary: Record<FunnelStage, number> = {
    visitor: 0,
    engaged: 0,
    lead: 0,
    trial: 0,
    early_activation: 0,
    activation_day_30: 0,
    activation_day_60: 0,
    activation_day_90: 0,
  };

  for (const lead of leads || []) {
    const stage = lead.score?.stage || 'visitor';
    summary[stage as FunnelStage]++;
  }

  return summary;
}

export default {
  EVENT_POINTS,
  STAGE_THRESHOLDS,
  calculateLeadScore,
  getFunnelStage,
  getConversionLikelihood,
  generateSignals,
  trackLeadEvent,
  updateLeadScore,
  getLeadProfile,
  getLeadsByStage,
  getFunnelSummary,
};
