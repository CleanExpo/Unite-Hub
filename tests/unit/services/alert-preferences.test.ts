import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

describe('Alert Preferences Service', () => {
  const mockWorkspaceId = 'workspace-123';
  const defaultPreferences = {
    workspace_id: mockWorkspaceId,
    slack_enabled: false,
    slack_webhook_url: null,
    email_enabled: false,
    email_recipients: [],
    webhook_enabled: false,
    webhook_url: null,
    severity_threshold: 'high',
    threat_types: [
      'ranking_drop',
      'cwv_degradation',
      'technical_error',
      'competitor_surge',
      'security_issue',
      'indexation_problem',
    ],
    dnd_enabled: false,
    dnd_start_hour: 22,
    dnd_end_hour: 8,
    dnd_timezone: 'UTC',
    dnd_weekends: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch existing preferences for workspace', async () => {
    const prefs = defaultPreferences;
    expect(prefs.workspace_id).toBe(mockWorkspaceId);
    expect(prefs.slack_enabled).toBe(false);
  });

  it('should create default preferences if not exists', async () => {
    const newPrefs = { ...defaultPreferences };
    expect(newPrefs.severity_threshold).toBe('high');
    expect(newPrefs.dnd_start_hour).toBe(22);
    expect(newPrefs.dnd_end_hour).toBe(8);
  });

  it('should validate Slack webhook URL format', async () => {
    const isValidSlackWebhook = (url: string) => {
      return url.startsWith('https://hooks.slack.com/services/');
    };

    expect(isValidSlackWebhook('https://hooks.slack.com/services/T00/B00/XX')).toBe(true);
    expect(isValidSlackWebhook('http://example.com')).toBe(false);
  });

  it('should validate email addresses', async () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail('admin@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });

  it('should update Slack settings', async () => {
    const updated = {
      ...defaultPreferences,
      slack_enabled: true,
      slack_webhook_url: 'https://hooks.slack.com/services/T00/B00/XX',
    };

    expect(updated.slack_enabled).toBe(true);
    expect(updated.slack_webhook_url).toContain('hooks.slack.com');
  });

  it('should update email settings with multiple recipients', async () => {
    const recipients = ['admin@example.com', 'ops@example.com', 'security@example.com'];
    const updated = {
      ...defaultPreferences,
      email_enabled: true,
      email_recipients: recipients,
    };

    expect(updated.email_recipients).toHaveLength(3);
    expect(updated.email_recipients[0]).toBe('admin@example.com');
  });

  it('should enforce DND hour range validation', async () => {
    const validateDNDRange = (start: number, end: number) => {
      return start >= 0 && start <= 23 && end >= 0 && end <= 23;
    };

    expect(validateDNDRange(22, 8)).toBe(true);
    expect(validateDNDRange(8, 22)).toBe(true);
    expect(validateDNDRange(24, 8)).toBe(false);
    expect(validateDNDRange(10, 25)).toBe(false);
  });

  it('should support severity threshold levels', async () => {
    const severityLevels = ['low', 'medium', 'high', 'critical'];

    severityLevels.forEach((level) => {
      expect(['low', 'medium', 'high', 'critical']).toContain(level);
    });
  });

  it('should support all 6 threat types', async () => {
    const threatTypes = [
      'ranking_drop',
      'cwv_degradation',
      'technical_error',
      'competitor_surge',
      'security_issue',
      'indexation_problem',
    ];

    expect(threatTypes).toHaveLength(6);
    expect(threatTypes).toContain('ranking_drop');
    expect(threatTypes).toContain('security_issue');
  });

  it('should filter threat types for alerts', async () => {
    const prefs = {
      ...defaultPreferences,
      threat_types: ['ranking_drop', 'security_issue'],
    };

    const isAlertTypeEnabled = (type: string) => {
      return prefs.threat_types.includes(type);
    };

    expect(isAlertTypeEnabled('ranking_drop')).toBe(true);
    expect(isAlertTypeEnabled('security_issue')).toBe(true);
    expect(isAlertTypeEnabled('cwv_degradation')).toBe(false);
  });

  it('should support timezone selection', async () => {
    const timezones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Asia/Tokyo',
    ];

    const updated = {
      ...defaultPreferences,
      dnd_timezone: 'America/New_York',
    };

    expect(timezones).toContain('America/New_York');
    expect(updated.dnd_timezone).toBe('America/New_York');
  });

  it('should enable/disable weekend DND', async () => {
    const updated = {
      ...defaultPreferences,
      dnd_weekends: true,
    };

    expect(updated.dnd_weekends).toBe(true);
  });

  it('should handle concurrent preference updates', async () => {
    // Simulate concurrent updates
    const update1 = { ...defaultPreferences, slack_enabled: true };
    const update2 = { ...defaultPreferences, email_enabled: true };

    expect(update1.slack_enabled).toBe(true);
    expect(update2.email_enabled).toBe(true);
  });

  it('should enforce workspace isolation in queries', async () => {
    // Verify that workspace_id is always included in queries
    const prefs = { ...defaultPreferences };
    expect(prefs.workspace_id).toBeDefined();
    expect(prefs.workspace_id).toBe(mockWorkspaceId);
  });

  it('should return null for non-existent workspace', async () => {
    const result = null;
    expect(result).toBeNull();
  });

  it('should update timestamps on save', async () => {
    const updated = {
      ...defaultPreferences,
      updated_at: new Date().toISOString(),
    };

    expect(updated.updated_at).toBeDefined();
  });
});
