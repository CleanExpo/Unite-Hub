/**
 * Social Inbox Agent
 *
 * Agent for unified social media inbox management across connected platforms.
 * Aggregates messages, provides AI-powered response suggestions (ADVISORY ONLY),
 * and helps manage social engagement at scale.
 *
 * @module agents/socialInboxAgent
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { db } from '@/lib/db';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import {
  socialInboxService,
  type SyncOptions,
  type InboxFilters,
  type InboxResult,
  type ThreadsResult,
} from '@/lib/socialEngagement/socialInboxService';
import type {
  SocialAccount,
  SocialMessage,
  SocialThread,
  SocialProvider,
} from '@/lib/socialEngagement/providerTypes';

// ============================================================================
// Types & Interfaces
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

export interface ResponseSuggestion {
  tone: 'professional' | 'friendly' | 'empathetic' | 'concise' | 'detailed';
  suggestedResponse: string;
  keyPoints: string[];
  warningFlags: string[];
  confidenceScore: number;
}

export interface MessageCategorization {
  category: 'support' | 'sales' | 'feedback' | 'complaint' | 'praise' | 'general' | 'spam';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  requiresResponse: boolean;
  suggestedResponseTime: 'immediate' | 'within_1h' | 'within_24h' | 'when_convenient';
  reasoning: string;
}

export interface InboxInsights {
  totalMessages: number;
  unreadCount: number;
  byProvider: Record<string, number>;
  byCategory: Record<string, number>;
  avgResponseTime: string;
  topUrgentMessages: SocialMessage[];
  recommendations: string[];
}

// ============================================================================
// Agent Functions
// ============================================================================

/**
 * Get connected social accounts
 */
export async function getConnectedAccounts(
  workspaceId: string
): Promise<SocialAccount[]> {
  return await socialInboxService.getConnectedAccounts(workspaceId);
}

/**
 * Sync messages from a social account
 */
export async function syncSocialAccount(
  workspaceId: string,
  accountId: string,
  options: SyncOptions = { syncType: 'incremental' }
): Promise<{
  success: boolean;
  threadsSynced: number;
  messagesSynced: number;
  errors: string[];
}> {
  const progress = await socialInboxService.syncAccount(accountId, options);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'social_account_synced',
    details: {
      accountId,
      syncType: options.syncType,
      threadsSynced: progress.threadsSynced,
      messagesSynced: progress.messagesSynced,
      status: progress.status,
    },
  });

  return {
    success: progress.status === 'completed',
    threadsSynced: progress.threadsSynced,
    messagesSynced: progress.messagesSynced,
    errors: progress.errors,
  };
}

/**
 * Get inbox messages with filters
 */
export async function getInboxMessages(
  workspaceId: string,
  filters?: InboxFilters,
  page = 1,
  limit = 25
): Promise<InboxResult> {
  return await socialInboxService.getMessages(workspaceId, filters, page, limit);
}

/**
 * Get conversation threads
 */
export async function getThreads(
  workspaceId: string,
  filters?: InboxFilters,
  page = 1,
  limit = 25
): Promise<ThreadsResult> {
  return await socialInboxService.getThreads(workspaceId, filters, page, limit);
}

/**
 * Categorize a message using AI
 * ADVISORY ONLY - Does not take action
 */
export async function categorizeMessage(
  message: SocialMessage
): Promise<MessageCategorization> {
  const systemPrompt = `You are a social media message analyst. Categorize messages by type, priority, and sentiment.

Return ONLY valid JSON with this structure:
{
  "category": "support" | "sales" | "feedback" | "complaint" | "praise" | "general" | "spam",
  "priority": "urgent" | "high" | "medium" | "low",
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "requiresResponse": true/false,
  "suggestedResponseTime": "immediate" | "within_1h" | "within_24h" | "when_convenient",
  "reasoning": "<brief explanation>"
}`;

  const userPrompt = `Categorize this social media message:

Platform: ${message.provider}
Channel: ${message.channelType}
From: ${message.authorHandle || message.authorName || 'Unknown'}
Content: ${message.content}

Provide categorization.`;

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-sonnet-4-5-20250929');
    logCacheStats('SocialInbox:analyzeMessage', cacheStats);

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('[SocialInboxAgent] Categorization error:', error);
    return {
      category: 'general',
      priority: 'medium',
      sentiment: 'neutral',
      requiresResponse: false,
      suggestedResponseTime: 'when_convenient',
      reasoning: 'Categorization failed',
    };
  }
}

/**
 * Suggest a response to a message (ADVISORY ONLY)
 * Human must review and approve before sending
 */
export async function suggestResponse(
  message: SocialMessage,
  context?: {
    previousMessages?: string[];
    brandVoice?: string;
    preferredTone?: 'professional' | 'friendly' | 'empathetic';
  }
): Promise<ResponseSuggestion> {
  const systemPrompt = `You are a social media response specialist. Generate appropriate, helpful responses to messages.

Guidelines:
- Be genuine and human
- Match the brand voice and tone
- Address concerns directly
- Be concise but complete
- Include actionable next steps when appropriate
- Flag any potential issues (legal, PR, sensitive)

Return ONLY valid JSON with this structure:
{
  "tone": "professional" | "friendly" | "empathetic" | "concise" | "detailed",
  "suggestedResponse": "<response text>",
  "keyPoints": ["<point 1>", "<point 2>"],
  "warningFlags": ["<warning 1>" if any],
  "confidenceScore": <0-100>
}`;

  const userPrompt = `Generate a response suggestion:

Platform: ${message.provider}
Channel: ${message.channelType}
From: ${message.authorHandle || message.authorName || 'Unknown'}
Message: ${message.content}

${context?.previousMessages ? `Previous Messages:\n${context.previousMessages.join('\n')}\n` : ''}
${context?.brandVoice ? `Brand Voice: ${context.brandVoice}\n` : ''}
${context?.preferredTone ? `Preferred Tone: ${context.preferredTone}\n` : ''}

Generate an appropriate response suggestion.`;

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-sonnet-4-5-20250929');
    logCacheStats('SocialInbox:analyzeMessage', cacheStats);

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    const suggestion = JSON.parse(cleanJson);

    return {
      tone: suggestion.tone || 'professional',
      suggestedResponse: suggestion.suggestedResponse || '',
      keyPoints: suggestion.keyPoints || [],
      warningFlags: suggestion.warningFlags || [],
      confidenceScore: suggestion.confidenceScore || 70,
    };
  } catch (error) {
    console.error('[SocialInboxAgent] Response suggestion error:', error);
    return {
      tone: 'professional',
      suggestedResponse: 'Thank you for your message. We appreciate your feedback.',
      keyPoints: ['Acknowledge message'],
      warningFlags: ['AI suggestion failed - manual response required'],
      confidenceScore: 0,
    };
  }
}

/**
 * Get inbox insights and statistics
 */
export async function getInboxInsights(
  workspaceId: string
): Promise<InboxInsights> {
  const stats = await socialInboxService.getInboxStats(workspaceId);

  // Get urgent messages
  const { messages: urgentMessages } = await socialInboxService.getMessages(
    workspaceId,
    { importanceMin: 80, status: ['unread'] },
    1,
    5
  );

  // Generate AI recommendations
  const systemPrompt = `You are a social media management advisor. Provide 3-5 actionable recommendations based on inbox stats.

Return ONLY a JSON array of recommendations:
["<recommendation 1>", "<recommendation 2>", ...]`;

  const userPrompt = `Inbox Statistics:
- Total Messages: ${stats.totalMessages}
- Unread: ${stats.unreadCount}
- Flagged: ${stats.flaggedCount}
- Pending Triage: ${stats.pendingTriageCount}
- Requires Attention: ${stats.requiresAttentionCount}

By Provider:
${Object.entries(stats.byProvider)
  .map(([provider, count]) => `- ${provider}: ${count}`)
  .join('\n')}

Provide recommendations for improving social inbox management.`;

  let recommendations: string[] = [];

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-sonnet-4-5-20250929');
    logCacheStats('SocialInbox:analyzeMessage', cacheStats);

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/(\[[\s\S]*\])/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    recommendations = JSON.parse(cleanJson);
  } catch (error) {
    console.error('[SocialInboxAgent] Recommendations error:', error);
    recommendations = [
      'Review and respond to unread messages',
      'Triage pending messages',
      'Address flagged items',
    ];
  }

  return {
    totalMessages: stats.totalMessages,
    unreadCount: stats.unreadCount,
    byProvider: stats.byProvider,
    byCategory: stats.byChannelType,
    avgResponseTime: 'N/A', // Would calculate from message timestamps
    topUrgentMessages: urgentMessages,
    recommendations,
  };
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string,
  workspaceId: string,
  status: 'unread' | 'read' | 'archived' | 'replied'
): Promise<void> {
  await socialInboxService.updateMessageStatus(messageId, status);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'social_message_status_updated',
    details: {
      messageId,
      status,
    },
  });
}

/**
 * Flag or unflag a message
 */
export async function flagMessage(
  messageId: string,
  workspaceId: string,
  flagged: boolean,
  reason?: string
): Promise<void> {
  await socialInboxService.flagMessage(messageId, flagged, reason);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'social_message_flagged',
    details: {
      messageId,
      flagged,
      reason,
    },
  });
}

/**
 * Assign thread to user
 */
export async function assignThread(
  threadId: string,
  workspaceId: string,
  userId: string | null
): Promise<void> {
  await socialInboxService.assignThread(threadId, userId);

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'social_thread_assigned',
    details: {
      threadId,
      assignedTo: userId,
    },
  });
}

/**
 * Batch categorize messages (for triage)
 */
export async function batchCategorizeMessages(
  workspaceId: string,
  messageIds: string[]
): Promise<{
  categorized: number;
  errors: number;
  categories: Record<string, number>;
}> {
  const { messages } = await socialInboxService.getMessages(workspaceId, {}, 1, 1000);
  const targetMessages = messages.filter((m) => messageIds.includes(m.id));

  let categorized = 0;
  let errors = 0;
  const categories: Record<string, number> = {};

  for (const message of targetMessages) {
    try {
      const cat = await categorizeMessage(message);
      categories[cat.category] = (categories[cat.category] || 0) + 1;
      categorized++;
    } catch (error) {
      errors++;
      console.error(`[SocialInboxAgent] Categorization error for ${message.id}:`, error);
    }
  }

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'social_messages_categorized',
    details: {
      total: messageIds.length,
      categorized,
      errors,
      categories,
    },
  });

  return { categorized, errors, categories };
}

// Export singleton instance
export const socialInboxAgent = {
  getConnectedAccounts,
  syncSocialAccount,
  getInboxMessages,
  getThreads,
  categorizeMessage,
  suggestResponse,
  getInboxInsights,
  updateMessageStatus,
  flagMessage,
  assignThread,
  batchCategorizeMessages,
};
