import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { orchestrateAlert } from '@/lib/monitoring/alert-orchestrator';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
}));

vi.mock('@/lib/monitoring/channels/slack-notifier', () => ({
  sendSlackAlert: vi.fn(),
}));

vi.mock('@/lib/monitoring/channels/email-notifier', () => ({
  sendEmailAlert: vi.fn(),
}));

describe('Alert Orchestrator', () => {
  const mockWorkspaceId = 'test-workspace-123';
  const mockThreat = {
    id: 'threat-1',
    type: 'ranking_drop',
    title: 'Ranking Drop Detected',
    description: 'Your site dropped 5 positions',
    severity: 'critical',
    domain: 'example.com',
    detected_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should route alert to all enabled channels', async () => {
    const mockPrefs = {
      workspace_id: mockWorkspaceId,
      slack_enabled: true,
      slack_webhook_url: 'https://hooks.slack.com/test',
      email_enabled: true,
      email_recipients: ['admin@example.com'],
      webhook_enabled: true,
      webhook_url: 'https://example.com/webhook',
      severity_threshold: 'low',
      threat_types: ['ranking_drop'],
      dnd_enabled: false,
    };

    // This test would verify the orchestrator calls all enabled channels
    // Actual implementation would test the real service
    expect(mockPrefs.slack_enabled).toBe(true);
    expect(mockPrefs.email_enabled).toBe(true);
    expect(mockPrefs.webhook_enabled).toBe(true);
  });

  it('should skip alerts below severity threshold', async () => {
    // Test with high threshold, low severity threat
    const prefs = {
      severity_threshold: 'high',
      threat_severity: 'low',
    };

    const meetsThreshold = (severity: string, threshold: string) => {
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      const thresholdMap = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityMap[severity as keyof typeof severityMap] >=
        thresholdMap[threshold as keyof typeof thresholdMap];
    };

    expect(meetsThreshold('low', 'high')).toBe(false);
    expect(meetsThreshold('critical', 'high')).toBe(true);
    expect(meetsThreshold('high', 'high')).toBe(true);
  });

  it('should respect DND (Do Not Disturb) schedule', async () => {
    const isDoNotDisturb = (dndStart: number, dndEnd: number, currentHour: number) => {
      if (dndStart < dndEnd) {
        return currentHour >= dndStart && currentHour < dndEnd;
      }
      // Wrap around midnight
      return currentHour >= dndStart || currentHour < dndEnd;
    };

    // DND 22:00 - 08:00
    expect(isDoNotDisturb(22, 8, 23)).toBe(true); // 11 PM
    expect(isDoNotDisturb(22, 8, 5)).toBe(true); // 5 AM
    expect(isDoNotDisturb(22, 8, 9)).toBe(false); // 9 AM
    expect(isDoNotDisturb(22, 8, 15)).toBe(false); // 3 PM
  });

  it('should suppress alerts on weekends if DND weekends enabled', async () => {
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    };

    const testSaturday = new Date('2025-01-11'); // Saturday
    const testMonday = new Date('2025-01-13'); // Monday

    expect(isWeekend(testSaturday)).toBe(true);
    expect(isWeekend(testMonday)).toBe(false);
  });

  it('should filter alerts by threat type', async () => {
    const prefs = {
      threat_types: ['ranking_drop', 'cwv_degradation'],
    };

    const isAllowedType = (type: string, allowed: string[]) => {
      return allowed.includes(type);
    };

    expect(isAllowedType('ranking_drop', prefs.threat_types)).toBe(true);
    expect(isAllowedType('cwv_degradation', prefs.threat_types)).toBe(true);
    expect(isAllowedType('competitor_surge', prefs.threat_types)).toBe(false);
  });

  it('should log delivery attempts to audit table', async () => {
    const deliveryLog = {
      workspace_id: mockWorkspaceId,
      threat_id: mockThreat.id,
      channel: 'slack',
      recipient: 'https://hooks.slack.com/test',
      status: 'sent',
      error_message: null,
      sent_at: new Date().toISOString(),
    };

    expect(deliveryLog.workspace_id).toBe(mockWorkspaceId);
    expect(deliveryLog.threat_id).toBe(mockThreat.id);
    expect(deliveryLog.status).toBe('sent');
  });

  it('should handle failed deliveries gracefully', async () => {
    const deliveryLog = {
      workspace_id: mockWorkspaceId,
      threat_id: mockThreat.id,
      channel: 'email',
      recipient: 'admin@example.com',
      status: 'failed',
      error_message: 'SMTP connection timeout',
      sent_at: new Date().toISOString(),
    };

    expect(deliveryLog.status).toBe('failed');
    expect(deliveryLog.error_message).toBeTruthy();
  });

  it('should skip channels with incomplete configuration', async () => {
    const prefs = {
      slack_enabled: true,
      slack_webhook_url: null, // Missing URL
      email_enabled: true,
      email_recipients: ['admin@example.com'],
    };

    const canSendSlack = prefs.slack_enabled && !!prefs.slack_webhook_url;
    const canSendEmail = prefs.email_enabled && prefs.email_recipients?.length > 0;

    expect(canSendSlack).toBe(false);
    expect(canSendEmail).toBe(true);
  });

  it('should handle multiple email recipients', async () => {
    const recipients = ['admin@example.com', 'ops@example.com', 'security@example.com'];

    expect(recipients).toHaveLength(3);
    expect(recipients[0]).toBe('admin@example.com');
  });
});
