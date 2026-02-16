/**
 * Unit Tests: CredentialAlertService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCredential, createMockAlert } from '../../utils/test-helpers';

// Build a chainable mock that supports .select().eq().lte().gte().order().single().insert().update()
function createChainableMock(resolveValue: any = { data: null, error: null }) {
  const mock: any = {};
  const methods = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'order', 'limit', 'insert', 'update', 'delete', 'upsert'];
  for (const method of methods) {
    mock[method] = vi.fn().mockReturnValue(mock);
  }
  mock.single = vi.fn().mockResolvedValue(resolveValue);
  // When the chain is awaited directly (without .single()), resolve the data
  mock.then = (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject);
  return mock;
}

// Mock @supabase/supabase-js
const mockFromFn = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFromFn,
  })),
}));

// Mock ConfigManager
vi.mock('@/cli/utils/config-manager', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    loadConfig: vi.fn(() => ({ workspace_id: 'workspace-uuid' })),
  })),
}));

// Mock CredentialManager
const mockGetWorkspaceCredentials = vi.fn().mockResolvedValue([]);
vi.mock('@/cli/services/tenant/credential-manager', () => ({
  CredentialManager: vi.fn().mockImplementation(() => ({
    getWorkspaceCredentials: mockGetWorkspaceCredentials,
  })),
}));

// Set env vars needed by the constructor
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { CredentialAlertService } = await import('@/cli/services/monitoring/credential-alerts');

describe('CredentialAlertService', () => {
  let alertService: InstanceType<typeof CredentialAlertService>;

  beforeEach(() => {
    vi.clearAllMocks();
    alertService = new CredentialAlertService();
  });

  describe('checkAndSendAlerts', () => {
    it('should generate alerts for expiring credentials', async () => {
      const expiringCredential = {
        tenantId: 'TEST_CLIENT_001',
        service: 'shopify',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilExpiry: 7,
      };

      mockGetWorkspaceCredentials.mockResolvedValue([expiringCredential]);

      // Mock alerts table: findExistingAlert returns null (no existing alert)
      const findAlertChain = createChainableMock({ data: null, error: null });
      // Mock alerts table: createAlert returns new alert
      const createAlertChain = createChainableMock({
        data: createMockAlert({ severity: 'warning', type: 'expiring_7d' }),
        error: null,
      });
      // Mock alert_rules: sendAlert check returns no rules
      const rulesChain = createChainableMock({ data: [], error: null });

      let alertCallCount = 0;
      mockFromFn.mockImplementation((table: string) => {
        if (table === 'alerts') {
          alertCallCount++;
          // First call: findExistingAlert, second call: createAlert
          if (alertCallCount <= 1) return findAlertChain;
          return createAlertChain;
        }
        if (table === 'alert_rules') return rulesChain;
        return createChainableMock();
      });

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('expiring_7d');
    });

    it('should not create duplicate alerts within 24 hours', async () => {
      const credential = {
        tenantId: 'TEST_CLIENT_001',
        service: 'shopify',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilExpiry: 5,
      };

      mockGetWorkspaceCredentials.mockResolvedValue([credential]);

      // findExistingAlert returns an existing alert (created 12h ago)
      const existingAlertData = createMockAlert({
        sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      });
      const findAlertChain = createChainableMock({ data: existingAlertData, error: null });

      mockFromFn.mockImplementation((table: string) => {
        if (table === 'alerts') return findAlertChain;
        return createChainableMock();
      });

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts.length).toBe(0);
    });

    it('should classify alerts by severity correctly', async () => {
      const criticalCredential = {
        tenantId: 'TEST_CLIENT_001',
        service: 'shopify',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilExpiry: 1,
      };

      mockGetWorkspaceCredentials.mockResolvedValue([criticalCredential]);

      // No existing alert
      const findAlertChain = createChainableMock({ data: null, error: null });
      // Create returns critical alert
      const createAlertChain = createChainableMock({
        data: createMockAlert({ severity: 'critical', type: 'expiring_1d' }),
        error: null,
      });
      const rulesChain = createChainableMock({ data: [], error: null });

      let alertCallCount = 0;
      mockFromFn.mockImplementation((table: string) => {
        if (table === 'alerts') {
          alertCallCount++;
          if (alertCallCount <= 1) return findAlertChain;
          return createAlertChain;
        }
        if (table === 'alert_rules') return rulesChain;
        return createChainableMock();
      });

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].type).toBe('expiring_1d');
    });
  });

  describe('configureAlertRule', () => {
    it('should create alert rule successfully', async () => {
      const ruleData = {
        workspaceId: 'workspace-uuid',
        alertType: 'expiring_7d' as const,
        channels: ['email' as const, 'slack' as const],
        emailRecipients: ['admin@example.com'],
        slackWebhookUrl: 'https://hooks.slack.com/...',
      };

      const mockRule = {
        id: 'rule-uuid',
        workspace_id: ruleData.workspaceId,
        alert_type: ruleData.alertType,
        channels: ruleData.channels,
        email_recipients: ruleData.emailRecipients,
        slack_webhook_url: ruleData.slackWebhookUrl,
        custom_webhook_url: null,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const chain = createChainableMock({ data: mockRule, error: null });
      mockFromFn.mockReturnValue(chain);

      const result = await alertService.configureAlertRule(ruleData);

      expect(result.alertType).toBe('expiring_7d');
      expect(result.channels).toContain('email');
      expect(result.channels).toContain('slack');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully', async () => {
      const chain = createChainableMock({ data: null, error: null });
      // Make eq resolve directly (acknowledgeAlert checks error from eq result)
      chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFromFn.mockReturnValue(chain);

      await expect(alertService.acknowledgeAlert('alert-uuid')).resolves.not.toThrow();
    });
  });

  describe('getAlerts', () => {
    it('should retrieve unacknowledged alerts', async () => {
      const mockAlerts = [
        createMockAlert({ acknowledged: false }),
        createMockAlert({ id: 'alert-2', acknowledged: false }),
      ];

      // The getAlerts method chains: .from().select().eq().order()
      // Then conditionally calls .eq() again on the result.
      // So order() must return a chainable mock that is also thenable.
      const chain = createChainableMock({ data: mockAlerts, error: null });
      mockFromFn.mockReturnValue(chain);

      const alerts = await alertService.getAlerts('workspace-uuid', false);

      expect(alerts.length).toBe(2);
      expect(alerts.every((a: any) => !a.acknowledged)).toBe(true);
    });
  });
});
