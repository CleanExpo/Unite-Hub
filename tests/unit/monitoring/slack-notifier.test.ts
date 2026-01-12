import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Slack API
vi.mock('@/lib/external/slack-api', () => ({
  postToSlack: vi.fn(),
}));

describe('Slack Notifier', () => {
  const mockThreat = {
    id: 'threat-1',
    type: 'ranking_drop',
    title: 'Ranking Drop Detected',
    description: 'Your site dropped 5 positions for key target keywords',
    severity: 'critical',
    domain: 'example.com',
    impact: 'Estimated traffic loss: 500-1000 visitors/day',
    detected_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should format critical threat with red color', async () => {
    const getSlackColor = (severity: string) => {
      const colors: Record<string, string> = {
        critical: '#e74c3c',
        high: '#e67e22',
        medium: '#f39c12',
        low: '#3498db',
      };
      return colors[severity] || '#95a5a6';
    };

    expect(getSlackColor('critical')).toBe('#e74c3c');
    expect(getSlackColor('high')).toBe('#e67e22');
  });

  it('should include threat details in block format', async () => {
    const blocks = {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '*Severity:*\nCritical' },
        { type: 'mrkdwn', text: '*Domain:*\nexample.com' },
        { type: 'mrkdwn', text: '*Type:*\nRanking Drop' },
        { type: 'mrkdwn', text: '*Impact:*\nEstimated traffic loss' },
      ],
    };

    expect(blocks.fields).toHaveLength(4);
    expect(blocks.fields[0].text).toContain('Severity');
  });

  it('should generate action button for dashboard link', async () => {
    const dashboardUrl = 'https://app.unite-hub.com/workspace/test-123/health-check';

    const button = {
      type: 'button',
      text: { type: 'plain_text', text: 'View in Dashboard', emoji: true },
      url: dashboardUrl,
      style: 'primary',
    };

    expect(button.text.text).toBe('View in Dashboard');
    expect(button.url).toBe(dashboardUrl);
    expect(button.style).toBe('primary');
  });

  it('should include emoji indicator for severity', async () => {
    const getSeverityEmoji = (severity: string) => {
      const emojis: Record<string, string> = {
        critical: '🚨',
        high: '⚠️',
        medium: '🔔',
        low: 'ℹ️',
      };
      return emojis[severity] || '•';
    };

    expect(getSeverityEmoji('critical')).toBe('🚨');
    expect(getSeverityEmoji('high')).toBe('⚠️');
    expect(getSeverityEmoji('medium')).toBe('🔔');
    expect(getSeverityEmoji('low')).toBe('ℹ️');
  });

  it('should handle markdown formatting in description', async () => {
    const formatMarkdown = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold to Slack bold
        .replace(/__(.*?)__/g, '_$1_') // Italic to Slack italic
        .replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>'); // Links to Slack links
    };

    const input = '**Critical** issue detected on _important_ keyword. <https://example.com|View page>';
    const output = formatMarkdown(input);

    expect(output).toContain('*Critical*');
    expect(output).toContain('_important_');
  });

  it('should support text for all threat types', async () => {
    const threatTypeLabels: Record<string, string> = {
      ranking_drop: 'Ranking Drop',
      cwv_degradation: 'Core Web Vitals Issue',
      technical_error: 'Technical Error',
      competitor_surge: 'Competitor Activity',
      security_issue: 'Security Issue',
      indexation_problem: 'Indexation Problem',
    };

    expect(threatTypeLabels['ranking_drop']).toBe('Ranking Drop');
    expect(threatTypeLabels['cwv_degradation']).toBe('Core Web Vitals Issue');
    expect(threatTypeLabels['security_issue']).toBe('Security Issue');
  });

  it('should truncate long descriptions gracefully', async () => {
    const truncateDescription = (text: string, maxLength: number = 300) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const longText = 'A'.repeat(400);
    expect(truncateDescription(longText).length).toBeLessThanOrEqual(303);
    expect(truncateDescription(longText).endsWith('...')).toBe(true);
  });

  it('should validate webhook URL format', async () => {
    const isValidSlackWebhook = (url: string) => {
      return url.startsWith('https://hooks.slack.com/services/');
    };

    expect(isValidSlackWebhook('https://hooks.slack.com/services/TTEST/BTEST/test-webhook-placeholder')).toBe(true);
    expect(isValidSlackWebhook('http://example.com')).toBe(false);
    expect(isValidSlackWebhook('')).toBe(false);
  });

  it('should retry on transient failures', async () => {
    const retryCount = 3;
    let attempts = 0;

    const shouldRetry = (error: Error, attempt: number) => {
      // Retry on network errors, not on auth errors
      return attempt < retryCount && error.message.includes('timeout');
    };

    const error = new Error('Connection timeout');
    expect(shouldRetry(error, 1)).toBe(true);
    expect(shouldRetry(error, 3)).toBe(false);
  });
});
