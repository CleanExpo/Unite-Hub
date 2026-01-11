/**
 * Slack Alert Notifier
 * Sends threat alerts to Slack via webhooks with rich block formatting
 *
 * Features:
 * - Rich block formatting (header, sections, actions)
 * - Color coding by severity (critical/high/medium/low)
 * - Emoji indicators
 * - Deep links to dashboard
 * - Multi-workspace support
 */

import type { SEOThreat } from '../seo-threat-monitor';

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

/**
 * Build Slack message blocks for threat alert
 */
function buildSlackBlocks(threat: SEOThreat, dashboardUrl?: string): SlackBlock[] {
  const emoji = getEmojiForSeverity(threat.severity);
  const color = getColorForSeverity(threat.severity);

  const blocks: SlackBlock[] = [
    // Header
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${threat.title}`,
        emoji: true,
      },
    },

    // Divider
    {
      type: 'divider',
    },

    // Threat Details
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Severity:*\n${threat.severity.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Domain:*\n${threat.domain}`,
        },
        {
          type: 'mrkdwn',
          text: `*Type:*\n${threat.type.replace(/_/g, ' ')}`,
        },
        {
          type: 'mrkdwn',
          text: `*Impact:*\n${threat.impactEstimate}`,
        },
      ],
    },

    // Description
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${threat.description}`,
      },
    },

    // Recommended Action
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recommended Action:*\n${threat.recommendedAction}`,
      },
    },

    // Divider
    {
      type: 'divider',
    },

    // Timestamp
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Detected at: ${new Date(threat.detectedAt).toISOString()}`,
        },
      ],
    },
  ];

  // Add button if dashboard URL provided
  if (dashboardUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View in Dashboard',
            emoji: true,
          },
          url: dashboardUrl,
          style: 'primary',
        },
      ],
    });
  }

  return blocks;
}

/**
 * Send alert to Slack via webhook
 */
export async function sendSlackAlert(
  threat: SEOThreat,
  webhookUrl: string,
  dashboardUrl?: string
): Promise<void> {
  const blocks = buildSlackBlocks(threat, dashboardUrl);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks,
      text: threat.title, // Fallback text for clients that don't support blocks
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook error: ${response.status} ${text}`);
  }
}

/**
 * Get emoji for threat severity
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
 * Get color for threat severity (for Slack rich formatting)
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
