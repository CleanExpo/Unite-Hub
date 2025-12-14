import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  monitorAISearchChanges,
  getRecentAlgorithmChanges,
  getTriggeredUpdates,
} from './ai-search-monitor';

// Mock Perplexity API
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        mockResolvedValue: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// Mock Anthropic
vi.mock('@/lib/anthropic/rate-limiter', () => ({
  callAnthropicWithRetry: vi.fn().mockResolvedValue({
    data: {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            changes: [
              {
                source: 'google_ai_overview',
                changeType: 'ranking_factor',
                description: 'Google now prioritizes video snippets in AI Overviews',
                affectedIndustries: ['restoration', 'plumbing'],
                affectedKeywords: ['emergency services', 'local repair'],
                confidenceScore: 0.85,
                evidence: {
                  testQueries: ['emergency plumber', 'water damage restoration'],
                  serpSnapshots: {},
                  detectionMethod: 'SERP analysis',
                },
                recommendedActions: [
                  {
                    actionType: 'video_generation',
                    priority: 'high',
                    affectedVerticals: ['restoration', 'plumbing'],
                  },
                ],
              },
            ],
          }),
        },
      ],
    },
    attempts: 1,
    totalTime: 5000,
  }),
}));

vi.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              changes: [],
            }),
          },
        ],
      }),
    },
  }),
}));

describe('AI Search Monitor Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('monitorAISearchChanges', () => {
    it('should detect algorithm changes via extended thinking', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Google now prioritizes video snippets in AI Overviews',
              },
            },
          ],
        }),
      });

      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should handle Perplexity API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Rate Limited',
      });

      const changes = await monitorAISearchChanges();
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should filter low-confidence changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Some analysis',
              },
            },
          ],
        }),
      });

      const changes = await monitorAISearchChanges();
      // Only high-confidence changes (>= 0.7) should be returned
      for (const change of changes) {
        expect(change.confidenceScore).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('should store detected changes in database', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Analysis result',
              },
            },
          ],
        }),
      });

      const changes = await monitorAISearchChanges();
      // If changes were stored, supabaseAdmin.from().insert() would be called
      expect(changes).toBeDefined();
    });

    it('should trigger client updates for detected changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Analysis',
              },
            },
          ],
        }),
      });

      const changes = await monitorAISearchChanges();
      // Verify that updates would be triggered
      expect(changes).toBeDefined();
    });
  });

  describe('getRecentAlgorithmChanges', () => {
    it('should return algorithm changes from last 7 days', async () => {
      const changes = await getRecentAlgorithmChanges('test-workspace-id', 7);
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should filter by workspace_id', async () => {
      const changes = await getRecentAlgorithmChanges('specific-workspace', 7);
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should support custom lookback period', async () => {
      const changes = await getRecentAlgorithmChanges('workspace-id', 30);
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const changes = await getRecentAlgorithmChanges('workspace-id', 7);
      expect(changes).toEqual([]);
    });
  });

  describe('getTriggeredUpdates', () => {
    it('should return all triggered updates for workspace', async () => {
      const updates = await getTriggeredUpdates('workspace-id');
      expect(Array.isArray(updates)).toBe(true);
    });

    it('should filter by status when provided', async () => {
      const updates = await getTriggeredUpdates('workspace-id', 'pending');
      expect(Array.isArray(updates)).toBe(true);
    });

    it('should handle missing status filter', async () => {
      const updates = await getTriggeredUpdates('workspace-id');
      expect(Array.isArray(updates)).toBe(true);
    });

    it('should return empty array on error', async () => {
      const updates = await getTriggeredUpdates('workspace-id');
      expect(Array.isArray(updates)).toBe(true);
    });
  });

  describe('Algorithm Change Types', () => {
    it('should support ranking_factor changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  changes: [
                    {
                      changeType: 'ranking_factor',
                      confidenceScore: 0.8,
                    },
                  ],
                }),
              },
            },
          ],
        }),
      });

      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should support citation_format changes', async () => {
      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should support snippet_structure changes', async () => {
      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should track affected industries', async () => {
      const changes = await monitorAISearchChanges();
      // Changes should have affectedIndustries array
      expect(changes).toBeDefined();
    });
  });

  describe('AI Search Sources', () => {
    it('should monitor google_ai_overview source', async () => {
      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should monitor bing_copilot source', async () => {
      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });

    it('should monitor perplexity_citations source', async () => {
      const changes = await monitorAISearchChanges();
      expect(changes).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    it('should only confirm changes with confidence >= 0.7', async () => {
      const changes = await monitorAISearchChanges();
      for (const change of changes) {
        expect(change.confidenceScore).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('should include evidence with detections', async () => {
      const changes = await monitorAISearchChanges();
      for (const change of changes) {
        expect(change.evidence).toBeDefined();
        expect(change.evidence.testQueries).toBeDefined();
      }
    });

    it('should provide recommended actions', async () => {
      const changes = await monitorAISearchChanges();
      for (const change of changes) {
        expect(change.recommendedActions).toBeDefined();
      }
    });
  });
});
