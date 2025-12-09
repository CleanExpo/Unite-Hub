/**
 * Thread Cluster Service
 *
 * Clusters email messages into threads and identifies themes using AI.
 * Part of the Client Historical Email Identity Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface ThreadClusterConfig {
  preClientId: string;
  workspaceId: string;
}

export interface ClusteredThread {
  threadId: string;
  subject: string;
  messageCount: number;
  firstMessageAt: Date;
  lastMessageAt: Date;
  participants: string[];
  primaryTheme: string;
  themes: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  importance: 'low' | 'medium' | 'high' | 'critical';
  hasUnresolvedItems: boolean;
  requiresFollowup: boolean;
}

export interface ThemeClassification {
  primary: string;
  secondary: string[];
  confidence: number;
}

export interface MessageForClustering {
  id: string;
  externalId: string;
  subject: string;
  fromEmail: string;
  toEmails: string[];
  bodyPlain: string;
  messageTimestamp: Date;
  inReplyTo?: string;
  references?: string[];
}

// Theme categories for classification
const THEME_CATEGORIES = [
  'project_discussion',
  'proposal_negotiation',
  'support_request',
  'meeting_scheduling',
  'invoice_payment',
  'feedback_review',
  'contract_legal',
  'technical_issue',
  'onboarding',
  'general_inquiry',
  'follow_up',
  'urgent_matter',
  'relationship_building',
  'complaint',
  'referral',
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

class ThreadClusterService {
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
   * Cluster messages into threads based on references and subject similarity
   */
  async clusterMessages(
    messages: MessageForClustering[],
    config: ThreadClusterConfig
  ): Promise<Map<string, MessageForClustering[]>> {
    const threads = new Map<string, MessageForClustering[]>();
    const messageToThread = new Map<string, string>();

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) => a.messageTimestamp.getTime() - b.messageTimestamp.getTime()
    );

    for (const message of sortedMessages) {
      let threadId: string | null = null;

      // Check if this message references another message
      if (message.inReplyTo) {
        threadId = messageToThread.get(message.inReplyTo) || null;
      }

      // Check references array
      if (!threadId && message.references?.length) {
        for (const ref of message.references) {
          const refThreadId = messageToThread.get(ref);
          if (refThreadId) {
            threadId = refThreadId;
            break;
          }
        }
      }

      // Try to match by normalized subject
      if (!threadId) {
        const normalizedSubject = this.normalizeSubject(message.subject);
        for (const [existingThreadId, threadMessages] of threads) {
          const firstMessage = threadMessages[0];
          if (firstMessage && this.normalizeSubject(firstMessage.subject) === normalizedSubject) {
            // Check if participants overlap
            const existingParticipants = new Set([
              firstMessage.fromEmail,
              ...firstMessage.toEmails,
            ]);
            const currentParticipants = [message.fromEmail, ...message.toEmails];
            const hasOverlap = currentParticipants.some((p) => existingParticipants.has(p));

            if (hasOverlap) {
              threadId = existingThreadId;
              break;
            }
          }
        }
      }

      // Create new thread if no match found
      if (!threadId) {
        threadId = `thread_${message.externalId}`;
      }

      // Add message to thread
      const threadMessages = threads.get(threadId) || [];
      threadMessages.push(message);
      threads.set(threadId, threadMessages);

      // Map message ID to thread
      messageToThread.set(message.externalId, threadId);
    }

    return threads;
  }

  /**
   * Normalize email subject for comparison
   */
  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(re:|fwd:|fw:)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Classify thread themes using AI
   */
  async classifyThreadThemes(
    threadMessages: MessageForClustering[]
  ): Promise<ThemeClassification> {
    if (!threadMessages.length) {
      return { primary: 'general_inquiry', secondary: [], confidence: 0 };
    }

    const anthropic = this.getAnthropicClient();

    // Build thread summary for classification
    const threadSummary = threadMessages
      .slice(0, 10) // Limit to first 10 messages
      .map((m) => {
        const bodySnippet = m.bodyPlain?.slice(0, 500) || '';
        return `Subject: ${m.subject}\nFrom: ${m.fromEmail}\nDate: ${m.messageTimestamp.toISOString()}\nContent: ${bodySnippet}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Analyze this email thread and classify its themes.

Available theme categories:
${THEME_CATEGORIES.join(', ')}

Email Thread:
${threadSummary}

Respond with JSON only:
{
  "primary": "most relevant theme category",
  "secondary": ["other relevant themes"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const result = JSON.parse(content.text);
      return {
        primary: result.primary || 'general_inquiry',
        secondary: result.secondary || [],
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      console.error('[ThreadCluster] Theme classification error:', error);
      return { primary: 'general_inquiry', secondary: [], confidence: 0 };
    }
  }

  /**
   * Analyze thread sentiment
   */
  async analyzeThreadSentiment(
    threadMessages: MessageForClustering[]
  ): Promise<'positive' | 'neutral' | 'negative' | 'mixed'> {
    if (!threadMessages.length) {
      return 'neutral';
    }

    const anthropic = this.getAnthropicClient();

    const contentSummary = threadMessages
      .slice(0, 5)
      .map((m) => m.bodyPlain?.slice(0, 300) || '')
      .join('\n---\n');

    const prompt = `Analyze the overall sentiment of this email thread.

Content:
${contentSummary}

Respond with one word only: positive, neutral, negative, or mixed`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return 'neutral';
      }

      const sentiment = content.text.trim().toLowerCase();
      if (['positive', 'neutral', 'negative', 'mixed'].includes(sentiment)) {
        return sentiment as 'positive' | 'neutral' | 'negative' | 'mixed';
      }
      return 'neutral';
    } catch (error) {
      console.error('[ThreadCluster] Sentiment analysis error:', error);
      return 'neutral';
    }
  }

  /**
   * Determine thread importance
   */
  async determineImportance(
    threadMessages: MessageForClustering[],
    themes: ThemeClassification
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    // Rule-based importance determination
    const messageCount = threadMessages.length;
    const hasUrgentKeywords = threadMessages.some((m) =>
      /urgent|asap|immediately|critical|deadline/i.test(m.subject + ' ' + (m.bodyPlain || ''))
    );
    const hasMoneyKeywords = threadMessages.some((m) =>
      /invoice|payment|quote|proposal|contract|budget/i.test(
        m.subject + ' ' + (m.bodyPlain || '')
      )
    );

    // Critical themes
    if (themes.primary === 'urgent_matter' || themes.primary === 'complaint') {
      return 'critical';
    }

    // High importance
    if (
      hasUrgentKeywords ||
      themes.primary === 'contract_legal' ||
      themes.primary === 'invoice_payment'
    ) {
      return 'high';
    }

    // Medium importance
    if (
      messageCount >= 5 ||
      hasMoneyKeywords ||
      themes.primary === 'proposal_negotiation' ||
      themes.primary === 'project_discussion'
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Check if thread has unresolved items
   */
  async checkUnresolvedItems(
    threadMessages: MessageForClustering[]
  ): Promise<{ hasUnresolved: boolean; requiresFollowup: boolean }> {
    if (!threadMessages.length) {
      return { hasUnresolved: false, requiresFollowup: false };
    }

    const anthropic = this.getAnthropicClient();

    // Get last few messages
    const recentMessages = threadMessages.slice(-3);
    const contentSummary = recentMessages
      .map((m) => `From: ${m.fromEmail}\nContent: ${m.bodyPlain?.slice(0, 400) || ''}`)
      .join('\n---\n');

    const prompt = `Analyze these recent emails from a thread. Determine:
1. Are there unresolved questions or requests?
2. Does this thread require follow-up action?

Emails:
${contentSummary}

Respond with JSON only:
{
  "hasUnresolved": true/false,
  "requiresFollowup": true/false,
  "reason": "brief explanation"
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return { hasUnresolved: false, requiresFollowup: false };
      }

      const result = JSON.parse(content.text);
      return {
        hasUnresolved: result.hasUnresolved || false,
        requiresFollowup: result.requiresFollowup || false,
      };
    } catch (error) {
      console.error('[ThreadCluster] Unresolved check error:', error);
      return { hasUnresolved: false, requiresFollowup: false };
    }
  }

  /**
   * Process and save clustered threads to database
   */
  async processAndSaveThreads(config: ThreadClusterConfig): Promise<ClusteredThread[]> {
    const supabase = await getSupabaseServer();

    // Fetch unprocessed messages for this pre-client
    const { data: messages, error: fetchError } = await supabase
      .from('pre_client_messages')
      .select('*')
      .eq('pre_client_id', config.preClientId)
      .eq('workspace_id', config.workspaceId)
      .order('message_timestamp', { ascending: true });

    if (fetchError) {
      console.error('[ThreadCluster] Failed to fetch messages:', fetchError);
      throw new Error(`Failed to fetch messages: ${fetchError.message}`);
    }

    if (!messages?.length) {
      return [];
    }

    // Convert to clustering format
    const messagesForClustering: MessageForClustering[] = messages.map((m) => ({
      id: m.id,
      externalId: m.external_id,
      subject: m.subject || '',
      fromEmail: m.from_email,
      toEmails: m.to_emails || [],
      bodyPlain: m.body_plain || '',
      messageTimestamp: new Date(m.message_timestamp),
    }));

    // Cluster messages into threads
    const threadMap = await this.clusterMessages(messagesForClustering, config);

    const clusteredThreads: ClusteredThread[] = [];

    // Process each thread
    for (const [threadId, threadMessages] of threadMap) {
      // Sort messages by timestamp
      threadMessages.sort(
        (a, b) => a.messageTimestamp.getTime() - b.messageTimestamp.getTime()
      );

      const firstMessage = threadMessages[0];
      const lastMessage = threadMessages[threadMessages.length - 1];

      // Get all participants
      const participants = new Set<string>();
      threadMessages.forEach((m) => {
        participants.add(m.fromEmail);
        m.toEmails.forEach((e) => participants.add(e));
      });

      // AI analysis
      const themes = await this.classifyThreadThemes(threadMessages);
      const sentiment = await this.analyzeThreadSentiment(threadMessages);
      const importance = await this.determineImportance(threadMessages, themes);
      const { hasUnresolved, requiresFollowup } =
        await this.checkUnresolvedItems(threadMessages);

      const clusteredThread: ClusteredThread = {
        threadId,
        subject: firstMessage?.subject || 'No Subject',
        messageCount: threadMessages.length,
        firstMessageAt: firstMessage?.messageTimestamp || new Date(),
        lastMessageAt: lastMessage?.messageTimestamp || new Date(),
        participants: Array.from(participants),
        primaryTheme: themes.primary,
        themes: [themes.primary, ...themes.secondary],
        sentiment,
        importance,
        hasUnresolvedItems: hasUnresolved,
        requiresFollowup: requiresFollowup,
      };

      // Save thread to database
      const { error: upsertError } = await supabase.from('pre_client_threads').upsert(
        {
          pre_client_id: config.preClientId,
          workspace_id: config.workspaceId,
          thread_id: threadId,
          external_thread_id: threadId,
          provider: 'gmail', // Default, could be determined from messages
          subject: clusteredThread.subject,
          first_message_at: clusteredThread.firstMessageAt.toISOString(),
          last_message_at: clusteredThread.lastMessageAt.toISOString(),
          message_count: clusteredThread.messageCount,
          primary_theme: clusteredThread.primaryTheme,
          themes: clusteredThread.themes,
          sentiment: clusteredThread.sentiment,
          importance: clusteredThread.importance,
          has_unresolved_items: clusteredThread.hasUnresolvedItems,
          requires_followup: clusteredThread.requiresFollowup,
        },
        {
          onConflict: 'pre_client_id,thread_id',
        }
      );

      if (upsertError) {
        console.error(`[ThreadCluster] Failed to save thread ${threadId}:`, upsertError);
      } else {
        clusteredThreads.push(clusteredThread);
      }

      // Update messages with thread reference
      const messageIds = threadMessages.map((m) => m.id);
      const { data: threadRecord } = await supabase
        .from('pre_client_threads')
        .select('id')
        .eq('thread_id', threadId)
        .eq('pre_client_id', config.preClientId)
        .single();

      if (threadRecord) {
        await supabase
          .from('pre_client_messages')
          .update({ thread_id: threadRecord.id })
          .in('id', messageIds);
      }
    }

    return clusteredThreads;
  }

  /**
   * Get thread summary for a pre-client
   */
  async getThreadSummary(
    preClientId: string,
    workspaceId: string
  ): Promise<{
    totalThreads: number;
    byTheme: Record<string, number>;
    bySentiment: Record<string, number>;
    byImportance: Record<string, number>;
    requireingFollowup: number;
    withUnresolvedItems: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data: threads, error } = await supabase
      .from('pre_client_threads')
      .select('primary_theme, sentiment, importance, has_unresolved_items, requires_followup')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId);

    if (error || !threads) {
      return {
        totalThreads: 0,
        byTheme: {},
        bySentiment: {},
        byImportance: {},
        requireingFollowup: 0,
        withUnresolvedItems: 0,
      };
    }

    const byTheme: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    const byImportance: Record<string, number> = {};
    let requireingFollowup = 0;
    let withUnresolvedItems = 0;

    threads.forEach((t) => {
      if (t.primary_theme) {
        byTheme[t.primary_theme] = (byTheme[t.primary_theme] || 0) + 1;
      }
      if (t.sentiment) {
        bySentiment[t.sentiment] = (bySentiment[t.sentiment] || 0) + 1;
      }
      if (t.importance) {
        byImportance[t.importance] = (byImportance[t.importance] || 0) + 1;
      }
      if (t.requires_followup) {
requireingFollowup++;
}
      if (t.has_unresolved_items) {
withUnresolvedItems++;
}
    });

    return {
      totalThreads: threads.length,
      byTheme,
      bySentiment,
      byImportance,
      requireingFollowup,
      withUnresolvedItems,
    };
  }
}

export const threadClusterService = new ThreadClusterService();
