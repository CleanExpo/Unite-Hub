/**
 * Client Email Intelligence Service
 *
 * Provides aggregated email intelligence for CRM contacts.
 * Summarizes communication history, extracts insights, and tracks engagement.
 */

import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Types
// ============================================================================

export interface ClientEmailSummary {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  totalThreads: number;
  totalMessages: number;
  totalIdeas: number;
  pendingIdeas: number;
  averageSentiment: number;
  lastEmailAt: Date | null;
  firstEmailAt: Date | null;
  topIntents: string[];
  engagementScore: number; // 0-100
}

export interface ClientEmailThread {
  id: string;
  subject: string;
  snippet: string;
  messageCount: number;
  lastMessageAt: Date;
  sentimentScore: number | null;
  hasAttachments: boolean;
  isRead: boolean;
  labels: string[];
  ideas: ClientEmailIdea[];
}

export interface ClientEmailIdea {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  confidence: number;
  createdAt: Date;
}

export interface ClientCommunicationInsights {
  summary: string;
  keyTopics: string[];
  recentActivity: string;
  suggestedActions: string[];
  riskIndicators: string[];
  opportunitySignals: string[];
}

export interface ClientEmailTimelineItem {
  type: 'email' | 'idea' | 'status_change';
  date: Date;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Client Email Intelligence Service Class
// ============================================================================

class ClientEmailIntelligenceService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Get email summary for a client
   */
  async getClientEmailSummary(
    workspaceId: string,
    clientId: string
  ): Promise<ClientEmailSummary | null> {
    const supabase = await getSupabaseServer();

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from('contacts')
      .select('id, name, email')
      .eq('workspace_id', workspaceId)
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return null;
    }

    // Get aggregated stats
    const { data: stats } = await supabase.rpc('get_client_email_intelligence', {
      p_workspace_id: workspaceId,
      p_client_id: clientId,
    });

    const statRow = stats?.[0] || {};

    // Get top intents from recent messages
    const { data: intents } = await supabase
      .from('email_messages')
      .select('intent_classification')
      .eq('workspace_id', workspaceId)
      .in(
        'thread_id',
        supabase
          .from('email_threads')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('client_id', clientId)
      )
      .not('intent_classification', 'is', null)
      .limit(50);

    // Count intents
    const intentCounts = new Map<string, number>();
    for (const row of intents || []) {
      if (row.intent_classification) {
        intentCounts.set(
          row.intent_classification,
          (intentCounts.get(row.intent_classification) || 0) + 1
        );
      }
    }
    const topIntents = [...intentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([intent]) => intent);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore({
      totalMessages: statRow.total_messages || 0,
      averageSentiment: statRow.avg_sentiment || 0,
      pendingIdeas: statRow.pending_ideas || 0,
      lastEmailDaysAgo: statRow.last_email_at
        ? Math.floor(
            (Date.now() - new Date(statRow.last_email_at).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : 999,
    });

    return {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      totalThreads: statRow.total_threads || 0,
      totalMessages: statRow.total_messages || 0,
      totalIdeas: statRow.total_ideas || 0,
      pendingIdeas: statRow.pending_ideas || 0,
      averageSentiment: statRow.avg_sentiment || 0,
      lastEmailAt: statRow.last_email_at ? new Date(statRow.last_email_at) : null,
      firstEmailAt: statRow.first_email_at
        ? new Date(statRow.first_email_at)
        : null,
      topIntents,
      engagementScore,
    };
  }

  /**
   * Get email threads for a client
   */
  async getClientEmailThreads(
    workspaceId: string,
    clientId: string,
    options: {
      limit?: number;
      offset?: number;
      includeIdeas?: boolean;
    } = {}
  ): Promise<{ threads: ClientEmailThread[]; total: number }> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('email_threads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch threads: ${error.message}`);
    }

    const threads: ClientEmailThread[] = [];

    for (const t of data || []) {
      let ideas: ClientEmailIdea[] = [];

      if (options.includeIdeas) {
        const { data: ideaData } = await supabase
          .from('email_ideas')
          .select('*')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false });

        ideas = (ideaData || []).map((i) => ({
          id: i.id,
          type: i.idea_type,
          title: i.title,
          description: i.description,
          priority: i.priority,
          status: i.status,
          dueDate: i.due_date ? new Date(i.due_date) : null,
          confidence: i.confidence_score,
          createdAt: new Date(i.created_at),
        }));
      }

      threads.push({
        id: t.id,
        subject: t.subject,
        snippet: t.snippet,
        messageCount: t.message_count,
        lastMessageAt: new Date(t.last_message_at),
        sentimentScore: t.sentiment_score,
        hasAttachments: t.has_attachments,
        isRead: t.is_read,
        labels: t.labels || [],
        ideas,
      });
    }

    return { threads, total: count || 0 };
  }

  /**
   * Get all ideas for a client
   */
  async getClientIdeas(
    workspaceId: string,
    clientId: string,
    options: {
      status?: string;
      type?: string;
      priority?: string;
      limit?: number;
    } = {}
  ): Promise<ClientEmailIdea[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('email_ideas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.type) {
      query = query.eq('idea_type', options.type);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ideas: ${error.message}`);
    }

    return (data || []).map((i) => ({
      id: i.id,
      type: i.idea_type,
      title: i.title,
      description: i.description,
      priority: i.priority,
      status: i.status,
      dueDate: i.due_date ? new Date(i.due_date) : null,
      confidence: i.confidence_score,
      createdAt: new Date(i.created_at),
    }));
  }

  /**
   * Generate AI-powered communication insights
   */
  async generateCommunicationInsights(
    workspaceId: string,
    clientId: string
  ): Promise<ClientCommunicationInsights | null> {
    const supabase = await getSupabaseServer();

    // Get client details
    const { data: client } = await supabase
      .from('contacts')
      .select('name, email, company, status')
      .eq('workspace_id', workspaceId)
      .eq('id', clientId)
      .single();

    if (!client) return null;

    // Get recent email subjects and snippets
    const { data: threads } = await supabase
      .from('email_threads')
      .select('subject, snippet, sentiment_score, last_message_at')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false })
      .limit(20);

    // Get recent ideas
    const { data: ideas } = await supabase
      .from('email_ideas')
      .select('idea_type, title, description, priority, status')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!threads?.length) {
      return {
        summary: 'No email communication history with this client.',
        keyTopics: [],
        recentActivity: 'No recent activity',
        suggestedActions: ['Send an introductory email'],
        riskIndicators: [],
        opportunitySignals: [],
      };
    }

    // Build context for AI
    const threadSummaries = threads.map(
      (t) =>
        `- "${t.subject}" (${new Date(t.last_message_at).toLocaleDateString()}): ${t.snippet?.substring(0, 100)}...`
    );

    const ideaSummaries = (ideas || []).map(
      (i) => `- [${i.idea_type}] ${i.title}: ${i.description}`
    );

    const prompt = `Analyze this client communication history and provide insights:

CLIENT: ${client.name} (${client.company || 'Unknown Company'})
STATUS: ${client.status}

RECENT EMAIL THREADS:
${threadSummaries.join('\n')}

EXTRACTED INSIGHTS:
${ideaSummaries.join('\n')}

Provide a JSON response with:
{
  "summary": "Brief 2-3 sentence summary of the communication relationship",
  "keyTopics": ["Up to 5 main topics discussed"],
  "recentActivity": "One sentence about recent activity",
  "suggestedActions": ["Up to 3 specific action items"],
  "riskIndicators": ["Any warning signs or concerns"],
  "opportunitySignals": ["Any potential opportunities"]
}

Respond with valid JSON only.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return JSON.parse(content.text) as ClientCommunicationInsights;
    } catch (error) {
      console.error('[ClientEmailIntelligence] AI analysis failed:', error);
      return {
        summary: `${threads.length} email threads with this client.`,
        keyTopics: [],
        recentActivity: `Last email: ${new Date(threads[0].last_message_at).toLocaleDateString()}`,
        suggestedActions: ['Review recent communications'],
        riskIndicators: [],
        opportunitySignals: [],
      };
    }
  }

  /**
   * Get activity timeline for a client
   */
  async getClientTimeline(
    workspaceId: string,
    clientId: string,
    options: { limit?: number } = {}
  ): Promise<ClientEmailTimelineItem[]> {
    const supabase = await getSupabaseServer();
    const timeline: ClientEmailTimelineItem[] = [];

    // Get email messages
    const { data: messages } = await supabase
      .from('email_messages')
      .select('id, subject, from_email, message_date, is_incoming')
      .eq('workspace_id', workspaceId)
      .in(
        'thread_id',
        supabase
          .from('email_threads')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('client_id', clientId)
      )
      .order('message_date', { ascending: false })
      .limit(options.limit || 50);

    for (const msg of messages || []) {
      timeline.push({
        type: 'email',
        date: new Date(msg.message_date),
        title: msg.is_incoming ? 'Email received' : 'Email sent',
        description: msg.subject,
        metadata: {
          messageId: msg.id,
          fromEmail: msg.from_email,
          isIncoming: msg.is_incoming,
        },
      });
    }

    // Get ideas
    const { data: ideas } = await supabase
      .from('email_ideas')
      .select('id, idea_type, title, priority, status, created_at')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    for (const idea of ideas || []) {
      timeline.push({
        type: 'idea',
        date: new Date(idea.created_at),
        title: `${idea.idea_type} detected`,
        description: idea.title,
        metadata: {
          ideaId: idea.id,
          priority: idea.priority,
          status: idea.status,
        },
      });
    }

    // Sort by date descending
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline.slice(0, options.limit || 50);
  }

  /**
   * Update idea status
   */
  async updateIdeaStatus(
    workspaceId: string,
    ideaId: string,
    status: string,
    userId: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = { status };

    if (status === 'acknowledged') {
      updateData.acknowledged_by = userId;
      updateData.acknowledged_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('email_ideas')
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .eq('id', ideaId);

    return !error;
  }

  /**
   * Get clients with most pending action items
   */
  async getClientsWithPendingActions(
    workspaceId: string,
    limit: number = 10
  ): Promise<
    Array<{
      clientId: string;
      clientName: string;
      pendingCount: number;
      urgentCount: number;
      highCount: number;
    }>
  > {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('email_ideas')
      .select(
        `
        client_id,
        priority,
        contacts!inner(name)
      `
      )
      .eq('workspace_id', workspaceId)
      .in('status', ['new', 'acknowledged'])
      .in('idea_type', ['action_item', 'follow_up', 'deadline', 'decision_needed'])
      .not('client_id', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch pending actions: ${error.message}`);
    }

    // Aggregate by client
    const clientStats = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        pendingCount: number;
        urgentCount: number;
        highCount: number;
      }
    >();

    for (const row of data || []) {
      const existing = clientStats.get(row.client_id) || {
        clientId: row.client_id,
        clientName: (row.contacts as unknown as { name: string })?.name || 'Unknown',
        pendingCount: 0,
        urgentCount: 0,
        highCount: 0,
      };

      existing.pendingCount++;
      if (row.priority === 'urgent') existing.urgentCount++;
      if (row.priority === 'high') existing.highCount++;

      clientStats.set(row.client_id, existing);
    }

    // Sort by pending count and return top N
    return [...clientStats.values()]
      .sort((a, b) => {
        // Sort by urgent first, then high, then total
        if (a.urgentCount !== b.urgentCount) return b.urgentCount - a.urgentCount;
        if (a.highCount !== b.highCount) return b.highCount - a.highCount;
        return b.pendingCount - a.pendingCount;
      })
      .slice(0, limit);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(params: {
    totalMessages: number;
    averageSentiment: number;
    pendingIdeas: number;
    lastEmailDaysAgo: number;
  }): number {
    let score = 50; // Base score

    // Message volume factor (up to +20)
    if (params.totalMessages > 50) score += 20;
    else if (params.totalMessages > 20) score += 15;
    else if (params.totalMessages > 10) score += 10;
    else if (params.totalMessages > 5) score += 5;

    // Sentiment factor (up to +/-15)
    score += Math.round(params.averageSentiment * 15);

    // Recency factor (up to +20)
    if (params.lastEmailDaysAgo < 7) score += 20;
    else if (params.lastEmailDaysAgo < 14) score += 15;
    else if (params.lastEmailDaysAgo < 30) score += 10;
    else if (params.lastEmailDaysAgo < 60) score += 5;
    else score -= 10;

    // Pending actions factor (-5 per pending, max -10)
    score -= Math.min(params.pendingIdeas * 2, 10);

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ClientEmailIntelligenceService | null = null;

export function getClientEmailIntelligenceService(): ClientEmailIntelligenceService {
  if (!serviceInstance) {
    serviceInstance = new ClientEmailIntelligenceService();
  }
  return serviceInstance;
}

export default ClientEmailIntelligenceService;
