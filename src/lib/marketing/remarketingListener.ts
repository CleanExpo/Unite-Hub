/**
 * Remarketing Listener Service
 * Phase 59: Ethical remarketing based on real user behavior
 */

import { getSupabaseServer } from '@/lib/supabase';
import type { LeadEvent } from './leadScoreEngine';

export type RemarketingChannel = 'email' | 'facebook' | 'instagram' | 'linkedin' | 'google';

export interface RemarketingAudience {
  id: string;
  name: string;
  description: string;
  criteria: AudienceCriteria;
  channels: RemarketingChannel[];
  created_at: string;
  member_count: number;
}

export interface AudienceCriteria {
  events: LeadEvent[];
  min_score?: number;
  max_score?: number;
  days_since_activity?: number;
  exclude_converted?: boolean;
  consent_required: boolean;
}

export interface RemarketingSequence {
  id: string;
  audience_id: string;
  name: string;
  channel: RemarketingChannel;
  duration_days: number;
  steps: SequenceStep[];
  truth_layer_compliant: boolean;
}

export interface SequenceStep {
  day: number;
  action: 'email' | 'ad_impression' | 'social_post';
  content_key: string;
  conditions?: string[];
}

// Predefined ethical audiences
export const REMARKETING_AUDIENCES: Omit<RemarketingAudience, 'id' | 'created_at' | 'member_count'>[] = [
  {
    name: 'Engaged Visitors',
    description: 'Visited pricing page but did not sign up',
    criteria: {
      events: ['pricing_view', 'cta_click'],
      exclude_converted: true,
      consent_required: true,
    },
    channels: ['email', 'facebook', 'google'],
  },
  {
    name: 'Trial Started Not Completed',
    description: 'Started signup but did not complete',
    criteria: {
      events: ['signup_start'],
      exclude_converted: true,
      consent_required: true,
    },
    channels: ['email'],
  },
  {
    name: 'Trial Users Day 7',
    description: 'Active trial users at day 7',
    criteria: {
      events: ['signup_complete', 'dashboard_first_login'],
      days_since_activity: 7,
      consent_required: true,
    },
    channels: ['email'],
  },
  {
    name: 'Inactive Activation',
    description: 'In activation but inactive 5+ days',
    criteria: {
      events: ['signup_complete'],
      days_since_activity: 5,
      consent_required: true,
    },
    channels: ['email'],
  },
];

// Ethical remarketing rules
export const REMARKETING_RULES = {
  max_sequence_days: 30,
  max_emails_per_sequence: 5,
  min_days_between_emails: 3,
  require_consent: true,
  no_false_urgency: true,
  no_fake_scarcity: true,
  clear_unsubscribe: true,
  honest_subject_lines: true,
};

/**
 * Track remarketing event
 */
export async function trackRemarketingEvent(
  userId: string,
  event: LeadEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('remarketing_events').insert({
    user_id: userId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });

  // Check audience memberships
  await updateAudienceMemberships(userId, event);
}

/**
 * Update audience memberships based on event
 */
async function updateAudienceMemberships(
  userId: string,
  event: LeadEvent
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get all audiences
  const { data: audiences } = await supabase.from('remarketing_audiences').select('*');

  for (const audience of audiences || []) {
    const criteria = audience.criteria as AudienceCriteria;

    // Check if event matches audience criteria
    if (criteria.events.includes(event)) {
      // Check consent if required
      if (criteria.consent_required) {
        const { data: consent } = await supabase
          .from('user_consents')
          .select('marketing')
          .eq('user_id', userId)
          .single();

        if (!consent?.marketing) {
continue;
}
      }

      // Add to audience
      await supabase.from('audience_members').upsert({
        audience_id: audience.id,
        user_id: userId,
        added_at: new Date().toISOString(),
      });
    }
  }
}

/**
 * Get users in audience
 */
export async function getAudienceMembers(audienceId: string): Promise<string[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('audience_members')
    .select('user_id')
    .eq('audience_id', audienceId);

  return (data || []).map((m) => m.user_id);
}

/**
 * Create remarketing sequence
 */
export async function createSequence(
  sequence: Omit<RemarketingSequence, 'id'>
): Promise<string> {
  // Validate against rules
  if (sequence.duration_days > REMARKETING_RULES.max_sequence_days) {
    throw new Error(`Sequence exceeds max duration of ${REMARKETING_RULES.max_sequence_days} days`);
  }

  const emailSteps = sequence.steps.filter((s) => s.action === 'email');
  if (emailSteps.length > REMARKETING_RULES.max_emails_per_sequence) {
    throw new Error(`Sequence exceeds max emails of ${REMARKETING_RULES.max_emails_per_sequence}`);
  }

  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('remarketing_sequences')
    .insert({
      ...sequence,
      truth_layer_compliant: true,
    })
    .select('id')
    .single();

  if (error) {
throw error;
}
  return data.id;
}

/**
 * Execute remarketing step
 */
export async function executeRemarketingStep(
  sequenceId: string,
  userId: string,
  stepIndex: number
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  // Get sequence
  const { data: sequence } = await supabase
    .from('remarketing_sequences')
    .select('*')
    .eq('id', sequenceId)
    .single();

  if (!sequence) {
return false;
}

  const steps = sequence.steps as SequenceStep[];
  const step = steps[stepIndex];

  if (!step) {
return false;
}

  // Check consent
  const { data: consent } = await supabase
    .from('user_consents')
    .select('marketing')
    .eq('user_id', userId)
    .single();

  if (!consent?.marketing) {
    // User revoked consent - remove from audience
    await supabase
      .from('audience_members')
      .delete()
      .eq('user_id', userId)
      .eq('audience_id', sequence.audience_id);
    return false;
  }

  // Execute based on action type
  switch (step.action) {
    case 'email':
      await sendRemarketingEmail(userId, step.content_key);
      break;
    case 'ad_impression':
      // Would trigger ad platform API
      break;
    case 'social_post':
      // Would schedule social post
      break;
  }

  // Log execution
  await supabase.from('remarketing_executions').insert({
    sequence_id: sequenceId,
    user_id: userId,
    step_index: stepIndex,
    executed_at: new Date().toISOString(),
  });

  return true;
}

/**
 * Send remarketing email (must be honest, not manipulative)
 */
async function sendRemarketingEmail(userId: string, contentKey: string): Promise<void> {
  // This would integrate with email service
  // Content must follow truth-layer guidelines:
  // - No fake urgency ("offer expires!")
  // - No fake scarcity ("only 3 spots left!")
  // - Honest subject lines
  // - Clear unsubscribe link
  console.log(`Would send remarketing email to ${userId} with content ${contentKey}`);
}

/**
 * Check user consent for remarketing
 */
export async function checkConsent(
  userId: string,
  channel: RemarketingChannel
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) {
return false;
}

  switch (channel) {
    case 'email':
      return data.email_marketing === true;
    case 'facebook':
    case 'instagram':
    case 'linkedin':
    case 'google':
      return data.ad_tracking === true;
    default:
      return false;
  }
}

/**
 * Update user consent
 */
export async function updateConsent(
  userId: string,
  consents: {
    email_marketing?: boolean;
    ad_tracking?: boolean;
    analytics?: boolean;
  }
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('user_consents').upsert({
    user_id: userId,
    ...consents,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Get remarketing summary
 */
export async function getRemarketingSummary(): Promise<{
  total_audiences: number;
  total_members: number;
  active_sequences: number;
  emails_sent_30d: number;
}> {
  const supabase = await getSupabaseServer();

  const { count: audiences } = await supabase
    .from('remarketing_audiences')
    .select('*', { count: 'exact', head: true });

  const { count: members } = await supabase
    .from('audience_members')
    .select('*', { count: 'exact', head: true });

  const { count: sequences } = await supabase
    .from('remarketing_sequences')
    .select('*', { count: 'exact', head: true });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: emails } = await supabase
    .from('remarketing_executions')
    .select('*', { count: 'exact', head: true })
    .gte('executed_at', thirtyDaysAgo);

  return {
    total_audiences: audiences || 0,
    total_members: members || 0,
    active_sequences: sequences || 0,
    emails_sent_30d: emails || 0,
  };
}

export default {
  REMARKETING_AUDIENCES,
  REMARKETING_RULES,
  trackRemarketingEvent,
  getAudienceMembers,
  createSequence,
  executeRemarketingStep,
  checkConsent,
  updateConsent,
  getRemarketingSummary,
};
