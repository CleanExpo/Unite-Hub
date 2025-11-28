/**
 * Relationship Timeline Service
 *
 * Builds a chronological timeline of the client relationship from email history.
 * Identifies key milestones, events, and relationship progression.
 * Part of the Client Historical Email Identity Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface TimelineEvent {
  id?: string;
  preClientId: string;
  workspaceId: string;
  eventType: EventType;
  eventDate: Date;
  summary: string;
  details?: string;
  sourceType: 'email' | 'manual' | 'ai_detected' | 'integration';
  sourceMessageId?: string;
  sourceThreadId?: string;
  significance: 'minor' | 'moderate' | 'major' | 'critical';
  metadata?: Record<string, unknown>;
}

export type EventType =
  | 'first_contact'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'proposal_accepted'
  | 'contract_signed'
  | 'project_started'
  | 'project_completed'
  | 'issue_raised'
  | 'issue_resolved'
  | 'payment_received'
  | 'renewal_discussion'
  | 'referral_made'
  | 'milestone'
  | 'communication'
  | 'decision'
  | 'other';

export interface RelationshipSummary {
  preClientId: string;
  firstContactDate: Date | null;
  lastContactDate: Date | null;
  relationshipDurationDays: number;
  totalEvents: number;
  milestoneCount: number;
  issuesCount: number;
  currentPhase: RelationshipPhase;
  engagementLevel: 'cold' | 'warm' | 'hot' | 'active';
  keyMilestones: TimelineEvent[];
  recentActivity: TimelineEvent[];
}

export type RelationshipPhase =
  | 'initial_contact'
  | 'negotiation'
  | 'active_project'
  | 'post_project'
  | 'dormant'
  | 'churned';

// Event detection patterns
const EVENT_PATTERNS: Record<EventType, RegExp[]> = {
  first_contact: [/first time|initial inquiry|reaching out|introduction/i],
  meeting_scheduled: [
    /schedule.*meeting|set up.*call|book.*time|calendar invite|zoom link|teams meeting/i,
  ],
  proposal_sent: [
    /attached.*proposal|quote attached|proposal for your review|pricing details/i,
  ],
  proposal_accepted: [
    /accept.*proposal|go ahead|proceed with|approved|let's do it|sounds good/i,
  ],
  contract_signed: [
    /signed.*contract|contract executed|agreement signed|paperwork complete/i,
  ],
  project_started: [
    /kick.*off|project started|beginning work|commenced|getting started/i,
  ],
  project_completed: [
    /project complete|delivered|finished|final delivery|wrapped up/i,
  ],
  issue_raised: [
    /issue|problem|concern|complaint|not working|disappointed|frustrated/i,
  ],
  issue_resolved: [/resolved|fixed|sorted|addressed|taken care of/i],
  payment_received: [
    /payment received|invoice paid|funds cleared|thank you for.*payment/i,
  ],
  renewal_discussion: [
    /renewal|extend.*contract|continue.*service|next phase/i,
  ],
  referral_made: [
    /refer|recommend|told.*about you|friend mentioned/i,
  ],
  milestone: [/milestone|checkpoint|phase complete|deliverable/i],
  communication: [/.*/], // Catch-all for general communications
  decision: [/decided|decision|final choice|going with|chosen/i],
  other: [/.*/],
};

class RelationshipTimelineService {
  private anthropic: Anthropic | null = null;

  private getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * Build timeline from email threads
   */
  async buildTimeline(
    preClientId: string,
    workspaceId: string
  ): Promise<TimelineEvent[]> {
    const supabase = await getSupabaseServer();

    // Fetch all threads for this pre-client
    const { data: threads, error: threadsError } = await supabase
      .from('pre_client_threads')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('first_message_at', { ascending: true });

    if (threadsError) {
      console.error('[Timeline] Failed to fetch threads:', threadsError);
      throw new Error(`Failed to fetch threads: ${threadsError.message}`);
    }

    if (!threads?.length) {
      return [];
    }

    // Fetch messages for AI analysis
    const { data: messages, error: messagesError } = await supabase
      .from('pre_client_messages')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('message_timestamp', { ascending: true });

    if (messagesError) {
      console.error('[Timeline] Failed to fetch messages:', messagesError);
    }

    const events: TimelineEvent[] = [];

    // Create first contact event
    if (threads[0]) {
      events.push({
        preClientId,
        workspaceId,
        eventType: 'first_contact',
        eventDate: new Date(threads[0].first_message_at),
        summary: `First contact established - ${threads[0].subject || 'Initial email'}`,
        sourceType: 'ai_detected',
        sourceThreadId: threads[0].id,
        significance: 'major',
      });
    }

    // Analyze each thread for events
    for (const thread of threads) {
      const threadMessages =
        messages?.filter((m) => m.thread_id === thread.id) || [];

      // Detect events in thread
      const threadEvents = await this.detectEventsInThread(
        thread,
        threadMessages,
        preClientId,
        workspaceId
      );

      events.push(...threadEvents);
    }

    // Sort events by date
    events.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

    // Save events to database
    for (const event of events) {
      await this.saveTimelineEvent(event);
    }

    return events;
  }

  /**
   * Detect events within a thread
   */
  private async detectEventsInThread(
    thread: Record<string, unknown>,
    messages: Record<string, unknown>[],
    preClientId: string,
    workspaceId: string
  ): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    if (!messages.length) {
      return events;
    }

    // Use AI to detect significant events
    const anthropic = this.getAnthropicClient();

    const threadSummary = messages
      .slice(0, 10)
      .map((m) => {
        const bodyPlain = m.body_plain as string;
        const subject = m.subject as string;
        const fromEmail = m.from_email as string;
        const timestamp = m.message_timestamp as string;
        return `[${new Date(timestamp).toISOString()}] From: ${fromEmail}\nSubject: ${subject}\nContent: ${bodyPlain?.slice(0, 300) || ''}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Analyze this email thread and identify key events/milestones.

Thread Subject: ${thread.subject}
Theme: ${thread.primary_theme}

Messages:
${threadSummary}

Identify specific events like:
- Meetings scheduled
- Proposals sent/accepted
- Projects started/completed
- Issues raised/resolved
- Payments mentioned
- Important decisions made

Respond with JSON array:
[
  {
    "eventType": "meeting_scheduled|proposal_sent|project_started|issue_raised|decision|milestone|other",
    "date": "ISO date from context or approximate",
    "summary": "brief description",
    "significance": "minor|moderate|major|critical"
  }
]

If no significant events found, return empty array: []`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return events;
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return events;
      }

      const detectedEvents = JSON.parse(jsonMatch[0]);

      for (const detected of detectedEvents) {
        if (!detected.eventType || detected.eventType === 'communication') {
          continue; // Skip generic communications
        }

        const firstMessageId = messages[0]?.id as string | undefined;
        events.push({
          preClientId,
          workspaceId,
          eventType: detected.eventType as EventType,
          eventDate: detected.date ? new Date(detected.date) : new Date(thread.first_message_at as string),
          summary: detected.summary,
          sourceType: 'ai_detected',
          sourceThreadId: thread.id as string,
          sourceMessageId: firstMessageId,
          significance: detected.significance || 'moderate',
        });
      }
    } catch (error) {
      console.error('[Timeline] Event detection error:', error);
    }

    return events;
  }

  /**
   * Save timeline event to database
   */
  async saveTimelineEvent(event: TimelineEvent): Promise<string | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('pre_client_timeline')
      .insert({
        pre_client_id: event.preClientId,
        workspace_id: event.workspaceId,
        event_type: event.eventType,
        event_date: event.eventDate.toISOString(),
        summary: event.summary,
        details: event.details,
        source_type: event.sourceType,
        source_message_id: event.sourceMessageId,
        source_thread_id: event.sourceThreadId,
        significance: event.significance,
        metadata: event.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      // Likely duplicate - ignore
      if (error.code !== '23505') {
        console.error('[Timeline] Failed to save event:', error);
      }
      return null;
    }

    return data?.id || null;
  }

  /**
   * Get timeline for a pre-client
   */
  async getTimeline(
    preClientId: string,
    workspaceId: string,
    options: {
      limit?: number;
      offset?: number;
      eventTypes?: EventType[];
      significance?: ('minor' | 'moderate' | 'major' | 'critical')[];
    } = {}
  ): Promise<TimelineEvent[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('pre_client_timeline')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('event_date', { ascending: false });

    if (options.eventTypes?.length) {
      query = query.in('event_type', options.eventTypes);
    }

    if (options.significance?.length) {
      query = query.in('significance', options.significance);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Timeline] Failed to fetch timeline:', error);
      throw new Error(`Failed to fetch timeline: ${error.message}`);
    }

    return (data || []).map((e) => ({
      id: e.id,
      preClientId: e.pre_client_id,
      workspaceId: e.workspace_id,
      eventType: e.event_type as EventType,
      eventDate: new Date(e.event_date),
      summary: e.summary,
      details: e.details,
      sourceType: e.source_type as 'email' | 'manual' | 'ai_detected' | 'integration',
      sourceMessageId: e.source_message_id,
      sourceThreadId: e.source_thread_id,
      significance: e.significance as 'minor' | 'moderate' | 'major' | 'critical',
      metadata: e.metadata,
    }));
  }

  /**
   * Generate relationship summary
   */
  async generateRelationshipSummary(
    preClientId: string,
    workspaceId: string
  ): Promise<RelationshipSummary> {
    const supabase = await getSupabaseServer();

    // Fetch all timeline events
    const { data: events, error } = await supabase
      .from('pre_client_timeline')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('[Timeline] Failed to fetch events:', error);
    }

    const timelineEvents = events || [];

    // Calculate metrics
    const firstEvent = timelineEvents[0];
    const lastEvent = timelineEvents[timelineEvents.length - 1];

    const firstContactDate = firstEvent ? new Date(firstEvent.event_date) : null;
    const lastContactDate = lastEvent ? new Date(lastEvent.event_date) : null;

    const relationshipDurationDays =
      firstContactDate && lastContactDate
        ? Math.ceil(
            (lastContactDate.getTime() - firstContactDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    const milestoneCount = timelineEvents.filter(
      (e) =>
        e.event_type === 'milestone' ||
        e.event_type === 'project_completed' ||
        e.event_type === 'contract_signed'
    ).length;

    const issuesCount = timelineEvents.filter(
      (e) => e.event_type === 'issue_raised'
    ).length;

    // Determine current phase
    const currentPhase = this.determineRelationshipPhase(timelineEvents);

    // Determine engagement level
    const engagementLevel = this.calculateEngagementLevel(
      timelineEvents,
      lastContactDate
    );

    // Key milestones (major and critical events)
    const keyMilestones = timelineEvents
      .filter(
        (e) => e.significance === 'major' || e.significance === 'critical'
      )
      .slice(-5)
      .map((e) => ({
        id: e.id,
        preClientId: e.pre_client_id,
        workspaceId: e.workspace_id,
        eventType: e.event_type as EventType,
        eventDate: new Date(e.event_date),
        summary: e.summary,
        details: e.details,
        sourceType: e.source_type as 'email' | 'manual' | 'ai_detected' | 'integration',
        sourceMessageId: e.source_message_id,
        sourceThreadId: e.source_thread_id,
        significance: e.significance as 'minor' | 'moderate' | 'major' | 'critical',
        metadata: e.metadata,
      }));

    // Recent activity (last 5 events)
    const recentActivity = timelineEvents.slice(-5).map((e) => ({
      id: e.id,
      preClientId: e.pre_client_id,
      workspaceId: e.workspace_id,
      eventType: e.event_type as EventType,
      eventDate: new Date(e.event_date),
      summary: e.summary,
      details: e.details,
      sourceType: e.source_type as 'email' | 'manual' | 'ai_detected' | 'integration',
      sourceMessageId: e.source_message_id,
      sourceThreadId: e.source_thread_id,
      significance: e.significance as 'minor' | 'moderate' | 'major' | 'critical',
      metadata: e.metadata,
    }));

    // Update pre-client with engagement level
    await supabase
      .from('pre_clients')
      .update({
        engagement_level: engagementLevel,
        first_contact_date: firstContactDate?.toISOString(),
        last_contact_date: lastContactDate?.toISOString(),
      })
      .eq('id', preClientId)
      .eq('workspace_id', workspaceId);

    return {
      preClientId,
      firstContactDate,
      lastContactDate,
      relationshipDurationDays,
      totalEvents: timelineEvents.length,
      milestoneCount,
      issuesCount,
      currentPhase,
      engagementLevel,
      keyMilestones,
      recentActivity,
    };
  }

  /**
   * Determine relationship phase based on events
   */
  private determineRelationshipPhase(
    events: Record<string, unknown>[]
  ): RelationshipPhase {
    if (!events.length) {
      return 'initial_contact';
    }

    const eventTypes = events.map((e) => e.event_type as string);
    const lastEvent = events[events.length - 1];
    const daysSinceLastEvent = Math.ceil(
      (Date.now() - new Date(lastEvent?.event_date as string).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Check for churn indicators
    if (daysSinceLastEvent > 180) {
      return 'churned';
    }

    if (daysSinceLastEvent > 90) {
      return 'dormant';
    }

    // Check for active project
    const hasProjectStarted = eventTypes.includes('project_started');
    const hasProjectCompleted = eventTypes.includes('project_completed');

    if (hasProjectStarted && !hasProjectCompleted) {
      return 'active_project';
    }

    if (hasProjectCompleted) {
      return 'post_project';
    }

    // Check for negotiation
    const hasProposal = eventTypes.includes('proposal_sent');
    const hasContract = eventTypes.includes('contract_signed');

    if (hasProposal && !hasContract) {
      return 'negotiation';
    }

    return 'initial_contact';
  }

  /**
   * Calculate engagement level based on activity
   */
  private calculateEngagementLevel(
    events: Record<string, unknown>[],
    lastContactDate: Date | null
  ): 'cold' | 'warm' | 'hot' | 'active' {
    if (!events.length || !lastContactDate) {
      return 'cold';
    }

    const daysSinceLastContact = Math.ceil(
      (Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const recentEventsCount = events.filter((e) => {
      const eventDate = new Date(e.event_date as string);
      const daysSinceEvent = Math.ceil(
        (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceEvent <= 30;
    }).length;

    // Active: contacted within 7 days with multiple recent events
    if (daysSinceLastContact <= 7 && recentEventsCount >= 3) {
      return 'active';
    }

    // Hot: contacted within 14 days with some activity
    if (daysSinceLastContact <= 14 && recentEventsCount >= 2) {
      return 'hot';
    }

    // Warm: contacted within 30 days
    if (daysSinceLastContact <= 30) {
      return 'warm';
    }

    // Cold: no recent contact
    return 'cold';
  }

  /**
   * Generate AI-powered relationship narrative
   */
  async generateRelationshipNarrative(
    preClientId: string,
    workspaceId: string
  ): Promise<string> {
    const summary = await this.generateRelationshipSummary(
      preClientId,
      workspaceId
    );
    const timeline = await this.getTimeline(preClientId, workspaceId, {
      limit: 20,
    });

    const anthropic = this.getAnthropicClient();

    const timelineText = timeline
      .reverse()
      .map(
        (e) =>
          `[${e.eventDate.toISOString().split('T')[0]}] ${e.eventType}: ${e.summary}`
      )
      .join('\n');

    const prompt = `Generate a brief narrative summary of this client relationship.

Timeline:
${timelineText}

Metrics:
- Relationship duration: ${summary.relationshipDurationDays} days
- Total events: ${summary.totalEvents}
- Milestones achieved: ${summary.milestoneCount}
- Issues encountered: ${summary.issuesCount}
- Current phase: ${summary.currentPhase}
- Engagement level: ${summary.engagementLevel}

Write a 2-3 paragraph professional summary that:
1. Describes how the relationship started and evolved
2. Highlights key milestones and any challenges overcome
3. Assesses current relationship health and potential

Keep it factual and business-focused.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return 'Unable to generate narrative.';
      }

      // Update pre-client with summary
      const supabase = await getSupabaseServer();
      await supabase
        .from('pre_clients')
        .update({ relationship_summary: content.text })
        .eq('id', preClientId)
        .eq('workspace_id', workspaceId);

      return content.text;
    } catch (error) {
      console.error('[Timeline] Narrative generation error:', error);
      return 'Unable to generate relationship narrative at this time.';
    }
  }
}

export const relationshipTimelineService = new RelationshipTimelineService();
