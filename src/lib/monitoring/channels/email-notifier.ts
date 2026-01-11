/**
 * Email Alert Notifier
 * Sends threat alerts via email using Sendgrid or Resend
 *
 * Features:
 * - Multi-provider support (Sendgrid or Resend)
 * - HTML email templates with inline CSS
 * - Responsive design
 * - Rich formatting
 * - Multiple recipients
 */

import type { SEOThreat } from '../seo-threat-monitor';

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'sendgrid') as 'sendgrid' | 'resend';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'alerts@unite-hub.com';

/**
 * Send alert email to multiple recipients
 */
export async function sendEmailAlert(
  threat: SEOThreat,
  recipients: string[],
  dashboardUrl?: string
): Promise<void> {
  const html = buildEmailHTML(threat, dashboardUrl);
  const subject = `[${threat.severity.toUpperCase()}] ${threat.title}`;

  if (EMAIL_PROVIDER === 'resend') {
    await sendViaResend(recipients, subject, html);
  } else {
    await sendViaSendgrid(recipients, subject, html);
  }
}

/**
 * Build HTML email template
 */
function buildEmailHTML(threat: SEOThreat, dashboardUrl?: string): string {
  const color = getColorForSeverity(threat.severity);
  const emoji = getEmojiForSeverity(threat.severity);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: ${color};
      color: white;
      padding: 24px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .severity {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 24px;
    }
    .field {
      margin-bottom: 16px;
    }
    .label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .value {
      color: #333;
      font-size: 14px;
      line-height: 1.5;
    }
    .divider {
      border-top: 1px solid #eee;
      margin: 16px 0;
    }
    .cta-button {
      background-color: #ff6b35;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
      margin-top: 16px;
      font-weight: 600;
      font-size: 14px;
    }
    .cta-button:hover {
      background-color: #ff5a1f;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 16px 24px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .timestamp {
      color: #999;
      font-size: 12px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${emoji} ${threat.title}</h1>
      <div class="severity">Severity: ${threat.severity.toUpperCase()}</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Domain & Type -->
      <div class="field">
        <span class="label">Domain:</span>
        <span class="value">${threat.domain}</span>
      </div>

      <div class="field">
        <span class="label">Threat Type:</span>
        <span class="value">${threat.type.replace(/_/g, ' ')}</span>
      </div>

      <!-- Impact -->
      <div class="field">
        <span class="label">Estimated Impact:</span>
        <span class="value">${threat.impactEstimate}</span>
      </div>

      <div class="divider"></div>

      <!-- Description -->
      <div class="field">
        <span class="label">Description:</span>
        <span class="value">${threat.description}</span>
      </div>

      <!-- Recommended Action -->
      <div class="field">
        <span class="label">Recommended Action:</span>
        <span class="value">${threat.recommendedAction}</span>
      </div>

      <!-- CTA Button -->
      ${
        dashboardUrl
          ? `<div><a href="${dashboardUrl}" class="cta-button">View in Dashboard</a></div>`
          : ''
      }

      <!-- Timestamp -->
      <div class="timestamp">
        Detected: ${new Date(threat.detectedAt).toLocaleString()}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Unite-Hub SEO Threat Alert</p>
      <p>This is an automated alert. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email via Sendgrid
 */
async function sendViaSendgrid(recipients: string[], subject: string, html: string): Promise<void> {
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY || '');

    await sgMail.default.sendMultiple({
      to: recipients,
      from: FROM_EMAIL,
      subject,
      html,
    });

    console.log(`[EmailNotifier] Sent via Sendgrid to ${recipients.length} recipients`);
  } catch (error) {
    console.error('[EmailNotifier] Sendgrid error:', error);
    throw new Error(`Sendgrid failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(recipients: string[], subject: string, html: string): Promise<void> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Resend sends to one recipient at a time
    await Promise.all(
      recipients.map((recipient) =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: recipient,
          subject,
          html,
        })
      )
    );

    console.log(`[EmailNotifier] Sent via Resend to ${recipients.length} recipients`);
  } catch (error) {
    console.error('[EmailNotifier] Resend error:', error);
    throw new Error(`Resend failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get emoji for severity
 */
function getEmojiForSeverity(severity: string): string {
  const emojis: Record<string, string> = {
    critical: '🚨',
    high: '⚠️',
    medium: '🔔',
    low: 'ℹ️',
  };

  return emojis[severity.toLowerCase()] || '📋';
}

/**
 * Get color for severity
 */
function getColorForSeverity(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#e74c3c', // Red
    high: '#e67e22', // Orange
    medium: '#f39c12', // Yellow
    low: '#3498db', // Blue
  };

  return colors[severity.toLowerCase()] || '#95a5a6';
}
