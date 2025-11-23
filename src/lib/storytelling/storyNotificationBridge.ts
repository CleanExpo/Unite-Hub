/**
 * Story Notification Bridge
 * Phase 75: Prepare story content for notifications (email, in-app, future voice/video)
 */

import { StoryTouchpoint, getTouchpointSummary } from './storyTouchpointEngine';
import { ClientStoryNarrative, FounderStoryNarrative } from './storytellingNarrativeBuilder';
import { exportToEmail } from './storyExportFormats';

export interface EmailContent {
  subject: string;
  preview_text: string;
  body: string;
  plain_text: string;
}

export interface DigestItem {
  client_name: string;
  timeframe: string;
  excerpt: string;
  metrics_count: number;
  wins_count: number;
  data_status: string;
  needs_attention: boolean;
}

/**
 * Build email body for client story touchpoint
 */
export function buildClientStoryEmailBody(touchpoint: StoryTouchpoint): EmailContent {
  const summary = getTouchpointSummary(touchpoint);
  const narrative = touchpoint.narrative;

  const timeframeLabel = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    ninety_day: '90-Day',
  }[touchpoint.timeframe];

  const subject = `${timeframeLabel} Story Update: ${summary.title}`;
  const previewText = touchpoint.excerpt;

  // Build HTML body
  let body = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333; font-size: 24px;">${narrative.title}</h1>
  <p style="color: #666; font-size: 14px;">${narrative.subtitle}</p>

  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h2 style="color: #333; font-size: 16px; margin: 0 0 8px 0;">Summary</h2>
    <p style="color: #555; font-size: 14px; margin: 0;">${narrative.executive_summary}</p>
  </div>
`;

  // Add KPI highlights
  if (narrative.kpi_highlights.length > 0) {
    body += `
  <div style="margin: 16px 0;">
    <h2 style="color: #333; font-size: 16px;">Key Metrics</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f0f0f0;">
        <th style="padding: 8px; text-align: left; font-size: 12px;">Metric</th>
        <th style="padding: 8px; text-align: left; font-size: 12px;">Value</th>
        <th style="padding: 8px; text-align: left; font-size: 12px;">Trend</th>
      </tr>
`;
    for (const kpi of narrative.kpi_highlights) {
      body += `
      <tr>
        <td style="padding: 8px; font-size: 14px;">${kpi.name}</td>
        <td style="padding: 8px; font-size: 14px;">${kpi.value}</td>
        <td style="padding: 8px; font-size: 14px;">${kpi.trend}</td>
      </tr>
`;
    }
    body += `
    </table>
  </div>
`;
  }

  // Add key wins
  if (narrative.key_wins.length > 0 &&
      narrative.key_wins[0] !== 'Journey is progressing - wins will be highlighted as milestones are achieved') {
    body += `
  <div style="margin: 16px 0;">
    <h2 style="color: #333; font-size: 16px;">Key Wins</h2>
    <ul style="margin: 0; padding-left: 20px;">
`;
    for (const win of narrative.key_wins) {
      body += `      <li style="color: #555; font-size: 14px; margin: 4px 0;">${win}</li>\n`;
    }
    body += `
    </ul>
  </div>
`;
  }

  // Add next steps
  if (narrative.next_steps.length > 0) {
    body += `
  <div style="margin: 16px 0;">
    <h2 style="color: #333; font-size: 16px;">Next Steps</h2>
    <ol style="margin: 0; padding-left: 20px;">
`;
    for (const step of narrative.next_steps) {
      body += `      <li style="color: #555; font-size: 14px; margin: 4px 0;">${step}</li>\n`;
    }
    body += `
    </ol>
  </div>
`;
  }

  // Add data notice
  body += `
  <div style="margin: 24px 0; padding-top: 16px; border-top: 1px solid #ddd;">
    <p style="color: #999; font-size: 12px; margin: 0;">
      ${narrative.data_notice}
    </p>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
      View Full Story in Dashboard
    </a>
  </div>
</div>
`;

  // Plain text version
  const plainText = exportToEmail(narrative as ClientStoryNarrative).content;

  return {
    subject,
    preview_text: previewText,
    body,
    plain_text: plainText,
  };
}

/**
 * Build founder digest email with multiple client touchpoints
 */
export function buildFounderDigestEmailBody(
  touchpoints: StoryTouchpoint[],
  timeframeLabel: string
): EmailContent {
  const subject = `${timeframeLabel} Client Story Digest - ${touchpoints.length} Clients`;
  const previewText = `Story updates for ${touchpoints.length} clients`;

  const digestItems: DigestItem[] = touchpoints.map(tp => {
    const summary = getTouchpointSummary(tp);
    return {
      client_name: tp.client_name,
      timeframe: tp.timeframe,
      excerpt: tp.excerpt,
      metrics_count: summary.metrics_count,
      wins_count: summary.wins_count,
      data_status: tp.data_status,
      needs_attention: tp.data_status === 'limited' || tp.story_health < 40,
    };
  });

  const needsAttentionCount = digestItems.filter(i => i.needs_attention).length;

  let body = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333; font-size: 24px;">${timeframeLabel} Client Story Digest</h1>
  <p style="color: #666; font-size: 14px;">
    ${touchpoints.length} client stories generated
    ${needsAttentionCount > 0 ? ` • ${needsAttentionCount} need attention` : ''}
  </p>
`;

  // Summary stats
  body += `
  <div style="display: flex; gap: 16px; margin: 16px 0;">
    <div style="flex: 1; background: #f5f5f5; padding: 12px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #333;">${touchpoints.length}</div>
      <div style="font-size: 12px; color: #666;">Total</div>
    </div>
    <div style="flex: 1; background: #e8f5e9; padding: 12px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #2e7d32;">${digestItems.filter(i => i.data_status === 'complete').length}</div>
      <div style="font-size: 12px; color: #666;">Complete</div>
    </div>
    <div style="flex: 1; background: ${needsAttentionCount > 0 ? '#fff3e0' : '#f5f5f5'}; padding: 12px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: ${needsAttentionCount > 0 ? '#ef6c00' : '#333'};">${needsAttentionCount}</div>
      <div style="font-size: 12px; color: #666;">Needs Attention</div>
    </div>
  </div>
`;

  // Client list
  body += `
  <div style="margin: 16px 0;">
    <h2 style="color: #333; font-size: 16px;">Client Stories</h2>
`;

  for (const item of digestItems) {
    const statusColor = item.data_status === 'complete' ? '#2e7d32' :
                        item.data_status === 'partial' ? '#f9a825' : '#ef6c00';
    const statusBg = item.data_status === 'complete' ? '#e8f5e9' :
                     item.data_status === 'partial' ? '#fff8e1' : '#fff3e0';

    body += `
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 8px 0; ${item.needs_attention ? 'border-left: 4px solid #ef6c00;' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #333; font-size: 14px;">${item.client_name}</strong>
        <span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
          ${item.data_status}
        </span>
      </div>
      <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">${item.excerpt}</p>
      <div style="display: flex; gap: 16px; font-size: 11px; color: #999;">
        <span>${item.metrics_count} metrics</span>
        <span>${item.wins_count} wins</span>
      </div>
    </div>
`;
  }

  body += `
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="#" style="background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
      View All Stories in Dashboard
    </a>
  </div>
</div>
`;

  // Plain text version
  let plainText = `${timeframeLabel} Client Story Digest\n`;
  plainText += `${touchpoints.length} client stories generated\n\n`;

  for (const item of digestItems) {
    plainText += `${item.client_name} [${item.data_status}]\n`;
    plainText += `${item.excerpt}\n`;
    plainText += `${item.metrics_count} metrics • ${item.wins_count} wins\n\n`;
  }

  return {
    subject,
    preview_text: previewText,
    body,
    plain_text: plainText,
  };
}

/**
 * Build in-app notification content
 */
export function buildInAppNotification(touchpoint: StoryTouchpoint): {
  title: string;
  message: string;
  action_url: string;
  priority: 'low' | 'medium' | 'high';
} {
  const summary = getTouchpointSummary(touchpoint);
  const timeframeLabel = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    ninety_day: '90-Day',
  }[touchpoint.timeframe];

  return {
    title: `${timeframeLabel} Story Ready`,
    message: touchpoint.excerpt,
    action_url: '/client/dashboard/touchpoints',
    priority: touchpoint.data_status === 'limited' ? 'high' : 'low',
  };
}

/**
 * Build founder alert for client needing attention
 */
export function buildFounderAlert(touchpoint: StoryTouchpoint): {
  title: string;
  message: string;
  client_id: string;
  severity: 'info' | 'warning' | 'critical';
} {
  const severity = touchpoint.story_health < 25 ? 'critical' :
                   touchpoint.story_health < 50 ? 'warning' : 'info';

  return {
    title: `Story Alert: ${touchpoint.client_name}`,
    message: `${touchpoint.timeframe} story has ${touchpoint.data_status} data (${touchpoint.story_health}% health)`,
    client_id: touchpoint.client_id,
    severity,
  };
}

export default {
  buildClientStoryEmailBody,
  buildFounderDigestEmailBody,
  buildInAppNotification,
  buildFounderAlert,
};
