/**
 * Email Executor
 *
 * Executes email nodes (send email action)
 *
 * @module lib/workflows/executors/EmailExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';
import { sendEmail } from '@/lib/email/email-service';
import { generatePersonalizedContent } from '@/lib/agents/content-personalization';

const logger = createApiLogger({ service: 'EmailExecutor' });

export class EmailExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.config || {};
    const channelConfig = context.current_step?.channel_config?.email;

    if (!channelConfig) {
      throw new Error('Email configuration not found in step');
    }

    logger.info('Executing email node', {
      nodeId: node.id,
      contactId: context.contact.id,
      subject: channelConfig.subject,
    });

    // Personalize content if enabled
    let subject = channelConfig.subject;
    let body = channelConfig.body_html || channelConfig.body;

    if (channelConfig.personalization_enabled) {
      try {
        const personalized = await generatePersonalizedContent({
          subject,
          body,
          contact: context.contact,
          variables: context.variables,
        });

        subject = personalized.subject;
        body = personalized.body;
      } catch (error) {
        logger.warn('Personalization failed, using original content', { error });
      }
    }

    // Replace variables
    subject = this.replaceVariables(subject, context);
    body = this.replaceVariables(body, context);

    // Send email
    try {
      const result = await sendEmail({
        to: context.contact.email,
        subject,
        html: body,
        text: this.stripHtml(body),
        metadata: {
          campaign_id: context.campaign.id,
          enrollment_id: context.enrollment.id,
          contact_id: context.contact.id,
          step_id: context.current_step?.id,
          node_id: node.id,
        },
      });

      logger.info('Email sent successfully', {
        nodeId: node.id,
        contactId: context.contact.id,
        messageId: result.messageId,
      });

      return {
        success: true,
        eventData: {
          email_id: result.messageId,
          subject,
          to: context.contact.email,
          provider: result.provider,
        },
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error,
        nodeId: node.id,
        contactId: context.contact.id,
      });

      throw error;
    }
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = node.data.config || {};

    if (!config.subject || config.subject.trim() === '') {
      errors.push('Email subject is required');
    }

    if (!config.body || config.body.trim() === '') {
      errors.push('Email body is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Replace template variables in text
   */
  private replaceVariables(text: string, context: ExecutionContext): string {
    let result = text;

    // Replace contact fields
    const contact = context.contact;
    result = result.replace(/\{\{first_name\}\}/g, contact.first_name || '');
    result = result.replace(/\{\{last_name\}\}/g, contact.last_name || '');
    result = result.replace(/\{\{email\}\}/g, contact.email || '');
    result = result.replace(/\{\{company_name\}\}/g, contact.company_name || '');

    // Replace workflow variables
    Object.entries(context.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
