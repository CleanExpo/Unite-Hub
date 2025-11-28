/**
 * Social Triage Service
 *
 * AI-powered triage (sentiment classification, spam detection, importance scoring,
 * suggestion of actions).
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import {
  SocialMessage,
  TriageResult,
  SentimentLabel,
  ActionType,
} from './providerTypes';
import { socialEngagementConfig } from '../../../config/socialEngagement.config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TriageOptions {
  generateSuggestedReply?: boolean;
  brandContext?: string;
  previousMessages?: Array<{ role: 'user' | 'brand'; content: string }>;
}

export interface BatchTriageResult {
  messageId: string;
  result: TriageResult;
  error?: string;
}

class SocialTriageService {
  private readonly sensitiveKeywords: string[];

  constructor() {
    this.sensitiveKeywords = socialEngagementConfig.replySettings.sensitiveContentKeywords;
  }

  /**
   * Triage a single message using AI
   */
  async triageMessage(
    message: SocialMessage,
    options: TriageOptions = {}
  ): Promise<TriageResult> {
    // Quick spam check
    const quickSpamScore = this.quickSpamCheck(message.content);
    if (quickSpamScore > 0.9) {
      return {
        sentiment: 0,
        sentimentLabel: 'neutral',
        spamScore: quickSpamScore,
        importanceScore: 0,
        intentLabels: ['spam'],
        requiresHumanReview: false,
        confidence: 0.95,
      };
    }

    // Check for sensitive content
    const hasSensitiveContent = this.containsSensitiveContent(message.content);

    try {
      const systemPrompt = `You are an AI assistant specialized in analyzing social media messages for customer support triage.

Your task is to analyze the given message and provide:
1. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
2. Sentiment label (positive, neutral, negative, or mixed)
3. Spam score (0 to 1, where 0 is definitely not spam, 1 is definitely spam)
4. Importance score (0 to 1, where 0 is low priority, 1 is urgent/important)
5. Intent labels (array of intents like: question, complaint, praise, request, feedback, support_needed, purchase_intent, churn_risk, influencer, partnership_inquiry)
6. Whether human review is required
7. Suggested action (reply, like, hide, flag, archive)
8. If requested, a suggested reply

Consider these factors:
- Urgency indicators (ASAP, urgent, emergency, etc.)
- Emotion intensity
- Customer value signals
- Brand mention context
- Previous interaction history

${options.brandContext ? `Brand Context: ${options.brandContext}` : ''}`;

      const userPrompt = `Analyze this social media message:

Platform: ${message.provider}
Channel: ${message.channelType}
Author: ${message.authorName || message.authorHandle || 'Unknown'}
Content: ${message.content}

${
  options.previousMessages?.length
    ? `Previous conversation:
${options.previousMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`
    : ''
}

${options.generateSuggestedReply ? 'Also provide a suggested reply.' : ''}

Respond in JSON format:
{
  "sentiment": <number>,
  "sentimentLabel": "<positive|neutral|negative|mixed>",
  "spamScore": <number>,
  "importanceScore": <number>,
  "intentLabels": ["<intent1>", "<intent2>"],
  "requiresHumanReview": <boolean>,
  "reviewReason": "<reason if human review needed>",
  "suggestedAction": "<reply|like|hide|flag|archive>",
  "suggestedReply": "<reply text if requested>",
  "confidence": <number>
}`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Parse JSON response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Override if sensitive content detected
      if (hasSensitiveContent) {
        parsed.requiresHumanReview = true;
        parsed.reviewReason = 'Contains potentially sensitive content';
      }

      return {
        sentiment: this.clamp(parsed.sentiment, -1, 1),
        sentimentLabel: this.validateSentimentLabel(parsed.sentimentLabel),
        spamScore: this.clamp(parsed.spamScore, 0, 1),
        importanceScore: this.clamp(parsed.importanceScore, 0, 1),
        intentLabels: Array.isArray(parsed.intentLabels) ? parsed.intentLabels : [],
        suggestedAction: this.validateAction(parsed.suggestedAction),
        suggestedReply: parsed.suggestedReply,
        requiresHumanReview: parsed.requiresHumanReview || hasSensitiveContent,
        reviewReason: parsed.reviewReason,
        confidence: this.clamp(parsed.confidence || 0.8, 0, 1),
      };
    } catch (error) {
      console.error('[SocialTriage] Error triaging message:', error);

      // Return safe defaults on error
      return {
        sentiment: 0,
        sentimentLabel: 'neutral',
        spamScore: quickSpamScore,
        importanceScore: 0.5,
        intentLabels: [],
        requiresHumanReview: true,
        reviewReason: 'AI triage failed, manual review required',
        confidence: 0,
      };
    }
  }

  /**
   * Batch triage multiple messages
   */
  async batchTriage(
    messages: SocialMessage[],
    options: TriageOptions = {}
  ): Promise<BatchTriageResult[]> {
    const results: BatchTriageResult[] = [];

    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (message) => {
          try {
            const result = await this.triageMessage(message, options);
            return { messageId: message.id, result };
          } catch (error) {
            return {
              messageId: message.id,
              result: {
                sentiment: 0,
                sentimentLabel: 'neutral' as SentimentLabel,
                spamScore: 0,
                importanceScore: 0.5,
                intentLabels: [],
                requiresHumanReview: true,
                confidence: 0,
              },
              error: String(error),
            };
          }
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Update message with triage results
   */
  async applyTriageResult(messageId: string, result: TriageResult): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_messages')
      .update({
        sentiment: result.sentiment,
        sentiment_label: result.sentimentLabel,
        spam_score: result.spamScore,
        importance_score: result.importanceScore,
        intent_labels: result.intentLabels,
        triage_status: result.requiresHumanReview ? 'requires_attention' : 'triaged',
        triage_notes: result.reviewReason,
        triaged_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      console.error('[SocialTriage] Error applying triage result:', error);
      throw error;
    }
  }

  /**
   * Process pending messages for triage
   */
  async processPendingMessages(
    workspaceId: string,
    options: TriageOptions = {},
    limit = 50
  ): Promise<{ processed: number; errors: number }> {
    const supabase = await getSupabaseServer();

    // Get pending messages
    const { data: messages, error } = await supabase
      .from('social_messages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('triage_status', 'pending')
      .order('sent_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[SocialTriage] Error fetching pending messages:', error);
      throw error;
    }

    if (!messages?.length) {
      return { processed: 0, errors: 0 };
    }

    // Triage messages
    const results = await this.batchTriage(
      messages.map(this.mapMessageFromDb),
      options
    );

    // Apply results
    let errors = 0;
    for (const { messageId, result, error: triageError } of results) {
      if (triageError) {
        errors++;
        continue;
      }

      try {
        await this.applyTriageResult(messageId, result);
      } catch {
        errors++;
      }
    }

    return { processed: results.length - errors, errors };
  }

  /**
   * Get triage statistics
   */
  async getTriageStats(workspaceId: string): Promise<{
    pendingCount: number;
    triagedCount: number;
    requiresAttentionCount: number;
    avgSentiment: number;
    avgImportance: number;
    topIntents: Array<{ intent: string; count: number }>;
    sentimentDistribution: Record<SentimentLabel, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { data: messages } = await supabase
      .from('social_messages')
      .select('triage_status, sentiment, sentiment_label, importance_score, intent_labels')
      .eq('workspace_id', workspaceId);

    const stats = {
      pendingCount: 0,
      triagedCount: 0,
      requiresAttentionCount: 0,
      avgSentiment: 0,
      avgImportance: 0,
      topIntents: [] as Array<{ intent: string; count: number }>,
      sentimentDistribution: {
        positive: 0,
        neutral: 0,
        negative: 0,
        mixed: 0,
      } as Record<SentimentLabel, number>,
    };

    if (!messages?.length) return stats;

    const intentCounts = new Map<string, number>();
    let sentimentSum = 0;
    let importanceSum = 0;
    let triagedMessages = 0;

    for (const msg of messages) {
      // Status counts
      if (msg.triage_status === 'pending') stats.pendingCount++;
      else if (msg.triage_status === 'triaged') stats.triagedCount++;
      else if (msg.triage_status === 'requires_attention') stats.requiresAttentionCount++;

      // Sentiment distribution
      if (msg.sentiment_label) {
        stats.sentimentDistribution[msg.sentiment_label as SentimentLabel]++;
      }

      // Averages
      if (msg.sentiment !== null) {
        sentimentSum += msg.sentiment;
        triagedMessages++;
      }
      if (msg.importance_score !== null) {
        importanceSum += msg.importance_score;
      }

      // Intent counts
      for (const intent of msg.intent_labels || []) {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      }
    }

    stats.avgSentiment = triagedMessages > 0 ? sentimentSum / triagedMessages : 0;
    stats.avgImportance = triagedMessages > 0 ? importanceSum / triagedMessages : 0;

    // Top intents
    stats.topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  // Helper methods
  private quickSpamCheck(content: string): number {
    const spamIndicators = [
      /click here/i,
      /buy now/i,
      /limited time/i,
      /act now/i,
      /winner/i,
      /congratulations/i,
      /free money/i,
      /earn \$\d+/i,
      /http[s]?:\/\/bit\.ly/i,
      /http[s]?:\/\/tinyurl/i,
      /\b(crypto|bitcoin|nft)\s*(investment|opportunity)/i,
      /dm me/i,
      /check my bio/i,
      /follow back/i,
    ];

    let score = 0;
    for (const pattern of spamIndicators) {
      if (pattern.test(content)) {
        score += 0.2;
      }
    }

    // Excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) score += 0.2;

    // Excessive emojis
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 10) score += 0.1;

    return Math.min(score, 1);
  }

  private containsSensitiveContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return this.sensitiveKeywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private validateSentimentLabel(label: string): SentimentLabel {
    const valid: SentimentLabel[] = ['positive', 'neutral', 'negative', 'mixed'];
    return valid.includes(label as SentimentLabel) ? (label as SentimentLabel) : 'neutral';
  }

  private validateAction(action: string): ActionType | undefined {
    const valid: ActionType[] = ['reply', 'like', 'hide', 'delete', 'flag', 'unflag', 'archive', 'assign', 'label'];
    return valid.includes(action as ActionType) ? (action as ActionType) : undefined;
  }

  private mapMessageFromDb(data: Record<string, unknown>): SocialMessage {
    return {
      id: data.id as string,
      socialAccountId: data.social_account_id as string,
      threadId: data.thread_id as string | undefined,
      workspaceId: data.workspace_id as string,
      externalMessageId: data.external_message_id as string,
      provider: data.provider as SocialMessage['provider'],
      channelType: data.channel_type as SocialMessage['channelType'],
      direction: data.direction as 'inbound' | 'outbound',
      authorHandle: data.author_handle as string | undefined,
      authorId: data.author_id as string | undefined,
      authorName: data.author_name as string | undefined,
      authorProfileImage: data.author_profile_image as string | undefined,
      content: data.content as string,
      contentType: data.content_type as SocialMessage['contentType'],
      attachments: data.attachments as SocialMessage['attachments'],
      parentMessageId: data.parent_message_id as string | undefined,
      sentiment: data.sentiment as number | undefined,
      sentimentLabel: data.sentiment_label as SocialMessage['sentimentLabel'],
      spamScore: data.spam_score as number | undefined,
      importanceScore: data.importance_score as number | undefined,
      intentLabels: data.intent_labels as string[] | undefined,
      triageStatus: data.triage_status as SocialMessage['triageStatus'],
      triageNotes: data.triage_notes as string | undefined,
      triagedAt: data.triaged_at ? new Date(data.triaged_at as string) : undefined,
      status: data.status as SocialMessage['status'],
      isFlagged: data.is_flagged as boolean,
      flaggedReason: data.flagged_reason as string | undefined,
      sentAt: new Date(data.sent_at as string),
      readAt: data.read_at ? new Date(data.read_at as string) : undefined,
      repliedAt: data.replied_at ? new Date(data.replied_at as string) : undefined,
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const socialTriageService = new SocialTriageService();
