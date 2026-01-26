/**
 * Multi-Channel Executor
 *
 * Executes multi-channel communication nodes (email, SMS, social, webhook)
 * Replaces EmailExecutor with unified channel support
 *
 * @module lib/workflows/executors/MultiChannelExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';
import { executeChannel, validateChannelConfig, type ChannelType } from '@/lib/channels';

const logger = createApiLogger({ service: 'MultiChannelExecutor' });

export class MultiChannelExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const channelConfig = context.current_step?.channel_config;

    if (!channelConfig) {
      throw new Error('Channel configuration not found in step');
    }

    // Determine channel type from config
    const channelType = this.getChannelType(channelConfig);

    if (!channelType) {
      throw new Error('No channel configuration found');
    }

    logger.info('Executing multi-channel node', {
      nodeId: node.id,
      channelType,
      contactId: context.contact.id,
    });

    try {
      // Execute channel
      const result = await executeChannel({
        type: channelType,
        config: channelConfig,
        contact: context.contact,
        variables: context.variables,
        metadata: {
          campaign_id: context.campaign.id,
          enrollment_id: context.enrollment.id,
          step_id: context.current_step?.id,
          node_id: node.id,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Channel execution failed');
      }

      logger.info('Multi-channel execution successful', {
        nodeId: node.id,
        channelType,
        messageId: result.messageId,
        postId: result.postId,
      });

      // Build event data based on channel type
      const eventData: Record<string, any> = {
        channel_type: channelType,
        provider: result.provider,
      };

      if (channelType === 'email') {
        eventData.email_id = result.messageId;
        eventData.to = context.contact.email;
      } else if (channelType === 'sms') {
        eventData.sms_id = result.messageId;
        eventData.to = context.contact.phone;
      } else if (channelType === 'social') {
        eventData.post_id = result.postId;
        eventData.post_url = result.postUrl;
        eventData.platform = result.provider;
      } else if (channelType === 'webhook') {
        eventData.webhook_id = result.messageId;
        eventData.response = result.details?.response;
      }

      return {
        success: true,
        eventData,
      };
    } catch (error) {
      logger.error('Multi-channel execution failed', {
        error,
        nodeId: node.id,
        channelType,
        contactId: context.contact.id,
      });

      throw error;
    }
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = node.data.config || {};

    // Check if at least one channel is configured
    const hasEmail = !!config.email;
    const hasSms = !!config.sms;
    const hasSocial = !!config.social;
    const hasWebhook = !!config.webhook;

    if (!hasEmail && !hasSms && !hasSocial && !hasWebhook) {
      errors.push('At least one channel must be configured');
      return { valid: false, errors };
    }

    // Validate each configured channel
    if (hasEmail) {
      const validation = validateChannelConfig('email', config);
      errors.push(...validation.errors);
    }

    if (hasSms) {
      const validation = validateChannelConfig('sms', config);
      errors.push(...validation.errors);
    }

    if (hasSocial) {
      const validation = validateChannelConfig('social', config);
      errors.push(...validation.errors);
    }

    if (hasWebhook) {
      const validation = validateChannelConfig('webhook', config);
      errors.push(...validation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Determine channel type from config
   */
  private getChannelType(config: any): ChannelType | null {
    if (config.email) return 'email';
    if (config.sms) return 'sms';
    if (config.social) return 'social';
    if (config.webhook) return 'webhook';
    return null;
  }
}
