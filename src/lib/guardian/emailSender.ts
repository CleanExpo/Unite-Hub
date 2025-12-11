import {
  markGuardianNotificationFailed,
  markGuardianNotificationSent,
} from '@/lib/guardian/notificationService';

/**
 * Guardian Email Sender (G41)
 *
 * Env-based email delivery via generic webhook endpoint.
 * Works with any email provider (SendGrid, Resend, Mailgun, etc.)
 * by posting JSON to a configured webhook URL.
 *
 * Required Environment Variables:
 * - GUARDIAN_EMAIL_WEBHOOK_URL: Email provider webhook endpoint
 * - GUARDIAN_EMAIL_FROM: From address for Guardian emails
 * - GUARDIAN_EMAIL_TO_FALLBACK: Fallback recipient if none specified
 *
 * Design Principles:
 * - No external NPM dependencies (built-in fetch only)
 * - Best-effort delivery (failures logged to notification record)
 * - Configurable via environment variables
 */

const EMAIL_ENDPOINT_ENV = 'GUARDIAN_EMAIL_WEBHOOK_URL';
const EMAIL_FROM_ENV = 'GUARDIAN_EMAIL_FROM';
const EMAIL_TO_ENV = 'GUARDIAN_EMAIL_TO_FALLBACK';

/**
 * Send Guardian email notification
 *
 * @param args - Email parameters
 */
export async function sendGuardianEmailNotification(args: {
  notificationId: string;
  to?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  // Check required environment variables
  const endpoint = process.env[EMAIL_ENDPOINT_ENV];
  const from = process.env[EMAIL_FROM_ENV];
  const fallbackTo = process.env[EMAIL_TO_ENV];

  if (!endpoint || !from) {
    console.warn(
      '[Guardian G41] Email endpoint or from address not configured. Skipping email delivery.'
    );
    await markGuardianNotificationFailed(
      args.notificationId,
      'Guardian email endpoint or from address not configured.'
    );
    return;
  }

  // Determine recipient
  const to = args.to || fallbackTo;
  if (!to) {
    console.warn('[Guardian G41] Email recipient not configured. Skipping email delivery.');
    await markGuardianNotificationFailed(
      args.notificationId,
      'Guardian email recipient not configured.'
    );
    return;
  }

  try {
    console.log('[Guardian G41] Sending email notification:', {
      notificationId: args.notificationId,
      to,
      subject: args.subject,
    });

    // Send email via webhook endpoint
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error('[Guardian G41] Email provider responded with error:', {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
      });
      await markGuardianNotificationFailed(
        args.notificationId,
        `Email provider responded with ${res.status}: ${errorText.slice(0, 200)}`
      );
      return;
    }

    console.log('[Guardian G41] Email sent successfully:', {
      notificationId: args.notificationId,
      to,
    });

    await markGuardianNotificationSent(args.notificationId);
  } catch (error) {
    console.error('[Guardian G41] Email send failed:', error);
    await markGuardianNotificationFailed(
      args.notificationId,
      `Email send failed: ${String(error)}`
    );
  }
}
