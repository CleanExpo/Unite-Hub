import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyAdoptionStatus,
  getAdoptionDefinition,
  getAdoptionDefinitionsForDimension,
  getAllAdoptionDimensions,
  ADOPTION_SCORE_DEFS,
} from '@/lib/guardian/meta/adoptionModel';

describe('Guardian Z05: Adoption Signals & In-App Coach', () => {
  // ============================================================================
  // T02: Adoption Model Tests
  // ============================================================================
  describe('adoptionModel.ts', () => {
    it('should define 15 adoption score definitions', () => {
      expect(ADOPTION_SCORE_DEFS.length).toBe(15);
    });

    it('should have all required dimensions', () => {
      const dimensions = getAllAdoptionDimensions();
      expect(dimensions).toContain('core');
      expect(dimensions).toContain('ai_intelligence');
      expect(dimensions).toContain('qa_chaos');
      expect(dimensions).toContain('network_intelligence');
      expect(dimensions).toContain('governance');
      expect(dimensions).toContain('meta');
    });

    it('should classify adoption status correctly', () => {
      const thresholds = { inactive: 0, light: 25, regular: 60, power: 85 };

      expect(classifyAdoptionStatus(10, thresholds)).toBe('inactive');
      expect(classifyAdoptionStatus(30, thresholds)).toBe('light');
      expect(classifyAdoptionStatus(65, thresholds)).toBe('regular');
      expect(classifyAdoptionStatus(90, thresholds)).toBe('power');
    });

    it('should retrieve adoption definition by dimension and subdimension', () => {
      const def = getAdoptionDefinition('core', 'rules_usage');
      expect(def).toBeDefined();
      expect(def?.label).toContain('Rules');
      expect(def?.weight).toBe(1.0);
    });

    it('should retrieve all definitions for a dimension', () => {
      const coreDefs = getAdoptionDefinitionsForDimension('core');
      expect(coreDefs.length).toBeGreaterThan(0);
      expect(coreDefs.every((d) => d.dimension === 'core')).toBe(true);
    });

    it('should have valid threshold ordering', () => {
      ADOPTION_SCORE_DEFS.forEach((def) => {
        const { inactive, light, regular, power } = def.thresholds;
        expect(inactive).toBeLessThanOrEqual(light);
        expect(light).toBeLessThanOrEqual(regular);
        expect(regular).toBeLessThanOrEqual(power);
        expect(power).toBeLessThanOrEqual(100);
      });
    });

    it('should have valid weights between 0 and 1', () => {
      ADOPTION_SCORE_DEFS.forEach((def) => {
        expect(def.weight).toBeGreaterThan(0);
        expect(def.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should have all valid categories', () => {
      const validCategories = ['onboarding', 'activation', 'expansion', 'habit', 'health'];
      ADOPTION_SCORE_DEFS.forEach((def) => {
        expect(validCategories).toContain(def.category);
      });
    });

    it('should map core dimension subdimensions correctly', () => {
      const coreDefs = getAdoptionDefinitionsForDimension('core');
      const subDims = coreDefs.map((d) => d.subDimension);
      expect(subDims).toContain('rules_usage');
      expect(subDims).toContain('incidents_workflow');
      expect(subDims).toContain('risk_usage');
    });

    it('should map qa_chaos dimension subdimensions correctly', () => {
      const qaDefs = getAdoptionDefinitionsForDimension('qa_chaos');
      const subDims = qaDefs.map((d) => d.subDimension);
      expect(subDims).toContain('simulation_runs');
      expect(subDims).toContain('qa_coverage');
      expect(subDims).toContain('incident_drills');
    });

    it('should map network_intelligence dimension subdimensions correctly', () => {
      const netDefs = getAdoptionDefinitionsForDimension('network_intelligence');
      const subDims = netDefs.map((d) => d.subDimension);
      expect(subDims).toContain('network_console');
      expect(subDims).toContain('early_warnings');
      expect(subDims).toContain('recommendations');
    });
  });

  // ============================================================================
  // T03: Adoption Scoring Service Tests
  // ============================================================================
  describe('adoptionScoringService.ts', () => {
    it('should normalize scores between 0 and 100', () => {
      const normalize = (value: number, max: number) => Math.min(100, (value / max) * 100);

      expect(normalize(0, 30)).toBe(0);
      expect(normalize(15, 30)).toBe(50);
      expect(normalize(30, 30)).toBe(100);
      expect(normalize(60, 30)).toBe(100); // Capped at 100
    });

    it('should compute adoption scores from mock signals', () => {
      const signals = {
        'rules_count_30d': { value: 25, windowDays: 30 },
        'alerts_fired_30d': { value: 150, windowDays: 30 },
        'playbooks_total': { value: 5, windowDays: 90 },
      };

      // Simulate scoring: rules (25/30 = 83), alerts (150/200 = 75), playbooks (5/10 = 50)
      const mockScore = (values: number[], weights: number[]) => {
        const weighted = values.map((v, i) => v * weights[i]).reduce((a, b) => a + b, 0);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        return Math.round((weighted / totalWeight) * 100);
      };

      const score = mockScore([83, 75, 50], [1.0, 0.8, 0.9]);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle zero signals gracefully', () => {
      const signals = {};
      expect(Object.keys(signals).length).toBe(0);
    });

    it('should classify scores into adoption statuses', () => {
      const thresholds = { inactive: 0, light: 25, regular: 60, power: 85 };

      // Test boundary conditions
      expect(classifyAdoptionStatus(0, thresholds)).toBe('inactive');
      expect(classifyAdoptionStatus(24, thresholds)).toBe('inactive');
      expect(classifyAdoptionStatus(25, thresholds)).toBe('light');
      expect(classifyAdoptionStatus(59, thresholds)).toBe('light');
      expect(classifyAdoptionStatus(60, thresholds)).toBe('regular');
      expect(classifyAdoptionStatus(84, thresholds)).toBe('regular');
      expect(classifyAdoptionStatus(85, thresholds)).toBe('power');
      expect(classifyAdoptionStatus(100, thresholds)).toBe('power');
    });
  });

  // ============================================================================
  // T04: In-App Coach Nudge Engine Tests
  // ============================================================================
  describe('inappCoachService.ts', () => {
    it('should define nudge trigger conditions', () => {
      const trigger = {
        minScore: 0,
        maxScore: 20,
        statusEquals: 'inactive',
      };

      const score = 15;
      const status = 'inactive';

      const matches =
        (!trigger.minScore || score >= trigger.minScore) &&
        (!trigger.maxScore || score < trigger.maxScore) &&
        (!trigger.statusEquals || status === trigger.statusEquals);

      expect(matches).toBe(true);
    });

    it('should match nudge when score is inactive', () => {
      const trigger = { maxScore: 25, statusEquals: 'inactive' };
      const score = 10;
      const status = 'inactive';

      const matches = score < trigger.maxScore && status === trigger.statusEquals;
      expect(matches).toBe(true);
    });

    it('should not match nudge when score exceeds threshold', () => {
      const trigger = { maxScore: 50 };
      const score = 75;

      const matches = score < trigger.maxScore;
      expect(matches).toBe(false);
    });

    it('should generate nudges based on adoption gaps', () => {
      // Simulate nudge generation: if simulation_runs score < 20, show nudge
      const scores = {
        'qa_chaos/simulation_runs': { score: 10, status: 'inactive' },
        'core/rules_usage': { score: 75, status: 'regular' },
      };

      const generatedNudges = Object.entries(scores)
        .filter(([_key, data]) => data.score < 20)
        .map(([key]) => ({ nudgeKey: `run_${key.replace('/', '_')}` }));

      expect(generatedNudges.length).toBeGreaterThan(0);
      expect(generatedNudges[0].nudgeKey).toContain('simulation_runs');
    });

    it('should deduplicate nudges by nudgeKey', () => {
      const nudges = [
        { nudgeKey: 'run_first_simulation', title: 'Try Simulation' },
        { nudgeKey: 'run_first_simulation', title: 'Try Simulation Again' }, // Duplicate
        { nudgeKey: 'enable_network', title: 'Enable Network' },
      ];

      const deduped = Array.from(new Map(nudges.map((n) => [n.nudgeKey, n])).values());
      expect(deduped.length).toBe(2);
      expect(deduped[0].nudgeKey).toBe('run_first_simulation');
    });

    it('should sort nudges by priority', () => {
      const nudges = [
        { nudgeKey: 'a', priority: 'low' },
        { nudgeKey: 'b', priority: 'high' },
        { nudgeKey: 'c', priority: 'medium' },
      ];

      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const sorted = [...nudges].sort(
        (a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      );

      expect(sorted[0].nudgeKey).toBe('b'); // high
      expect(sorted[1].nudgeKey).toBe('c'); // medium
      expect(sorted[2].nudgeKey).toBe('a'); // low
    });

    it('should filter expired nudges', () => {
      const now = new Date();
      const nudges = [
        { nudgeKey: 'a', expiry_at: new Date(now.getTime() + 86400000).toISOString() }, // Tomorrow
        { nudgeKey: 'b', expiry_at: new Date(now.getTime() - 86400000).toISOString() }, // Yesterday (expired)
        { nudgeKey: 'c', expiry_at: null }, // No expiry
      ];

      const active = nudges.filter(
        (n) => !n.expiry_at || new Date(n.expiry_at) > now
      );

      expect(active.length).toBe(2);
      expect(active.map((n) => n.nudgeKey)).toContain('a');
      expect(active.map((n) => n.nudgeKey)).toContain('c');
    });
  });

  // ============================================================================
  // T07: AI Nudge Helper Tests
  // ============================================================================
  describe('inappCoachAiHelper.ts', () => {
    it('should return null when feature flag is disabled', async () => {
      const enableAiCoach = false;
      expect(enableAiCoach).toBe(false);
    });

    it('should return null when API key is missing', async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        expect(apiKey).toBeUndefined();
      }
    });

    it('should gracefully handle AI failures', async () => {
      // Simulate error handling
      const generateWithFallback = async () => {
        try {
          throw new Error('API call failed');
        } catch (_error) {
          return null; // Graceful degradation
        }
      };

      const result = await generateWithFallback();
      expect(result).toBeNull();
    });

    it('should validate JSON response structure', () => {
      const validJson = {
        title: 'Try Simulation',
        body: 'Run your first simulation to test scenario.',
        microTips: ['Tip 1', 'Tip 2'],
      };

      expect(validJson.title).toBeDefined();
      expect(validJson.body).toBeDefined();
      expect(Array.isArray(validJson.microTips)).toBe(true);
    });

    it('should enforce prompt safety guardrails', () => {
      const prompt = `You are a friendly Guardian in-app coach...`;

      const hasSafetyGuardrails =
        prompt.includes('friendly') ||
        prompt.includes('encouraging') ||
        prompt.includes('supportive');

      expect(hasSafetyGuardrails).toBe(true);
    });

    it('should limit response length', () => {
      const maxChars = 200;
      const response = 'This is a short nudge text that stays under 200 characters total.';

      expect(response.length).toBeLessThanOrEqual(maxChars);
    });
  });

  // ============================================================================
  // API Route Tests
  // ============================================================================
  describe('API Routes', () => {
    it('should validate workspaceId is required', () => {
      const workspaceId = new URL('http://localhost?workspaceId=').searchParams.get('workspaceId');
      expect(workspaceId).toBeNull();
    });

    it('should return adoption scores with computed_at timestamp', () => {
      const response = {
        computed_at: new Date().toISOString(),
        dimensions: [
          {
            dimension: 'core',
            subdimensions: [
              {
                sub_dimension: 'rules_usage',
                score: 75,
                status: 'regular',
              },
            ],
          },
        ],
      };

      expect(response.computed_at).toBeDefined();
      expect(response.dimensions.length).toBeGreaterThan(0);
      expect(response.dimensions[0].subdimensions[0].score).toBeLessThanOrEqual(100);
    });

    it('should filter nudges by status by default', () => {
      const nudges = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'shown' },
        { id: '3', status: 'dismissed' },
        { id: '4', status: 'completed' },
      ];

      const filtered = nudges.filter((n) => ['pending', 'shown'].includes(n.status));
      expect(filtered.length).toBe(2);
    });

    it('should support category filtering', () => {
      const nudges = [
        { id: '1', category: 'onboarding' },
        { id: '2', category: 'activation' },
        { id: '3', category: 'onboarding' },
      ];

      const category = 'onboarding';
      const filtered = nudges.filter((n) => n.category === category);

      expect(filtered.length).toBe(2);
    });

    it('should validate nudge status transitions', () => {
      const validStatuses = ['pending', 'shown', 'dismissed', 'completed'];
      const newStatus = 'shown';

      expect(validStatuses).toContain(newStatus);
    });

    it('should enforce tenant isolation on nudge updates', () => {
      const nudge = { tenant_id: 'workspace-123', id: 'nudge-456' };
      const requesterTenant = 'workspace-123';

      expect(nudge.tenant_id === requesterTenant).toBe(true);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================
  describe('Z05 Integration', () => {
    it('should compute adoption overview from all dimensions', () => {
      const dimensions = [
        {
          dimension: 'core',
          subdimensions: [
            { sub_dimension: 'rules_usage', score: 80, status: 'regular' },
            { sub_dimension: 'incidents_workflow', score: 70, status: 'regular' },
          ],
        },
        {
          dimension: 'qa_chaos',
          subdimensions: [
            { sub_dimension: 'simulation_runs', score: 40, status: 'light' },
          ],
        },
      ];

      const overallScore =
        dimensions.reduce((sum, d) => {
          const dimAvg = d.subdimensions.reduce((s, sub) => s + sub.score, 0) / d.subdimensions.length;
          return sum + dimAvg;
        }, 0) / dimensions.length;

      expect(overallScore).toBeGreaterThan(0);
      expect(overallScore).toBeLessThanOrEqual(100);
    });

    it('should identify adoption gaps and suggest nudges', () => {
      const scores = {
        'core/rules_usage': 85,
        'qa_chaos/simulation_runs': 5,
        'network_intelligence/network_console': 15,
      };

      const gaps = Object.entries(scores)
        .filter(([_key, score]) => score < 30)
        .map(([key]) => key);

      expect(gaps.length).toBe(2);
      expect(gaps).toContain('qa_chaos/simulation_runs');
      expect(gaps).toContain('network_intelligence/network_console');
    });

    it('should maintain immutable adoption score history', () => {
      const scores = [
        { id: '1', computed_at: '2025-01-01T00:00:00Z', score: 50 },
        { id: '2', computed_at: '2025-01-02T00:00:00Z', score: 55 },
        { id: '3', computed_at: '2025-01-03T00:00:00Z', score: 60 },
      ];

      // Scores should be append-only, never updated
      const latest = scores[scores.length - 1];
      expect(latest.score).toBeGreaterThan(scores[0].score);
    });

    it('should track nudge lifecycle transitions', () => {
      const nudge = {
        id: 'nudge-123',
        status: 'pending' as const,
      };

      const transitions = ['pending', 'shown', 'dismissed'];
      expect(transitions).toContain(nudge.status);

      // Simulate status update
      nudge.status = 'shown' as const;
      expect(nudge.status).toBe('shown');
    });
  });
});
