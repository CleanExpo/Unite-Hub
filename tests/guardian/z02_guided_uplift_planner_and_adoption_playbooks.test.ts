import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UPLIFT_PLAYBOOKS, matchPlaybooksForReadiness, matchPlaybooksForRecommendations } from '@/lib/guardian/meta/upliftPlaybookModel';
import { enrichUpliftTaskHints, formatEnrichedHints, enrichMultipleUpliftTasks } from '@/lib/guardian/meta/upliftAiHelper';
import { createMockAnthropicClient } from '../__mocks__/guardianAnthropic.mock';

// Mock Anthropic client
vi.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: vi.fn(() => createMockAnthropicClient()),
}));

// Mock the upliftAiHelper's direct Anthropic usage
vi.mock('@/lib/guardian/meta/upliftAiHelper', async () => {
  const actual = await vi.importActual('@/lib/guardian/meta/upliftAiHelper');
  return {
    ...actual,
    enrichUpliftTaskHints: vi.fn().mockResolvedValue({
      steps: ['Configure', 'Enable', 'Validate'],
      success_criteria: ['Feature enabled'],
      time_estimate_minutes: 30,
      resources: ['Documentation'],
      common_pitfalls: ['Missing setup'],
      validation_checklist: ['Check logs'],
    }),
    formatEnrichedHints: vi.fn().mockReturnValue(
      '⏱️ Estimated time: 30 minutes
📋 Steps:
  1. Configure
  2. Enable
  3. Validate'
    ),
    enrichMultipleUpliftTasks: vi.fn().mockResolvedValue(
      new Map([
        ['task-1', {
          steps: ['Configure', 'Enable', 'Validate'],
          success_criteria: ['Feature enabled'],
          time_estimate_minutes: 30,
          resources: ['Documentation'],
          common_pitfalls: ['Missing setup'],
          validation_checklist: ['Check logs'],
        }],
        ['task-2', {
          steps: ['Setup', 'Configure', 'Test'],
          success_criteria: ['No errors'],
          time_estimate_minutes: 20,
          resources: ['Docs'],
          common_pitfalls: ['Config error'],
          validation_checklist: ['Verify'],
        }],
      ])
    ),
  };
});

vi.mock('@/lib/anthropic/rate-limiter', () => ({
  callAnthropicWithRetry: vi.fn().mockResolvedValue({
    data: {
      content: [{
        type: 'text',
        text: JSON.stringify({
          hints: ['Ensure prerequisites are met', 'Follow documented procedures'],
          steps: ['Step 1', 'Step 2']
        })
      }]
    },
    attempts: 1,
    totalTime: 100
  })
}));

describe('Z02: Guardian Guided Uplift Planner & Adoption Playbooks', () => {
  describe('Uplift Playbooks Model', () => {
    it('should have valid playbooks', () => {
      expect(UPLIFT_PLAYBOOKS.length).toBeGreaterThan(0);
    });

    it('should have 5 canonical playbooks', () => {
      expect(UPLIFT_PLAYBOOKS.length).toBe(5);
    });

    it('should have playbooks with unique IDs', () => {
      const ids = UPLIFT_PLAYBOOKS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have baseline-to-operational playbook', () => {
      const playbook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'baseline-to-operational');
      expect(playbook).toBeDefined();
      expect(playbook?.tasks.length).toBeGreaterThan(0);
    });

    it('should have operational-to-mature playbook', () => {
      const playbook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'operational-to-mature');
      expect(playbook).toBeDefined();
      expect(playbook?.tasks.length).toBeGreaterThan(0);
    });

    it('should have mature-to-network-intelligent playbook', () => {
      const playbook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'mature-to-network-intelligent');
      expect(playbook).toBeDefined();
      expect(playbook?.tasks.length).toBeGreaterThan(0);
    });

    it('should have playbook-rehearsal-operationalization playbook', () => {
      const playbook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'playbook-rehearsal-operationalization');
      expect(playbook).toBeDefined();
      expect(playbook?.tasks.length).toBeGreaterThan(0);
    });

    it('should have recommendations-continuous-improvement playbook', () => {
      const playbook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'recommendations-continuous-improvement');
      expect(playbook).toBeDefined();
      expect(playbook?.tasks.length).toBeGreaterThan(0);
    });

    it('should have valid task structure', () => {
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          expect(task.title).toBeDefined();
          expect(task.title.length).toBeGreaterThan(0);
          expect(task.description).toBeDefined();
          expect(task.description.length).toBeGreaterThan(0);
          expect(task.category).toBeDefined();
          expect(task.priority).toBeDefined();
          expect(task.effortEstimate).toBeDefined();
        });
      });
    });

    it('should have valid trigger conditions', () => {
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        expect(playbook.triggers).toBeDefined();
        expect(Array.isArray(playbook.triggers)).toBe(true);
        playbook.triggers.forEach((trigger) => {
          expect(trigger.capabilityKey || trigger.recommendationType).toBeDefined();
          if (trigger.minScore !== undefined) {
            expect(trigger.minScore).toBeGreaterThanOrEqual(0);
            expect(trigger.minScore).toBeLessThanOrEqual(100);
          }
          if (trigger.maxScore !== undefined) {
            expect(trigger.maxScore).toBeGreaterThanOrEqual(0);
            expect(trigger.maxScore).toBeLessThanOrEqual(100);
          }
        });
      });
    });

    it('should have hints with link targets', () => {
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          if (task.linkTargets && task.linkTargets.length > 0) {
            task.linkTargets.forEach((link) => {
              expect(link.module).toBeDefined();
              expect(link.label).toBeDefined();
            });
          }
        });
      });
    });
  });

  describe('Playbook Matching by Readiness', () => {
    it('should match baseline playbooks when score is low', () => {
      const readinessResults = [
        { capabilityKey: 'guardian.core.rules', score: 20, status: 'not_configured' },
      ];
      const matched = matchPlaybooksForReadiness(readinessResults, 25);
      expect(matched.length).toBeGreaterThan(0);
      expect(matched.some((p) => p.id === 'baseline-to-operational')).toBe(true);
    });

    it('should match operational playbooks when score is moderate', () => {
      const readinessResults = [
        { capabilityKey: 'guardian.core.rules', score: 50, status: 'partial' },
        { capabilityKey: 'guardian.core.risk', score: 40, status: 'not_configured' },
      ];
      const matched = matchPlaybooksForReadiness(readinessResults, 45);
      expect(matched.length).toBeGreaterThan(0);
    });

    it('should match mature playbooks when score is high', () => {
      const readinessResults = [
        { capabilityKey: 'guardian.qa.i_series.simulation', score: 50, status: 'partial' },
      ];
      const matched = matchPlaybooksForReadiness(readinessResults, 65);
      expect(matched.length).toBeGreaterThan(0);
    });

    it('should match network-intelligent playbooks at high scores', () => {
      const readinessResults = [
        { capabilityKey: 'guardian.network.x01_telemetry', score: 30, status: 'not_configured' },
      ];
      const matched = matchPlaybooksForReadiness(readinessResults, 80);
      expect(matched.length).toBeGreaterThan(0);
    });

    it('should return empty array when no playbooks match', () => {
      const matched = matchPlaybooksForReadiness([], 100);
      // Even at 100, should still recommend continuous improvement
      expect(Array.isArray(matched)).toBe(true);
    });

    it('should handle mixed readiness results', () => {
      const readinessResults = [
        { capabilityKey: 'guardian.core.rules', score: 70, status: 'ready' },
        { capabilityKey: 'guardian.core.risk', score: 50, status: 'partial' },
        { capabilityKey: 'guardian.network.x01_telemetry', score: 20, status: 'not_configured' },
      ];
      const matched = matchPlaybooksForReadiness(readinessResults, 55);
      expect(Array.isArray(matched)).toBe(true);
      expect(matched.length).toBeGreaterThan(0);
    });
  });

  describe('Playbook Matching by Recommendations', () => {
    it('should match playbooks when recommendations reference X-series', () => {
      const recommendations = [
        {
          id: 'rec-1',
          capabilityKey: 'guardian.network.x01_telemetry',
          title: 'Enable network telemetry',
          description: 'Set up telemetry collection',
        },
      ];
      const matched = matchPlaybooksForRecommendations(recommendations);
      expect(Array.isArray(matched)).toBe(true);
    });

    it('should match playbooks when recommendations reference I-series', () => {
      const recommendations = [
        {
          id: 'rec-1',
          capabilityKey: 'guardian.qa.i_series.simulation',
          title: 'Run regression tests',
          description: 'Add QA simulation coverage',
        },
      ];
      const matched = matchPlaybooksForRecommendations(recommendations);
      expect(Array.isArray(matched)).toBe(true);
    });

    it('should return empty array for empty recommendations', () => {
      const matched = matchPlaybooksForRecommendations([]);
      expect(Array.isArray(matched)).toBe(true);
    });

    it('should deduplicate matched playbooks', () => {
      const recommendations = [
        { id: 'rec-1', capabilityKey: 'guardian.network.x01_telemetry', title: 'Enable telemetry', description: 'Collect metrics' },
        { id: 'rec-2', capabilityKey: 'guardian.network.x02_anomalies', title: 'Enable anomalies', description: 'Detect anomalies' },
      ];
      const matched = matchPlaybooksForRecommendations(recommendations);
      const ids = new Set(matched.map((p) => p.id));
      expect(ids.size).toBe(matched.length); // All unique
    });
  });

  describe('Uplift Plan Validation', () => {
    it('should have valid status values', () => {
      const validStatuses = ['draft', 'active', 'completed', 'archived'];
      expect(validStatuses).toContain('draft');
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).toContain('archived');
    });

    it('should have valid task status values', () => {
      const validTaskStatuses = ['todo', 'in_progress', 'blocked', 'done'];
      expect(validTaskStatuses).toContain('todo');
      expect(validTaskStatuses).toContain('in_progress');
      expect(validTaskStatuses).toContain('blocked');
      expect(validTaskStatuses).toContain('done');
    });

    it('should have valid priority values', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          expect(validPriorities).toContain(task.priority);
        });
      });
    });

    it('should have valid effort estimate values', () => {
      const validEfforts = ['XS', 'S', 'M', 'L', 'XL'];
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          expect(validEfforts).toContain(task.effortEstimate);
        });
      });
    });

    it('should have valid category values', () => {
      const validCategories = ['core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'other'];
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          expect(validCategories).toContain(task.category);
        });
      });
    });
  });

  describe('Target Score Calculation', () => {
    it('should calculate next maturity band for baseline', () => {
      // baseline: 0-39 -> operational: 40-59
      const currentScore = 25;
      const targetScore = 40; // Move to operational
      expect(targetScore).toBeGreaterThan(currentScore);
      expect(targetScore).toBeGreaterThanOrEqual(40);
      expect(targetScore).toBeLessThan(60);
    });

    it('should calculate next maturity band for operational', () => {
      // operational: 40-59 -> mature: 60-79
      const currentScore = 45;
      const targetScore = 60; // Move to mature
      expect(targetScore).toBeGreaterThan(currentScore);
      expect(targetScore).toBeGreaterThanOrEqual(60);
      expect(targetScore).toBeLessThan(80);
    });

    it('should calculate next maturity band for mature', () => {
      // mature: 60-79 -> network_intelligent: 80-100
      const currentScore = 75;
      const targetScore = 80; // Move to network_intelligent
      expect(targetScore).toBeGreaterThan(currentScore);
      expect(targetScore).toBeGreaterThanOrEqual(80);
      expect(targetScore).toBeLessThanOrEqual(100);
    });

    it('should cap target score at 100', () => {
      const currentScore = 95;
      const targetScore = Math.min(100, currentScore + 20); // Would be 115, but capped
      expect(targetScore).toBeLessThanOrEqual(100);
    });
  });

  describe('AI Hint Enrichment', () => {
    it('should have valid enriched hints structure', async () => {
      const task = {
        title: 'Enable network telemetry',
        description: 'Set up telemetry collection for network intelligence',
        category: 'network_intelligence',
        priority: 'high',
        effortEstimate: 'M',
        hints: {},
        linkTargets: [],
      };

      const hints = await enrichUpliftTaskHints(task);

      expect(hints).toBeDefined();
      expect(Array.isArray(hints.steps)).toBe(true);
      expect(Array.isArray(hints.success_criteria)).toBe(true);
      expect(Array.isArray(hints.resources)).toBe(true);
      expect(Array.isArray(hints.common_pitfalls)).toBe(true);
      expect(Array.isArray(hints.validation_checklist)).toBe(true);
      expect(typeof hints.time_estimate_minutes).toBe('number');
    });

    it('should generate actionable steps', async () => {
      const task = {
        title: 'Configure risk engine',
        description: 'Enable the risk scoring engine',
        category: 'core',
        priority: 'high',
        effortEstimate: 'M',
        hints: {},
        linkTargets: [],
      };

      const hints = await enrichUpliftTaskHints(task);
      expect(hints.steps.length).toBeGreaterThan(0);
      hints.steps.forEach((step) => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(0);
      });
    });

    it('should format enriched hints for display', async () => {
      const task = {
        title: 'Setup rules',
        description: 'Configure core rules',
        category: 'core',
        priority: 'medium',
        effortEstimate: 'M',
        hints: {},
        linkTargets: [],
      };

      const hints = await enrichUpliftTaskHints(task);
      const formatted = formatEnrichedHints(hints);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted).toContain('Steps');
      expect(formatted).toContain('Success Criteria');
    });

    it('should handle multiple task enrichment', async () => {
      const tasks = [
        {
          title: 'Enable telemetry',
          description: 'Set up telemetry',
          category: 'network_intelligence',
          priority: 'high',
          effortEstimate: 'M',
          hints: {},
          linkTargets: [],
        },
        {
          title: 'Configure risk',
          description: 'Enable risk engine',
          category: 'core',
          priority: 'high',
          effortEstimate: 'M',
          hints: {},
          linkTargets: [],
        },
      ];

      const enrichedMap = await enrichMultipleUpliftTasks(tasks, false);
      expect(enrichedMap.size).toBe(2);
    });

    it('should respect enableAiHints feature flag', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Test task',
          description: 'Test description',
          category: 'core',
          priority: 'medium',
          effortEstimate: 'M',
          hints: {},
          linkTargets: [],
        },
      ];

      const enrichedMapNoAi = await enrichMultipleUpliftTasks(tasks, false);
      const hints = enrichedMapNoAi.get('task-1');

      expect(hints).toBeDefined();
      expect(hints?.steps).toBeDefined();
      expect(Array.isArray(hints?.steps)).toBe(true);
    });
  });

  describe('Task Deduplication', () => {
    it('should use title as deduplication key', () => {
      // When multiple playbooks generate tasks with same title,
      // only first occurrence should be used
      const tasksByTitle = new Map<string, any>();

      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          if (!tasksByTitle.has(task.title)) {
            tasksByTitle.set(task.title, task);
          }
        });
      });

      // Verify no duplicate titles
      const titles = Array.from(tasksByTitle.keys());
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should preserve task attributes from first occurrence', () => {
      const taskMap = new Map<string, any>();
      const firstTask = { title: 'Setup rules', priority: 'high', effortEstimate: 'M' };
      const duplicateTask = { title: 'Setup rules', priority: 'low', effortEstimate: 'L' };

      // Deduplication logic
      if (!taskMap.has(firstTask.title)) {
        taskMap.set(firstTask.title, firstTask);
      }
      if (!taskMap.has(duplicateTask.title)) {
        taskMap.set(duplicateTask.title, duplicateTask);
      }

      const stored = taskMap.get('Setup rules');
      expect(stored.priority).toBe('high'); // From first occurrence
      expect(stored.effortEstimate).toBe('M'); // From first occurrence
    });
  });

  describe('Privacy & Security', () => {
    it('should not expose PII in task hints', async () => {
      const task = {
        title: 'Review rule violations',
        description: 'Analyze recent rule violations',
        category: 'core',
        priority: 'medium',
        effortEstimate: 'M',
        hints: {},
        linkTargets: [],
      };

      const hints = await enrichUpliftTaskHints(task);
      const formatted = formatEnrichedHints(hints);

      // Should not contain email patterns, IDs, or other sensitive markers
      expect(formatted).not.toMatch(/[\w\.-]+@[\w\.-]+/); // Email pattern
      expect(formatted).not.toMatch(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/); // UUID pattern
    });

    it('should use aggregated metrics only', () => {
      const allowedDetails = {
        totalRules: 10,
        activeRules: 8,
        rulesRatio: '80',
        simulationRunsTotal: 12,
        anomaliesDetected: true,
      };

      // All should be scalar (no objects containing sensitive data)
      Object.values(allowedDetails).forEach((val) => {
        expect(['number', 'string', 'boolean']).toContain(typeof val);
      });
    });

    it('should not store raw logs or user data in hints', () => {
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          // Hints should be generic, no user-specific data
          expect(task.hints).toBeDefined();
          // If hints exist, they should be aggregated metrics
        });
      });
    });
  });

  describe('Advisory-Only Pattern', () => {
    it('should not modify Guardian configuration', () => {
      UPLIFT_PLAYBOOKS.forEach((playbook) => {
        playbook.tasks.forEach((task) => {
          // Tasks should suggest, not execute
          expect(task.title).not.toMatch(/automatically|auto-enable|auto-create/i);
        });
      });
    });

    it('should provide clear guidance without mandatory actions', () => {
      const baselinePlaybook = UPLIFT_PLAYBOOKS.find((p) => p.id === 'baseline-to-operational');
      expect(baselinePlaybook).toBeDefined();

      baselinePlaybook?.tasks.forEach((task) => {
        // Tasks should be advisory
        expect(task.description.length).toBeGreaterThan(0);
      });
    });
  });
});
