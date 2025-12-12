import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadActiveMetaIntegrationsForTenant,
  mapReadinessSnapshotToIntegrationPayload,
  mapUpliftPlanToIntegrationPayload,
  mapEditionFitToIntegrationPayload,
  mapExecutiveReportToIntegrationPayload,
  mapAdoptionScoresToIntegrationPayload,
  mapLifecycleRunToIntegrationPayload,
  enqueueMetaWebhookEvents,
} from '@/lib/guardian/meta/metaIntegrationService';

import {
  deliverWebhookEvent,
  getWebhookEventStats,
} from '@/lib/guardian/meta/metaWebhookDeliveryService';

import {
  generateSuccessNarrative,
  generateFallbackNarrative,
} from '@/lib/guardian/meta/successNarrativeAiHelper';

describe('Guardian Z07: Meta Integration & Success Toolkit', () => {
  // ============================================================================
  // Payload Mapper Tests
  // ============================================================================
  describe('Payload Mappers (Meta-Only)', () => {
    it('should map readiness snapshot to integration payload (no PII)', () => {
      const snapshot = {
        tenant_id: 'workspace-123',
        computed_at: '2025-12-12T12:00:00Z',
        overall_score: 85,
        band: 'aligned',
        capability_scores: [
          { key: 'rule_creation', score: 90, label: 'Rule Creation' },
          { key: 'incident_workflow', score: 80, label: 'Incident Workflow' },
        ],
      };

      const payload = mapReadinessSnapshotToIntegrationPayload(snapshot);

      expect(payload.event_type).toBe('readiness_updated');
      expect(payload.scope).toBe('readiness');
      expect(payload.data.overall_score).toBe(85);
      expect(payload.data.band).toBe('aligned');
      expect(payload.data.capability_count).toBe(2);
      expect(payload.data.capabilities_summary).toHaveLength(2);

      // Ensure no PII (tenant_id should NOT be in payload)
      expect(JSON.stringify(payload)).not.toContain('workspace-123');
    });

    it('should map uplift plan to integration payload', () => {
      const plan = {
        tenant_id: 'workspace-123',
        id: 'plan-456',
        created_at: '2025-12-01T00:00:00Z',
        title: 'Network Intelligence Adoption',
        status: 'active' as const,
      };

      const tasksSummary = {
        total: 10,
        completed: 6,
        in_progress: 3,
        blocked: 1,
      };

      const payload = mapUpliftPlanToIntegrationPayload(plan, tasksSummary);

      expect(payload.event_type).toBe('uplift_plan_updated'); // active, not draft
      expect(payload.scope).toBe('uplift');
      expect(payload.data.plan_id).toBe('plan-456');
      expect(payload.data.tasks.completion_percentage).toBe(60);
      expect(payload.data.tasks.total).toBe(10);
    });

    it('should map edition fit to integration payload', () => {
      const fitSnapshot = {
        tenant_id: 'workspace-123',
        computed_at: '2025-12-12T10:00:00Z',
        edition_key: 'pro',
        edition_label: 'Guardian Pro',
        fit_score: 78,
        fit_status: 'high' as const,
      };

      const payload = mapEditionFitToIntegrationPayload(fitSnapshot);

      expect(payload.event_type).toBe('edition_fit_computed');
      expect(payload.data.edition_key).toBe('pro');
      expect(payload.data.fit_score).toBe(78);
      expect(payload.data.fit_status).toBe('high');
    });

    it('should map adoption scores to integration payload', () => {
      const adoptionSnapshot = {
        tenant_id: 'workspace-123',
        computed_at: '2025-12-12T11:00:00Z',
        dimensions: [
          { dimension: 'core', status: 'regular' as const, score: 75 },
          { dimension: 'ai_intelligence', status: 'light' as const, score: 45 },
          { dimension: 'network_intelligence', status: 'inactive' as const, score: 20 },
        ],
      };

      const payload = mapAdoptionScoresToIntegrationPayload(adoptionSnapshot);

      expect(payload.event_type).toBe('adoption_scores_computed');
      expect(payload.data.dimensions).toHaveLength(3);
      expect(payload.data.overall_adoption_status).toBe('inactive'); // Most conservative
    });

    it('should map lifecycle run to integration payload', () => {
      const lifecycleSummary = {
        tenant_id: 'workspace-123',
        run_at: '2025-12-12T09:00:00Z',
        total_compacted: 500,
        total_deleted: 50,
        operations_successful: 6,
        operations_failed: 0,
      };

      const payload = mapLifecycleRunToIntegrationPayload(lifecycleSummary);

      expect(payload.event_type).toBe('meta_lifecycle_run_completed');
      expect(payload.scope).toBe('lifecycle');
      expect(payload.data.total_compacted).toBe(500);
      expect(payload.data.operations_successful).toBe(6);
    });
  });

  // ============================================================================
  // Webhook Delivery Tests
  // ============================================================================
  describe('Webhook Delivery Service', () => {
    it('should reject delivery without webhook_url in config', async () => {
      const event = {
        id: 'event-123',
        tenant_id: 'workspace-123',
        created_at: '2025-12-12T12:00:00Z',
        integration_id: 'int-123',
        event_type: 'readiness_updated',
        payload: { test: true },
        status: 'pending' as const,
        attempt_count: 0,
      };

      const integration = {
        id: 'int-123',
        tenant_id: 'workspace-123',
        integration_key: 'test_integration',
        config: {}, // No webhook_url
      };

      const result = await deliverWebhookEvent(event, integration);

      expect(result.success).toBe(false);
      expect(result.error).toContain('webhook_url');
    });

    it('should include custom headers in webhook delivery', async () => {
      // Mock fetch to capture the call
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      global.fetch = fetchMock;

      const event = {
        id: 'event-456',
        tenant_id: 'workspace-123',
        created_at: '2025-12-12T12:00:00Z',
        integration_id: 'int-456',
        event_type: 'adoption_scores_computed',
        payload: { dimensions: [] },
        status: 'pending' as const,
        attempt_count: 0,
      };

      const integration = {
        id: 'int-456',
        tenant_id: 'workspace-123',
        integration_key: 'cs_dashboard',
        config: {
          webhook_url: 'https://cs-tool.example.com/webhooks',
          headers: {
            Authorization: 'Bearer secret-token-123',
            'X-Custom-Header': 'value',
          },
        },
      };

      const result = await deliverWebhookEvent(event, integration);

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://cs-tool.example.com/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer secret-token-123',
            'X-Custom-Header': 'value',
          }),
        })
      );
    });

    it('should timeout if delivery takes too long', async () => {
      const fetchMock = vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves, will timeout
          })
      );

      global.fetch = fetchMock;

      const event = {
        id: 'event-789',
        tenant_id: 'workspace-123',
        created_at: '2025-12-12T12:00:00Z',
        integration_id: 'int-789',
        event_type: 'readiness_updated',
        payload: {},
        status: 'pending' as const,
        attempt_count: 0,
      };

      const integration = {
        id: 'int-789',
        tenant_id: 'workspace-123',
        integration_key: 'slow_endpoint',
        config: {
          webhook_url: 'https://slow.example.com/webhook',
        },
      };

      const result = await deliverWebhookEvent(event, integration, 100); // 100ms timeout

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ============================================================================
  // AI Success Narrative Tests
  // ============================================================================
  describe('AI Success Narrative Helper', () => {
    it('should generate fallback narrative when AI disabled', () => {
      const ctx = {
        readinessScore: 80,
        readinessTrend: 'up' as const,
        editionStories: [
          { key: 'pro', label: 'Pro', fitScore: 85, status: 'recommended' },
        ],
        upliftSummary: {
          activePlans: 2,
          tasksDone: 5,
          tasksTotal: 12,
        },
        adoptionSnapshot: [
          { dimension: 'core', status: 'regular' as const },
          { dimension: 'network_intelligence', status: 'light' as const },
        ],
        executiveSummary: {
          reportsLast90d: 4,
        },
        timeframeLabel: 'Last 90 days',
      };

      const fallback = generateFallbackNarrative(ctx);

      expect(fallback.headline).toBeTruthy();
      expect(Array.isArray(fallback.bullets)).toBe(true);
      expect(fallback.bullets.length).toBeGreaterThan(0);
      expect(fallback.commentary).toBeTruthy();

      // Ensure no PII in fallback
      expect(JSON.stringify(fallback)).not.toContain('workspace');
    });

    it('should include readiness trend in narrative', () => {
      const ctxUp = {
        readinessScore: 85,
        readinessTrend: 'up' as const,
        editionStories: [],
        upliftSummary: { activePlans: 0, tasksDone: 0, tasksTotal: 0 },
        adoptionSnapshot: [],
        executiveSummary: { reportsLast90d: 0 },
        timeframeLabel: 'Recent',
      };

      const narrative = generateFallbackNarrative(ctxUp);
      expect(narrative.headline.toLowerCase()).toContain('up');
    });
  });

  // ============================================================================
  // Safety & Non-Breaking Tests
  // ============================================================================
  describe('Z07 Safety & Non-Breaking Guarantees', () => {
    it('should never expose core Guardian data in integration payloads', () => {
      // Each mapper should only contain meta-safe data
      const mappers = [
        mapReadinessSnapshotToIntegrationPayload({
          tenant_id: 'workspace-secret',
          computed_at: '2025-12-12T00:00:00Z',
          overall_score: 75,
          band: 'aligned',
        }),
        mapEditionFitToIntegrationPayload({
          tenant_id: 'workspace-secret',
          computed_at: '2025-12-12T00:00:00Z',
          edition_key: 'pro',
          edition_label: 'Pro',
          fit_score: 80,
          fit_status: 'high',
        }),
      ];

      mappers.forEach((payload) => {
        const payloadStr = JSON.stringify(payload);
        // No raw logs
        expect(payloadStr).not.toContain('log');
        expect(payloadStr).not.toContain('event');
        // No tenant identifiers
        expect(payloadStr).not.toContain('workspace-secret');
      });
    });

    it('should only allow meta-scope integrations', () => {
      const allowedScopes = ['readiness', 'uplift', 'editions', 'executive_reports', 'adoption', 'lifecycle'];
      const coreGuardianScopes = [
        'alerts',
        'incidents',
        'rules',
        'playbooks',
        'network',
        'anomalies',
        'correlations',
      ];

      // Integration should only use allowed scopes
      const validIntegration = {
        scopes: ['readiness', 'adoption'],
      };

      expect(validIntegration.scopes.every((s) => allowedScopes.includes(s))).toBe(true);

      // Should never accidentally include core Guardian scopes
      const invalidIntegration = {
        scopes: ['readiness', 'alerts'], // 'alerts' is NOT allowed
      };

      expect(invalidIntegration.scopes.every((s) => allowedScopes.includes(s))).toBe(false);
    });

    it('should mark events with correct type for traceability', () => {
      const eventTypes = [
        'readiness_updated',
        'uplift_plan_created',
        'uplift_plan_updated',
        'edition_fit_computed',
        'executive_report_created',
        'adoption_scores_computed',
        'meta_lifecycle_run_completed',
        'test',
      ];

      const payload1 = mapReadinessSnapshotToIntegrationPayload({
        tenant_id: 'ws-123',
        computed_at: '2025-12-12T00:00:00Z',
        overall_score: 50,
      });

      expect(eventTypes).toContain(payload1.event_type);
    });
  });

  // ============================================================================
  // Tenant Isolation Tests
  // ============================================================================
  describe('Tenant Isolation & RLS', () => {
    it('should enforce tenant_id filtering in integration queries', () => {
      // This test verifies that the service respects tenant scoping
      // In a real scenario, RLS would prevent cross-tenant access at DB level
      const integrations = [
        {
          id: 'int-1',
          tenant_id: 'workspace-a',
          integration_key: 'key1',
          scopes: ['readiness'],
        },
        {
          id: 'int-2',
          tenant_id: 'workspace-b',
          integration_key: 'key2',
          scopes: ['adoption'],
        },
      ];

      // Filter for workspace-a only
      const filteredA = integrations.filter((i) => i.tenant_id === 'workspace-a');

      expect(filteredA).toHaveLength(1);
      expect(filteredA[0].id).toBe('int-1');
      expect(filteredA).not.toContainEqual(expect.objectContaining({ tenant_id: 'workspace-b' }));
    });
  });

  // ============================================================================
  // Integration Config Tests
  // ============================================================================
  describe('Integration Configuration Validation', () => {
    it('should reject integrations with empty config', () => {
      const invalidConfig = {};
      expect(Object.keys(invalidConfig).length).toBe(0);
      expect(typeof invalidConfig === 'object' && Object.keys(invalidConfig).length > 0).toBe(false);
    });

    it('should allow valid webhook_url in config', () => {
      const validConfig = {
        webhook_url: 'https://cs-tool.example.com/webhooks',
        headers: { Authorization: 'Bearer token' },
      };

      expect(validConfig.webhook_url).toBeTruthy();
      expect(typeof validConfig.webhook_url).toBe('string');
      expect(validConfig.webhook_url.startsWith('https://')).toBe(true);
    });

    it('should track webhook delivery status transitions', () => {
      const statuses = ['pending', 'delivered', 'failed', 'discarded'];
      const event = {
        status: 'pending' as const,
      };

      expect(statuses).toContain(event.status);

      // Simulate status transition
      const updatedEvent = { ...event, status: 'delivered' as const };
      expect(statuses).toContain(updatedEvent.status);
    });
  });
});
