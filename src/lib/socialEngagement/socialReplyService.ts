/**
 * Social Reply Service
 *
 * Service generating reply suggestions and enqueuing replies (with approval) to social networks.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import {
  SocialMessage,
  SocialAction,
  ReplySuggestion,
  SocialProvider,
  ApprovalStatus,
} from './providerTypes';
import { createPlatformClient, PlatformClientConfig } from './platformClients';
import { socialEngagementConfig } from '../../../config/socialEngagement.config';
import { tokenVault } from '@/lib/connectedApps/tokenVault';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateReplyOptions {
  tone?: 'professional' | 'friendly' | 'formal' | 'casual';
  maxLength?: number;
  brandVoice?: string;
  previousContext?: Array<{ role: 'user' | 'brand'; content: string }>;
  templateId?: string;
  includePersonalization?: boolean;
  language?: string;
}

export interface SendReplyOptions {
  autoApprove?: boolean;
  scheduledFor?: Date;
  userId?: string;
}

export interface ReplyResult {
  actionId: string;
  approvalStatus: ApprovalStatus;
  externalId?: string;
  error?: string;
}

class SocialReplyService {
  /**
   * Generate reply suggestions for a message
   */
  async generateReplySuggestions(
    message: SocialMessage,
    options: GenerateReplyOptions = {},
    count = 3
  ): Promise<ReplySuggestion[]> {
    const {
      tone = 'professional',
      maxLength = 280,
      brandVoice = '',
      previousContext = [],
      includePersonalization = true,
      language = 'en',
    } = options;

    const systemPrompt = `You are a social media community manager generating reply suggestions.

Guidelines:
- Match the platform's style and character limits
- Tone: ${tone}
- Maximum length: ${maxLength} characters
${brandVoice ? `- Brand voice: ${brandVoice}` : ''}
- Language: ${language}
${includePersonalization ? '- Personalize using the author\'s name when appropriate' : ''}

Generate ${count} different reply options with varying approaches (empathetic, solution-focused, friendly, etc.).
Each reply should be appropriate for the ${message.provider} platform.

Consider:
- Platform conventions (hashtags on Instagram/X, professional tone on LinkedIn)
- Character limits (X: 280, Instagram comments: 2200, Facebook: unlimited)
- The context of the conversation
- Appropriate response to the sentiment and intent`;

    const contextStr = previousContext.length
      ? `\n\nConversation context:\n${previousContext.map((m) => `${m.role}: ${m.content}`).join('\n')}`
      : '';

    const userPrompt = `Generate ${count} reply suggestions for this ${message.provider} ${message.channelType}:

Author: ${message.authorName || message.authorHandle || 'User'}
Message: ${message.content}
${contextStr}

Respond with a JSON array of suggestions:
[
  {
    "text": "<reply text>",
    "tone": "<professional|friendly|formal|casual>",
    "confidence": <0.0-1.0>,
    "approach": "<empathetic|solution|friendly|formal>"
  }
]`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((suggestion: { text: string; tone: string; confidence: number }) => ({
        text: suggestion.text.substring(0, maxLength),
        tone: suggestion.tone || tone,
        confidence: suggestion.confidence || 0.8,
        templateId: options.templateId,
        personalizationApplied: includePersonalization,
        languageDetected: language,
      }));
    } catch (error) {
      console.error('[SocialReply] Error generating suggestions:', error);
      throw error;
    }
  }

  /**
   * Queue a reply for sending (with approval workflow)
   */
  async queueReply(
    messageId: string,
    replyText: string,
    options: SendReplyOptions = {}
  ): Promise<ReplyResult> {
    const supabase = await getSupabaseServer();

    // Get the message to reply to
    const { data: message, error: messageError } = await supabase
      .from('social_messages')
      .select('*, social_accounts(*)')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      throw new Error('Message not found');
    }

    // Check if auto-approval is allowed
    const provider = message.provider as SocialProvider;
    const providerConfig = socialEngagementConfig.providers[provider];
    const requiresApproval = socialEngagementConfig.replySettings.requireApproval &&
      !options.autoApprove;

    // Check for sensitive content
    const hasSensitiveContent = this.containsSensitiveContent(replyText);
    const approvalStatus: ApprovalStatus = hasSensitiveContent
      ? 'pending'
      : requiresApproval
        ? 'pending'
        : 'auto_approved';

    // Create action record
    const { data: action, error: actionError } = await supabase
      .from('social_actions')
      .insert({
        social_message_id: messageId,
        workspace_id: message.workspace_id,
        action_type: 'reply',
        payload_json: {
          text: replyText,
          scheduled_for: options.scheduledFor?.toISOString(),
        },
        ai_generated: true,
        ai_model: 'claude-haiku-4-5-20251001',
        approval_status: approvalStatus,
        performed_by_user_id: options.userId,
      })
      .select()
      .single();

    if (actionError) {
      throw actionError;
    }

    // If auto-approved, send immediately
    if (approvalStatus === 'auto_approved' && !options.scheduledFor) {
      const sendResult = await this.sendReply(action.id);
      return {
        actionId: action.id,
        approvalStatus: 'auto_approved',
        externalId: sendResult.externalId,
        error: sendResult.error,
      };
    }

    return {
      actionId: action.id,
      approvalStatus,
    };
  }

  /**
   * Approve a pending reply
   */
  async approveReply(actionId: string, userId: string): Promise<ReplyResult> {
    const supabase = await getSupabaseServer();

    const { error: updateError } = await supabase
      .from('social_actions')
      .update({
        approval_status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', actionId)
      .eq('approval_status', 'pending');

    if (updateError) {
      throw updateError;
    }

    // Send the reply
    return await this.sendReply(actionId);
  }

  /**
   * Reject a pending reply
   */
  async rejectReply(actionId: string, userId: string, reason?: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('social_actions')
      .update({
        approval_status: 'rejected',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        error_message: reason,
      })
      .eq('id', actionId)
      .eq('approval_status', 'pending');

    if (error) {
      throw error;
    }
  }

  /**
   * Send an approved reply to the platform
   */
  async sendReply(actionId: string): Promise<ReplyResult> {
    const supabase = await getSupabaseServer();

    // Get action with message and account
    const { data: action, error: actionError } = await supabase
      .from('social_actions')
      .select(`
        *,
        social_messages(*, social_accounts(*))
      `)
      .eq('id', actionId)
      .single();

    if (actionError || !action) {
      throw new Error('Action not found');
    }

    const message = action.social_messages;
    const account = message.social_accounts;

    if (!account) {
      throw new Error('Social account not found');
    }

    try {
      // Decrypt tokens
      const tokens = await tokenVault.decryptTokens({
        encryptedAccessToken: account.access_token_encrypted,
        encryptedRefreshToken: account.refresh_token_encrypted,
        iv: account.token_iv,
        authTag: account.token_auth_tag,
      });

      // Create platform client
      const client = createPlatformClient({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountId: account.external_account_id,
        provider: account.provider as SocialProvider,
      });

      // Send reply
      const payload = action.payload_json as { text: string };
      const result = await client.sendReply({
        messageId: message.external_message_id,
        text: payload.text,
      });

      // Update action record
      await supabase
        .from('social_actions')
        .update({
          performed_at: new Date().toISOString(),
          external_action_id: result.externalId,
          error_message: result.error,
        })
        .eq('id', actionId);

      // Update message as replied
      if (result.success) {
        await supabase
          .from('social_messages')
          .update({
            status: 'replied',
            replied_at: new Date().toISOString(),
            triage_status: 'auto_replied',
          })
          .eq('id', message.id);
      }

      return {
        actionId,
        approvalStatus: 'approved',
        externalId: result.externalId,
        error: result.error,
      };
    } catch (error) {
      // Update action with error
      await supabase
        .from('social_actions')
        .update({
          error_message: String(error),
        })
        .eq('id', actionId);

      return {
        actionId,
        approvalStatus: 'approved',
        error: String(error),
      };
    }
  }

  /**
   * Get reply templates
   */
  async getTemplates(workspaceId: string, filters?: {
    providers?: SocialProvider[];
    sentimentTriggers?: string[];
    search?: string;
  }): Promise<Array<{
    id: string;
    name: string;
    templateText: string;
    variables: string[];
    usageCount: number;
    successRate?: number;
  }>> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('social_reply_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('usage_count', { ascending: false });

    if (filters?.providers?.length) {
      query = query.overlaps('providers', filters.providers);
    }

    if (filters?.sentimentTriggers?.length) {
      query = query.overlaps('sentiment_triggers', filters.sentimentTriggers);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      templateText: t.template_text,
      variables: t.variables || [],
      usageCount: t.usage_count,
      successRate: t.success_rate,
    }));
  }

  /**
   * Create a reply template
   */
  async createTemplate(
    workspaceId: string,
    template: {
      name: string;
      templateText: string;
      description?: string;
      variables?: string[];
      providers?: SocialProvider[];
      sentimentTriggers?: string[];
      intentTriggers?: string[];
    },
    userId?: string
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('social_reply_templates')
      .insert({
        workspace_id: workspaceId,
        name: template.name,
        template_text: template.templateText,
        description: template.description,
        variables: template.variables || this.extractVariables(template.templateText),
        providers: template.providers,
        sentiment_triggers: template.sentimentTriggers,
        intent_triggers: template.intentTriggers,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  /**
   * Apply template with variables
   */
  applyTemplate(
    templateText: string,
    variables: Record<string, string>
  ): string {
    let result = templateText;

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return result;
  }

  /**
   * Get pending replies awaiting approval
   */
  async getPendingReplies(workspaceId: string): Promise<SocialAction[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('social_actions')
      .select(`
        *,
        social_messages(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('action_type', 'reply')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapActionFromDb);
  }

  // Helper methods
  private containsSensitiveContent(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return socialEngagementConfig.replySettings.sensitiveContentKeywords.some(
      (keyword) => lowerContent.includes(keyword.toLowerCase())
    );
  }

  private extractVariables(templateText: string): string[] {
    const matches = templateText.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(2, -2));
  }

  private mapActionFromDb(data: Record<string, unknown>): SocialAction {
    return {
      id: data.id as string,
      socialMessageId: data.social_message_id as string,
      workspaceId: data.workspace_id as string,
      actionType: data.action_type as SocialAction['actionType'],
      payloadJson: data.payload_json as Record<string, unknown> | undefined,
      aiGenerated: data.ai_generated as boolean,
      aiModel: data.ai_model as string | undefined,
      aiConfidence: data.ai_confidence as number | undefined,
      approvalStatus: data.approval_status as ApprovalStatus,
      approvedBy: data.approved_by as string | undefined,
      approvedAt: data.approved_at ? new Date(data.approved_at as string) : undefined,
      performedByUserId: data.performed_by_user_id as string | undefined,
      externalActionId: data.external_action_id as string | undefined,
      errorMessage: data.error_message as string | undefined,
      performedAt: data.performed_at ? new Date(data.performed_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
    };
  }
}

export const socialReplyService = new SocialReplyService();
