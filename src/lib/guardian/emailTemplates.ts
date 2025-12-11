import type { GuardianNotificationSeverity } from '@/lib/guardian/notificationService';

/**
 * Guardian Email Templates (G41)
 *
 * HTML and text email rendering for Guardian alert notifications.
 * Designed to work with any email provider (SendGrid, Resend, Mailgun, etc.)
 * via a generic webhook endpoint.
 */

/**
 * Convert severity to human-readable label
 */
function severityLabel(severity?: GuardianNotificationSeverity | null): string {
  if (!severity) return 'Info';
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * Get severity color for visual emphasis
 */
function severityColor(severity?: GuardianNotificationSeverity | null): string {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // red-600
    case 'high':
      return '#ea580c'; // orange-600
    case 'medium':
      return '#d97706'; // amber-600
    case 'low':
      return '#0891b2'; // cyan-600
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Render email subject line for Guardian alert
 *
 * @param opts - Subject line options
 * @returns Subject line string
 */
export function renderGuardianAlertEmailSubject(opts: {
  ruleName: string;
  severity?: GuardianNotificationSeverity | null;
}): string {
  const sev = severityLabel(opts.severity);
  return `[Guardian] ${sev} alert: ${opts.ruleName}`;
}

/**
 * Render email body for Guardian alert (HTML + text)
 *
 * @param opts - Email body options
 * @returns HTML and text versions
 */
export function renderGuardianAlertEmailBody(opts: {
  ruleName: string;
  severity?: GuardianNotificationSeverity | null;
  source: string;
  message: string;
  payloadSnippet: string;
}): { html: string; text: string } {
  const sev = severityLabel(opts.severity);
  const color = severityColor(opts.severity);

  // Plain text version
  const text = [
    `Guardian generated a ${sev} alert.`,
    '',
    `Rule: ${opts.ruleName}`,
    `Severity: ${sev}`,
    `Source: ${opts.source}`,
    '',
    `Message: ${opts.message}`,
    '',
    'Payload snippet:',
    opts.payloadSnippet,
    '',
    '---',
    'You are receiving this because Guardian monitoring is enabled for your workspace.',
    'Visit your Unite-Hub dashboard to manage Guardian settings.',
  ].join('\n');

  // HTML version with styling
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardian Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                🛡️ Guardian Alert
              </h1>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 24px 32px 16px 32px;">
              <div style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
                ${sev.toUpperCase()} ALERT
              </div>
            </td>
          </tr>

          <!-- Alert Details -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Guardian monitoring has detected an issue in your workspace and generated an alert.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; font-weight: 600;">Rule</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-size: 13px;">${opts.ruleName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; font-weight: 600;">Severity</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: ${color}; font-size: 13px; font-weight: 600;">${sev}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 13px; font-weight: 600;">Source</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-size: 13px;">${opts.source}</span>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 16px; margin-bottom: 20px; border-radius: 6px;">
                <p style="margin: 0; color: #111827; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${opts.message}</p>
              </div>

              <!-- Payload -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Payload Snippet
                </p>
                <div style="background-color: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 6px; overflow-x: auto;">
                  <pre style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;">${opts.payloadSnippet}</pre>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                You are receiving this notification from <strong>Guardian</strong>, the Unite-Hub governance and observability layer.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                To manage Guardian settings or update notification preferences, visit your Unite-Hub dashboard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
