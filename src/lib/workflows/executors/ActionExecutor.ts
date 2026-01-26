/**
 * Action Executor
 *
 * Executes action nodes (tag, score, webhook, etc.)
 *
 * @module lib/workflows/executors/ActionExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext, ActionConfig } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';
import { createClient } from '@/lib/supabase/server';

const logger = createApiLogger({ service: 'ActionExecutor' });

export class ActionExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config: ActionConfig = node.data.config || context.current_step?.action_config || {};

    if (!config.type) {
      throw new Error('Action type not specified');
    }

    logger.info('Executing action node', {
      nodeId: node.id,
      actionType: config.type,
      contactId: context.contact.id,
    });

    switch (config.type) {
      case 'tag':
        return this.executeTagAction(node, context, config);

      case 'score':
        return this.executeScoreAction(node, context, config);

      case 'field_update':
        return this.executeFieldUpdateAction(node, context, config);

      case 'webhook':
        return this.executeWebhookAction(node, context, config);

      case 'segment':
        return this.executeSegmentAction(node, context, config);

      case 'notification':
        return this.executeNotificationAction(node, context, config);

      default:
        throw new Error(`Unknown action type: ${config.type}`);
    }
  }

  /**
   * Execute tag action
   */
  private async executeTagAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.tag) {
      throw new Error('Tag configuration missing');
    }

    const supabase = await createClient();
    const { tag_name, action } = config.tag;

    logger.info('Executing tag action', {
      nodeId: node.id,
      contactId: context.contact.id,
      tagName: tag_name,
      action,
    });

    // Get current tags
    const currentTags = context.contact.tags || [];
    let newTags: string[];

    if (action === 'add') {
      // Add tag if not present
      newTags = currentTags.includes(tag_name) ? currentTags : [...currentTags, tag_name];
    } else {
      // Remove tag
      newTags = currentTags.filter((t: string) => t !== tag_name);
    }

    // Update contact tags
    const { error } = await supabase
      .from('contacts')
      .update({ tags: newTags })
      .eq('id', context.contact.id);

    if (error) throw error;

    return {
      success: true,
      eventData: {
        action_type: 'tag',
        tag_name,
        tag_action: action,
        previous_tags: currentTags,
        new_tags: newTags,
      },
    };
  }

  /**
   * Execute score action
   */
  private async executeScoreAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.score) {
      throw new Error('Score configuration missing');
    }

    const supabase = await createClient();
    const { change, reason } = config.score;

    const currentScore = context.contact.score || 0;
    const newScore = Math.max(0, Math.min(100, currentScore + change)); // Clamp to 0-100

    logger.info('Executing score action', {
      nodeId: node.id,
      contactId: context.contact.id,
      change,
      currentScore,
      newScore,
    });

    // Update contact score
    const { error } = await supabase
      .from('contacts')
      .update({ score: newScore })
      .eq('id', context.contact.id);

    if (error) throw error;

    return {
      success: true,
      eventData: {
        action_type: 'score',
        score_change: change,
        previous_score: currentScore,
        new_score: newScore,
        reason,
      },
    };
  }

  /**
   * Execute field update action
   */
  private async executeFieldUpdateAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.field_update) {
      throw new Error('Field update configuration missing');
    }

    const supabase = await createClient();
    const { field_name, value, operation = 'set' } = config.field_update;

    logger.info('Executing field update action', {
      nodeId: node.id,
      contactId: context.contact.id,
      fieldName: field_name,
      operation,
    });

    let updateValue = value;

    // Handle different operations
    if (operation === 'append' && typeof context.contact[field_name] === 'string') {
      updateValue = context.contact[field_name] + value;
    } else if (operation === 'increment' && typeof context.contact[field_name] === 'number') {
      updateValue = context.contact[field_name] + value;
    }

    // Update contact field
    const { error } = await supabase
      .from('contacts')
      .update({ [field_name]: updateValue })
      .eq('id', context.contact.id);

    if (error) throw error;

    return {
      success: true,
      eventData: {
        action_type: 'field_update',
        field_name,
        operation,
        previous_value: context.contact[field_name],
        new_value: updateValue,
      },
    };
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.webhook) {
      throw new Error('Webhook configuration missing');
    }

    const { url, method, payload } = config.webhook;

    logger.info('Executing webhook action', {
      nodeId: node.id,
      contactId: context.contact.id,
      url,
      method,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          contact: context.contact,
          campaign_id: context.campaign.id,
          enrollment_id: context.enrollment.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      const responseData = await response.json();

      return {
        success: true,
        eventData: {
          action_type: 'webhook',
          url,
          method,
          status: response.status,
          response_data: responseData,
        },
      };
    } catch (error) {
      logger.error('Webhook action failed', { error, url });
      throw error;
    }
  }

  /**
   * Execute segment action
   */
  private async executeSegmentAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.segment) {
      throw new Error('Segment configuration missing');
    }

    const { action, segment_id } = config.segment;

    logger.info('Executing segment action', {
      nodeId: node.id,
      contactId: context.contact.id,
      segmentId: segment_id,
      action,
    });

    // TODO: Implement segment membership management
    // For now, just log the action

    return {
      success: true,
      eventData: {
        action_type: 'segment',
        segment_id,
        segment_action: action,
      },
    };
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(
    node: VisualNode,
    context: ExecutionContext,
    config: ActionConfig
  ): Promise<NodeExecutionResult> {
    if (!config.notification) {
      throw new Error('Notification configuration missing');
    }

    const { type, recipient, message } = config.notification;

    logger.info('Executing notification action', {
      nodeId: node.id,
      notificationType: type,
      recipient,
    });

    // TODO: Implement notification sending (email, Slack, Teams)
    // For now, just log the notification

    return {
      success: true,
      eventData: {
        action_type: 'notification',
        notification_type: type,
        recipient,
        message,
      },
    };
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config: ActionConfig = node.data.config || {};

    if (!config.type) {
      errors.push('Action type is required');
    }

    const validTypes = ['tag', 'score', 'field_update', 'webhook', 'segment', 'notification'];
    if (config.type && !validTypes.includes(config.type)) {
      errors.push(`Invalid action type: ${config.type}`);
    }

    // Validate type-specific configuration
    if (config.type === 'tag' && !config.tag) {
      errors.push('Tag action missing configuration');
    }

    if (config.type === 'score' && !config.score) {
      errors.push('Score action missing configuration');
    }

    if (config.type === 'field_update' && !config.field_update) {
      errors.push('Field update action missing configuration');
    }

    if (config.type === 'webhook' && !config.webhook) {
      errors.push('Webhook action missing configuration');
    }

    if (config.type === 'webhook' && config.webhook && !config.webhook.url) {
      errors.push('Webhook URL is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
