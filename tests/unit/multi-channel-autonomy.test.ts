/**
 * Multi-Channel Autonomy Suite Unit Tests
 *
 * Tests for Social Inbox, Ads, Search Suite, and Browser Automation modules.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
  supabaseBrowser: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
  },
}));

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(() => Promise.resolve({
        content: [{ type: 'text', text: '{"priority": "medium", "sentiment": "neutral"}' }],
      })),
    },
  })),
}));

describe('Social Engagement Module', () => {
  // Note: TypeScript types cannot be tested at runtime
  // Type safety is verified at compile time

  describe('socialInboxService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/socialEngagement');
      expect(module.socialInboxService).toBeDefined();
    });

    it('should have getConnectedAccounts method', async () => {
      const { socialInboxService } = await import('@/lib/socialEngagement');
      expect(typeof socialInboxService.getConnectedAccounts).toBe('function');
    });

    it('should have getMessages method', async () => {
      const { socialInboxService } = await import('@/lib/socialEngagement');
      expect(typeof socialInboxService.getMessages).toBe('function');
    });
  });

  describe('socialTriageService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/socialEngagement');
      expect(module.socialTriageService).toBeDefined();
    });

    it('should have triageMessage method', async () => {
      const { socialTriageService } = await import('@/lib/socialEngagement');
      expect(typeof socialTriageService.triageMessage).toBe('function');
    });
  });

  describe('socialReplyService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/socialEngagement');
      expect(module.socialReplyService).toBeDefined();
    });

    it('should have generateReplySuggestions method', async () => {
      const { socialReplyService } = await import('@/lib/socialEngagement');
      expect(typeof socialReplyService.generateReplySuggestions).toBe('function');
    });
  });
});

describe('Ads Automation Module', () => {
  // Note: TypeScript types cannot be tested at runtime
  // Type safety is verified at compile time

  describe('adsIngestionService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/ads');
      expect(module.adsIngestionService).toBeDefined();
    });

    it('should have getCampaigns method', async () => {
      const { adsIngestionService } = await import('@/lib/ads');
      expect(typeof adsIngestionService.getCampaigns).toBe('function');
    });
  });

  describe('adsOptimizationService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/ads');
      expect(module.adsOptimizationService).toBeDefined();
    });

    it('should have analyzeCampaigns method', async () => {
      const { adsOptimizationService } = await import('@/lib/ads');
      expect(typeof adsOptimizationService.analyzeCampaigns).toBe('function');
    });

    it('should have getAIRecommendation method', async () => {
      const { adsOptimizationService } = await import('@/lib/ads');
      expect(typeof adsOptimizationService.getAIRecommendation).toBe('function');
    });
  });
});

describe('Search Suite Module', () => {
  // Note: TypeScript types cannot be tested at runtime
  // Type safety is verified at compile time

  describe('GscClient', () => {
    it('should export factory function', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.createGscClient).toBeDefined();
      expect(typeof module.createGscClient).toBe('function');
    });

    it('should export class', async () => {
      const { GscClient } = await import('@/lib/searchSuite');
      expect(GscClient).toBeDefined();
    });
  });

  describe('BingClient', () => {
    it('should export factory function', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.createBingClient).toBeDefined();
      expect(typeof module.createBingClient).toBe('function');
    });

    it('should export class', async () => {
      const { BingClient } = await import('@/lib/searchSuite');
      expect(BingClient).toBeDefined();
    });
  });

  describe('keywordTrackingService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.keywordTrackingService).toBeDefined();
    });

    it('should have getKeywords method', async () => {
      const { keywordTrackingService } = await import('@/lib/searchSuite');
      expect(typeof keywordTrackingService.getKeywords).toBe('function');
    });

    it('should have getTopMovers method', async () => {
      const { keywordTrackingService } = await import('@/lib/searchSuite');
      expect(typeof keywordTrackingService.getTopMovers).toBe('function');
    });
  });

  describe('volatilityService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.volatilityService).toBeDefined();
    });

    it('should have checkVolatility method', async () => {
      const { volatilityService } = await import('@/lib/searchSuite');
      expect(typeof volatilityService.checkVolatility).toBe('function');
    });

    it('should have getVolatilitySummary method', async () => {
      const { volatilityService } = await import('@/lib/searchSuite');
      expect(typeof volatilityService.getVolatilitySummary).toBe('function');
    });
  });
});

describe('Browser Automation Module', () => {
  describe('browserTypes', () => {
    it('should define session state types', async () => {
      const types = await import('@/lib/browserAutomation/browserTypes');
      expect(types).toBeDefined();
    });
  });

  describe('sessionStateStore', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/browserAutomation');
      expect(module.sessionStateStore).toBeDefined();
    });

    it('should have createSession method', async () => {
      const { sessionStateStore } = await import('@/lib/browserAutomation');
      expect(typeof sessionStateStore.createSession).toBe('function');
    });

    it('should have getSession method', async () => {
      const { sessionStateStore } = await import('@/lib/browserAutomation');
      expect(typeof sessionStateStore.getSession).toBe('function');
    });

    it('should have updateState method', async () => {
      const { sessionStateStore } = await import('@/lib/browserAutomation');
      expect(typeof sessionStateStore.updateState).toBe('function');
    });
  });

  describe('domCacheService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/browserAutomation');
      expect(module.domCacheService).toBeDefined();
    });

    it('should have storeDomMap method', async () => {
      const { domCacheService } = await import('@/lib/browserAutomation');
      expect(typeof domCacheService.storeDomMap).toBe('function');
    });

    it('should have getDomMap method', async () => {
      const { domCacheService } = await import('@/lib/browserAutomation');
      expect(typeof domCacheService.getDomMap).toBe('function');
    });

    it('should have findElements method', async () => {
      const { domCacheService } = await import('@/lib/browserAutomation');
      expect(typeof domCacheService.findElements).toBe('function');
    });
  });

  describe('replayService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/browserAutomation');
      expect(module.replayService).toBeDefined();
    });

    it('should have createTask method', async () => {
      const { replayService } = await import('@/lib/browserAutomation');
      expect(typeof replayService.createTask).toBe('function');
    });

    it('should have runTask method', async () => {
      const { replayService } = await import('@/lib/browserAutomation');
      expect(typeof replayService.runTask).toBe('function');
    });
  });

  describe('patternLearnerService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/browserAutomation');
      expect(module.patternLearnerService).toBeDefined();
    });

    it('should have learnFromActions method', async () => {
      const { patternLearnerService } = await import('@/lib/browserAutomation');
      expect(typeof patternLearnerService.learnFromActions).toBe('function');
    });

    it('should have findMatchingPatterns method', async () => {
      const { patternLearnerService } = await import('@/lib/browserAutomation');
      expect(typeof patternLearnerService.findMatchingPatterns).toBe('function');
    });
  });
});

describe('Orchestrator Integration', () => {
  describe('classifyIntent', () => {
    it('should classify social inbox intent', async () => {
      const { classifyIntent } = await import('@/lib/agents/orchestrator-router');
      const result = classifyIntent('manage my social inbox and respond to DMs');
      expect(result.intent).toBe('manage_social_inbox');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify ads optimization intent', async () => {
      const { classifyIntent } = await import('@/lib/agents/orchestrator-router');
      const result = classifyIntent('optimize my google ads campaigns for better ROAS');
      expect(result.intent).toBe('optimize_ads');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify search audit intent', async () => {
      const { classifyIntent } = await import('@/lib/agents/orchestrator-router');
      const result = classifyIntent('check my search console data and keyword rankings');
      expect(result.intent).toBe('run_search_audit');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify browser replay intent', async () => {
      const { classifyIntent } = await import('@/lib/agents/orchestrator-router');
      const result = classifyIntent('replay the browser automation task');
      expect(result.intent).toBe('replay_browser_task');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify pattern learning intent', async () => {
      const { classifyIntent } = await import('@/lib/agents/orchestrator-router');
      const result = classifyIntent('learn the browser pattern from my session');
      expect(result.intent).toBe('learn_browser_pattern');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('generatePlan', () => {
    it('should generate plan for social inbox management', async () => {
      const { generatePlan } = await import('@/lib/agents/orchestrator-router');
      const plan = await generatePlan({
        workspaceId: 'test-workspace',
        userPrompt: 'manage my social inbox',
      });
      expect(plan.intent).toBe('manage_social_inbox');
      expect(plan.steps.length).toBeGreaterThan(0);
    });

    it('should generate plan for ads optimization', async () => {
      const { generatePlan } = await import('@/lib/agents/orchestrator-router');
      const plan = await generatePlan({
        workspaceId: 'test-workspace',
        userPrompt: 'optimize my google ads',
      });
      expect(plan.intent).toBe('optimize_ads');
      expect(plan.steps.length).toBeGreaterThan(0);
    });
  });
});

describe('Config Files', () => {
  it('should load socialEngagement config', async () => {
    const config = await import('@config/socialEngagement.config');
    expect(config.socialEngagementConfig).toBeDefined();
  });

  it('should load adsAutomation config', async () => {
    const config = await import('@config/adsAutomation.config');
    expect(config.adsAutomationConfig).toBeDefined();
  });

  it('should load searchSuite config', async () => {
    const config = await import('@config/searchSuite.config');
    expect(config.searchSuiteConfig).toBeDefined();
  });

  it('should load browserAutomationBoost config', async () => {
    const config = await import('@config/browserAutomationBoost.config');
    expect(config.browserAutomationBoostConfig).toBeDefined();
  });
});
