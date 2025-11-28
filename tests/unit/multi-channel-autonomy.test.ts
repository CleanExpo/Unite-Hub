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
  describe('socialProviderTypes', () => {
    it('should define all supported platforms', async () => {
      const { SocialPlatform } = await import('@/lib/socialEngagement/socialProviderTypes');
      expect(SocialPlatform).toBeDefined();
    });

    it('should define message types correctly', async () => {
      const { MessageType } = await import('@/lib/socialEngagement/socialProviderTypes');
      expect(MessageType).toBeDefined();
    });
  });

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

    it('should have generateReply method', async () => {
      const { socialReplyService } = await import('@/lib/socialEngagement');
      expect(typeof socialReplyService.generateReply).toBe('function');
    });
  });
});

describe('Ads Automation Module', () => {
  describe('adsProviderTypes', () => {
    it('should define all ad platforms', async () => {
      const { AdPlatform } = await import('@/lib/ads/adsProviderTypes');
      expect(AdPlatform).toBeDefined();
    });

    it('should define campaign status types', async () => {
      const { CampaignStatus } = await import('@/lib/ads/adsProviderTypes');
      expect(CampaignStatus).toBeDefined();
    });
  });

  describe('adsAccountService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/ads');
      expect(module.adsAccountService).toBeDefined();
    });

    it('should have getAccounts method', async () => {
      const { adsAccountService } = await import('@/lib/ads');
      expect(typeof adsAccountService.getAccounts).toBe('function');
    });
  });

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

    it('should have detectOpportunities method', async () => {
      const { adsOptimizationService } = await import('@/lib/ads');
      expect(typeof adsOptimizationService.detectOpportunities).toBe('function');
    });

    it('should have generateRecommendations method', async () => {
      const { adsOptimizationService } = await import('@/lib/ads');
      expect(typeof adsOptimizationService.generateRecommendations).toBe('function');
    });
  });
});

describe('Search Suite Module', () => {
  describe('searchProviderTypes', () => {
    it('should define search engines', async () => {
      const { SearchEngine } = await import('@/lib/searchSuite/searchProviderTypes');
      expect(SearchEngine).toBeDefined();
    });

    it('should define alert types', async () => {
      const { AlertType, AlertSeverity } = await import('@/lib/searchSuite/searchProviderTypes');
      expect(AlertType).toBeDefined();
      expect(AlertSeverity).toBeDefined();
    });
  });

  describe('gscClient', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.gscClient).toBeDefined();
    });

    it('should have getSearchAnalytics method', async () => {
      const { gscClient } = await import('@/lib/searchSuite');
      expect(typeof gscClient.getSearchAnalytics).toBe('function');
    });
  });

  describe('bingClient', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/searchSuite');
      expect(module.bingClient).toBeDefined();
    });

    it('should have getPageStats method', async () => {
      const { bingClient } = await import('@/lib/searchSuite');
      expect(typeof bingClient.getPageStats).toBe('function');
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

    it('should have saveSession method', async () => {
      const { sessionStateStore } = await import('@/lib/browserAutomation');
      expect(typeof sessionStateStore.saveSession).toBe('function');
    });

    it('should have getSession method', async () => {
      const { sessionStateStore } = await import('@/lib/browserAutomation');
      expect(typeof sessionStateStore.getSession).toBe('function');
    });
  });

  describe('domCacheService', () => {
    it('should be exported from index', async () => {
      const module = await import('@/lib/browserAutomation');
      expect(module.domCacheService).toBeDefined();
    });

    it('should have cacheDOM method', async () => {
      const { domCacheService } = await import('@/lib/browserAutomation');
      expect(typeof domCacheService.cacheDOM).toBe('function');
    });

    it('should have getDOM method', async () => {
      const { domCacheService } = await import('@/lib/browserAutomation');
      expect(typeof domCacheService.getDOM).toBe('function');
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
    const config = await import('@/config/socialEngagement');
    expect(config.socialEngagementConfig).toBeDefined();
  });

  it('should load adsAutomation config', async () => {
    const config = await import('@/config/adsAutomation');
    expect(config.adsAutomationConfig).toBeDefined();
  });

  it('should load searchSuite config', async () => {
    const config = await import('@/config/searchSuite');
    expect(config.searchSuiteConfig).toBeDefined();
  });

  it('should load browserAutomationBoost config', async () => {
    const config = await import('@/config/browserAutomationBoost');
    expect(config.browserAutomationBoostConfig).toBeDefined();
  });
});
