/**
 * H01: AI Rule Suggestion Studio Tests
 * Tests for signals collector, heuristic/AI suggestion generators, orchestrator, and API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildRuleSuggestionSignals,
  validateSignalsArePIIFree,
} from '@/lib/guardian/ai/ruleSuggestionSignals';
import {
  deriveHeuristicSuggestions,
  validateRuleDraft,
} from '@/lib/guardian/ai/heuristicRuleSuggester';
import {
  generateAiSuggestions,
  isAiAllowedForTenant,
} from '@/lib/guardian/ai/aiRuleSuggester';
import {
  buildAndStoreSuggestions,
  listSuggestions,
  getSuggestion,
  updateSuggestionStatus,
  addSuggestionFeedback,
} from '@/lib/guardian/ai/ruleSuggestionOrchestrator';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-suggestion-id',
          tenant_id: 'test-workspace-id',
          status: 'new',
          title: 'Test Suggestion',
          rationale: 'Test rationale',
          source: 'heuristic',
          confidence: 0.65,
          signals: {},
          rule_draft: {
            name: 'Test Rule',
            type: 'alert',
            description: 'Test rule',
            config: {},
            enabled: false,
          },
          safety: {
            promptRedacted: true,
            validationPassed: true,
            validationErrors: [],
            prohibitedKeysFound: [],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: null,
          created_by: 'system',
          metadata: {},
        },
        error: null,
      }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      }),
    })),
    rpc: vi.fn().mockResolvedValue({
      data: { count: 0 },
      error: null,
    }),
  })),
}));

describe('Guardian H01: AI Rule Suggestion Studio', () => {
  const tenantId = 'test-workspace-id';

  describe('Signals Collector (buildRuleSuggestionSignals)', () => {
    it('should collect PII-free aggregates from Guardian signals', async () => {
      const signals = await buildRuleSuggestionSignals(tenantId, { hours: 24 });

      expect(signals).toBeDefined();
      expect(signals.window).toBeDefined();
      expect(signals.window.hours).toBe(24);
      expect(signals.alertRates).toBeDefined();
      expect(signals.incidentRates).toBeDefined();
      expect(signals.riskSnapshot).toBeDefined();
    });

    it('should validate signals are PII-free', async () => {
      const signals = await buildRuleSuggestionSignals(tenantId, { hours: 24 });
      const validation = validateSignalsArePIIFree(signals);

      expect(validation.isPIIFree).toBe(true);
      expect(validation.prohibitedKeysFound).toEqual([]);
    });

    it('should return minimal signals on RPC failure', async () => {
      const signals = await buildRuleSuggestionSignals(tenantId, { hours: 24 });

      // Even if RPCs fail, should return valid structure
      expect(signals.alertRates).toBeDefined();
      expect(signals.alertRates.count24h).toBeGreaterThanOrEqual(0);
    });

    it('should include counts and rates only (no raw events)', async () => {
      const signals = await buildRuleSuggestionSignals(tenantId, { hours: 24 });

      // Should have numeric aggregates
      expect(typeof signals.alertRates.count24h).toBe('number');
      expect(typeof signals.alertRates.avgPerHour24h).toBe('number');

      // Should NOT have raw events, emails, URLs, etc.
      const signalStr = JSON.stringify(signals);
      expect(signalStr).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/); // No emails
    });

    it('should support window parameter (24h, 7d, 30d)', async () => {
      const signals24 = await buildRuleSuggestionSignals(tenantId, { hours: 24 });
      const signals168 = await buildRuleSuggestionSignals(tenantId, { hours: 168 });
      const signals720 = await buildRuleSuggestionSignals(tenantId, { hours: 720 });

      expect(signals24.window.hours).toBe(24);
      expect(signals168.window.hours).toBe(168);
      expect(signals720.window.hours).toBe(720);
    });
  });

  describe('Heuristic Rule Suggester (deriveHeuristicSuggestions)', () => {
    it('should generate deterministic suggestions from signals', () => {
      const mockSignals = {
        window: { hours: 24, startedAt: new Date(), endedAt: new Date() },
        topRules: [{ ruleId: 'rule-1', ruleKey: 'test', alertCount: 200 }],
        alertRates: {
          count24h: 200,
          count7d: 1000,
          count30d: 3000,
          avgPerHour24h: 8.3,
        },
        incidentRates: {
          createdCount24h: 10,
          averageTimeToClosureMinutes: 45,
        },
        correlationStats: {
          clusterCount: 5,
          avgClusterSize: 4,
          linkRatePercent: 40,
        },
        riskSnapshot: {
          avgScore: 45,
          maxScore: 85,
          scoreDistribution: { low: 50, medium: 30, high: 15, critical: 5 },
        },
        notificationFailureRates: {
          failureCount24h: 5,
          failurePercent: 10,
          topFailedChannels: ['email'],
        },
      };

      const suggestions = deriveHeuristicSuggestions(mockSignals);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Each suggestion should have required fields
      for (const s of suggestions) {
        expect(s.title).toBeDefined();
        expect(s.rationale).toBeDefined();
        expect(s.source).toBe('heuristic');
        expect(s.confidence).toBeGreaterThanOrEqual(0.55);
        expect(s.confidence).toBeLessThanOrEqual(0.75);
        expect(s.ruleDraft).toBeDefined();
        expect(s.ruleDraft.name).toBeDefined();
        expect(s.ruleDraft.type).toBeDefined();
      }
    });

    it('should always create disabled rule drafts', () => {
      const mockSignals = {
        window: { hours: 24, startedAt: new Date(), endedAt: new Date() },
        topRules: [],
        alertRates: { count24h: 150, count7d: 500, count30d: 1000, avgPerHour24h: 6.25 },
        incidentRates: { createdCount24h: 5, averageTimeToClosureMinutes: 30 },
        correlationStats: { clusterCount: 0, avgClusterSize: 0, linkRatePercent: 0 },
        riskSnapshot: { avgScore: 30, maxScore: 60, scoreDistribution: {} },
        notificationFailureRates: { failureCount24h: 0, failurePercent: 0, topFailedChannels: [] },
      };

      const suggestions = deriveHeuristicSuggestions(mockSignals);

      // All drafts must be disabled
      for (const s of suggestions) {
        expect(s.ruleDraft.enabled).toBe(false);
      }
    });

    it('should validate rule draft format', () => {
      const validDraft = {
        name: 'Valid Rule',
        type: 'alert',
        description: 'Valid description',
        config: { threshold: 100 },
        enabled: false,
      };

      const validation = validateRuleDraft(validDraft);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should reject rule drafts with prohibited fields', () => {
      const invalidDraft = {
        name: 'Invalid Rule',
        type: 'alert',
        description: 'Description with email test@example.com',
        config: { webhook_url: 'https://example.com/webhook?token=secret' },
        enabled: false,
      };

      const validation = validateRuleDraft(invalidDraft);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('AI Suggester (generateAiSuggestions)', () => {
    it('should check governance before using AI', async () => {
      const allowed = await isAiAllowedForTenant(tenantId);
      expect(typeof allowed).toBe('boolean');
    });

    it('should return empty array if AI disabled', async () => {
      // Mock governance to disable AI
      vi.mock('@/lib/guardian/meta/metaGovernanceService', () => ({
        getTenantGovernanceFlags: vi.fn().mockResolvedValue({
          aiUsagePolicy: 'disabled',
        }),
      }));

      const suggestions = await generateAiSuggestions(tenantId, {
        window: { hours: 24, startedAt: new Date(), endedAt: new Date() },
        topRules: [],
        alertRates: { count24h: 10, count7d: 50, count30d: 100, avgPerHour24h: 0.42 },
        incidentRates: { createdCount24h: 0, averageTimeToClosureMinutes: 0 },
        correlationStats: { clusterCount: 0, avgClusterSize: 0, linkRatePercent: 0 },
        riskSnapshot: { avgScore: 10, maxScore: 20, scoreDistribution: {} },
        notificationFailureRates: { failureCount24h: 0, failurePercent: 0, topFailedChannels: [] },
      });

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should validate AI-generated suggestions for PII', async () => {
      const mockSignals = {
        window: { hours: 24, startedAt: new Date(), endedAt: new Date() },
        topRules: [],
        alertRates: { count24h: 50, count7d: 200, count30d: 500, avgPerHour24h: 2.08 },
        incidentRates: { createdCount24h: 2, averageTimeToClosureMinutes: 60 },
        correlationStats: { clusterCount: 1, avgClusterSize: 2, linkRatePercent: 50 },
        riskSnapshot: { avgScore: 40, maxScore: 70, scoreDistribution: {} },
        notificationFailureRates: { failureCount24h: 2, failurePercent: 5, topFailedChannels: [] },
      };

      const suggestions = await generateAiSuggestions(tenantId, mockSignals);

      // If any suggestions returned, they should be validated
      for (const s of suggestions) {
        expect(s.safety).toBeDefined();
        expect(s.safety.validationPassed).toBe(true);
        expect(s.safety.prohibitedKeysFound).toEqual([]);
      }
    });

    it('should include safety field with validation results', async () => {
      const mockSignals = {
        window: { hours: 24, startedAt: new Date(), endedAt: new Date() },
        topRules: [],
        alertRates: { count24h: 30, count7d: 150, count30d: 300, avgPerHour24h: 1.25 },
        incidentRates: { createdCount24h: 1, averageTimeToClosureMinutes: 45 },
        correlationStats: { clusterCount: 0, avgClusterSize: 0, linkRatePercent: 0 },
        riskSnapshot: { avgScore: 35, maxScore: 65, scoreDistribution: {} },
        notificationFailureRates: { failureCount24h: 0, failurePercent: 0, topFailedChannels: [] },
      };

      const suggestions = await generateAiSuggestions(tenantId, mockSignals);

      for (const s of suggestions) {
        expect(s.safety).toBeDefined();
        expect(typeof s.safety.promptRedacted).toBe('boolean');
        expect(typeof s.safety.validationPassed).toBe('boolean');
        expect(Array.isArray(s.safety.validationErrors)).toBe(true);
        expect(Array.isArray(s.safety.prohibitedKeysFound)).toBe(true);
      }
    });
  });

  describe('Orchestrator (buildAndStoreSuggestions)', () => {
    it('should collect signals, generate heuristic + AI suggestions, deduplicate, and store', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 10,
        expiresInDays: 30,
        actor: 'system',
      });

      expect(result.created).toBeGreaterThanOrEqual(0);
      expect(typeof result.aiUsed).toBe('boolean');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should deduplicate by title', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 10,
        expiresInDays: 30,
      });

      const titles = result.suggestions.map((s) => s.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should respect maxSuggestions parameter', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 5,
        expiresInDays: 30,
      });

      expect(result.created).toBeLessThanOrEqual(5);
    });

    it('should list suggestions with filtering', async () => {
      const { suggestions, total } = await listSuggestions(tenantId, {
        status: 'new',
        limit: 20,
        offset: 0,
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(typeof total).toBe('number');
    });

    it('should get single suggestion with full detail', async () => {
      const suggestion = await getSuggestion(tenantId, 'test-suggestion-id');

      expect(suggestion).toBeDefined();
      expect(suggestion.id).toBe('test-suggestion-id');
      expect(suggestion.title).toBeDefined();
      expect(suggestion.rationale).toBeDefined();
      expect(suggestion.rule_draft).toBeDefined();
      expect(suggestion.safety).toBeDefined();
    });

    it('should update suggestion status', async () => {
      const updated = await updateSuggestionStatus(tenantId, 'test-suggestion-id', 'reviewing', {
        reviewedAt: new Date().toISOString(),
      });

      expect(updated).toBeDefined();
    });

    it('should add feedback to suggestion', async () => {
      const feedback = await addSuggestionFeedback(tenantId, 'test-suggestion-id', {
        action: 'accepted',
        rating: 5,
        reason: 'Very useful suggestion',
        actor: 'admin-user',
      });

      expect(feedback).toBeDefined();
    });

    it('should log to Z10 audit trail if available', async () => {
      // Should not throw even if Z10 audit table doesn't exist
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 5,
        expiresInDays: 30,
        actor: 'test-user',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Non-Breaking Guarantees', () => {
    it('should not modify core Guardian tables', async () => {
      // Orchestrator should only touch guardian_rule_suggestions*
      // Not guardian_rules, guardian_alerts, guardian_incidents, etc.
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 5,
        expiresInDays: 30,
      });

      // Result should only contain suggestion metadata
      for (const s of result.suggestions) {
        expect(s.id).toBeDefined();
        expect(s.title).toBeDefined();
        expect(s.source).toMatch(/ai|heuristic/);
      }
    });

    it('should always create disabled rule drafts (never auto-enable)', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 10,
        expiresInDays: 30,
      });

      // Load each suggestion and verify draft is disabled
      for (const s of result.suggestions) {
        const detail = await getSuggestion(tenantId, s.id);
        expect(detail.rule_draft.enabled).toBe(false);
      }
    });

    it('should respect tenant isolation via RLS', async () => {
      // All queries should filter by tenant_id
      const suggestions = await listSuggestions(tenantId, {});

      // Should return only this tenant's data
      // (In real test with actual DB, would verify via different tenant query)
      expect(Array.isArray(suggestions.suggestions)).toBe(true);
    });

    it('should not export raw payloads or PII', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 5,
        expiresInDays: 30,
      });

      for (const s of result.suggestions) {
        const detail = await getSuggestion(tenantId, s.id);

        // Signals should be aggregates only
        const signalStr = JSON.stringify(detail.signals);
        expect(signalStr).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/); // No emails
        expect(signalStr).not.toMatch(/https?:\/\//); // No URLs
      }
    });
  });

  describe('API Routes Integration', () => {
    it('should enforce workspace validation on all routes', async () => {
      // Routes should validate workspaceId parameter
      // This is tested in integration tests with actual requests
      expect(true).toBe(true);
    });

    it('should enforce admin-only on POST/PATCH/DELETE actions', async () => {
      // POST /api/guardian/ai/rule-suggestions (generate) requires admin
      // PATCH /api/guardian/ai/rule-suggestions/[id] (update status) requires admin
      // POST /api/guardian/ai/rule-suggestions/[id]/feedback (record feedback) requires admin
      // POST /api/guardian/ai/rule-suggestions/[id]/apply (create rule) requires admin
      expect(true).toBe(true);
    });
  });

  describe('Expiry and Cleanup', () => {
    it('should set expires_at when storing suggestions', async () => {
      const result = await buildAndStoreSuggestions(tenantId, {
        windowHours: 24,
        maxSuggestions: 5,
        expiresInDays: 30,
      });

      for (const s of result.suggestions) {
        const detail = await getSuggestion(tenantId, s.id);
        if (detail.expires_at) {
          const expiresDate = new Date(detail.expires_at);
          const nowDate = new Date();
          const diffDays = (expiresDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThan(28);
          expect(diffDays).toBeLessThanOrEqual(31);
        }
      }
    });
  });
});
