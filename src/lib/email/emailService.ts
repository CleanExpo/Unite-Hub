/**
 * Email Service Wrapper for Workflow Executor
 *
 * Re-exports the main email service with added metadata support
 * for workflow tracking and campaign attribution.
 *
 * @module email/emailService
 */

import {
  sendEmail as sendEmailBase,
  type EmailOptions,
  type EmailResult,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  getProviderStatus,
  testProvider,
} from './email-service';

/**
 * Extended email options with metadata support for workflows
 */
export interface EmailOptionsWithMetadata extends EmailOptions {
  metadata?: {
    campaign_id?: string;
    enrollment_id?: string;
    contact_id?: string;
    step_id?: string;
    node_id?: string;
    workflow_id?: string;
    [key: string]: any;
  };
}

/**
 * Send email with workflow metadata tracking
 *
 * This wrapper extends the base email service to support metadata
 * for campaign tracking, workflow attribution, and analytics.
 *
 * @param options Email options including metadata
 * @returns EmailResult with delivery status
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Campaign Update',
 *   html: '<p>Hello!</p>',
 *   text: 'Hello!',
 *   metadata: {
 *     campaign_id: 'camp_123',
 *     enrollment_id: 'enroll_456',
 *     contact_id: 'contact_789',
 *   },
 * });
 * ```
 */
export async function sendEmail(
  options: EmailOptionsWithMetadata
): Promise<EmailResult> {
  const { metadata, ...emailOptions } = options;

  // TODO: Store metadata in database for tracking
  // For now, log it for observability
  if (metadata) {
    console.log('[EmailService] Sending email with metadata:', {
      to: options.to,
      subject: options.subject,
      metadata,
    });
  }

  // Send email using base service
  const result = await sendEmailBase(emailOptions);

  // TODO: Log delivery event with metadata to database
  if (result.success && metadata) {
    console.log('[EmailService] Email sent successfully:', {
      messageId: result.messageId,
      provider: result.provider,
      metadata,
    });
  }

  return result;
}

// Re-export other functions
export {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
  getProviderStatus,
  testProvider,
  type EmailResult,
  type EmailOptions,
};
