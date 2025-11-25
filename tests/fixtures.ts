import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Playwright Test Fixtures for Strategy System E2E Tests
 * Phase 3: Task 6 - End-to-End Testing Engine
 *
 * Provides reusable fixtures:
 * - authenticatedPage: Browser page with authenticated session
 * - strategyTestData: Test data for strategy operations
 * - apiMocks: API mock utilities
 */

/**
 * Fixture: authenticated page (auto-handles login)
 */
export const test = base.extend<{
  authenticatedPage: Page;
  workspaceId: string;
  strategyId: string | null;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Set test markers in localStorage
    await page.evaluate(() => {
      localStorage.setItem('playwright-test-mode', 'true');
    });

    // Note: For real testing, implement actual auth flow
    // For now, we navigate to dashboard which handles auth

    await use(page);
  },

  workspaceId: async ({}, use) => {
    // Use test workspace ID (should be created in global setup)
    const testWorkspaceId = 'test-workspace-' + Date.now();
    await use(testWorkspaceId);
  },

  strategyId: async ({}, use) => {
    // Initially null - set when strategy is created
    await use(null);
  },
});

/**
 * Test data fixtures for strategy operations
 */
export const strategyTestData = {
  validStrategy: {
    objective: 'Increase market share in enterprise segment',
    description: 'Focus on high-value customer acquisition and retention',
    priority: 'high' as const,
    timeline: '12 months',
  },

  l1Decomposition: {
    title: 'Enterprise Market Expansion',
    themes: [
      'Customer Acquisition',
      'Relationship Management',
      'Product Innovation',
      'Go-to-Market',
    ],
  },

  l2Breakdown: [
    {
      l1: 'Customer Acquisition',
      l2Items: [
        'Inbound Marketing',
        'Sales Development',
        'Partner Channels',
        'Event Marketing',
      ],
    },
    {
      l1: 'Relationship Management',
      l2Items: ['Account Management', 'Customer Success', 'Retention Programs'],
    },
    {
      l1: 'Product Innovation',
      l2Items: ['Core Features', 'Platform Expansion', 'Integration Ecosystem'],
    },
    {
      l1: 'Go-to-Market',
      l2Items: ['Positioning', 'Messaging', 'Pricing Strategy'],
    },
  ],

  validationScenarios: {
    allScoresHigh: {
      strategicAlignmentScore: 92,
      executionCapabilityScore: 85,
      resourceAllocationScore: 88,
      riskManagementScore: 79,
    },
    mixedScores: {
      strategicAlignmentScore: 88,
      executionCapabilityScore: 65,
      resourceAllocationScore: 75,
      riskManagementScore: 70,
    },
    lowScores: {
      strategicAlignmentScore: 55,
      executionCapabilityScore: 45,
      resourceAllocationScore: 40,
      riskManagementScore: 50,
    },
  },

  synergyMetrics: {
    good: {
      completenessScore: 0.88,
      balanceScore: 0.82,
      coherenceScore: 0.85,
      clarityScore: 0.90,
    },
    average: {
      completenessScore: 0.72,
      balanceScore: 0.65,
      coherenceScore: 0.68,
      clarityScore: 0.75,
    },
    poor: {
      completenessScore: 0.45,
      balanceScore: 0.40,
      coherenceScore: 0.38,
      clarityScore: 0.50,
    },
  },
};

/**
 * API mock utilities
 */
export const apiMocks = {
  /**
   * Mock successful strategy creation response
   */
  mockStrategyCreation: (strategyId: string) => ({
    success: true,
    strategyId,
    l1Items: 4,
    l2Items: 12,
    l3Items: 35,
    l4Items: 108,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Mock strategy status response
   */
  mockStrategyStatus: (strategyId: string) => ({
    id: strategyId,
    objective: strategyTestData.validStrategy.objective,
    status: 'active',
    hierarchyScore: 85,
    validatedAt: new Date().toISOString(),
    validation: {
      strategicAlignmentScore: 92,
      executionCapabilityScore: 85,
      resourceAllocationScore: 88,
      riskManagementScore: 79,
      consensusLevel: 'high',
    },
    decomposition: {
      level1: 4,
      level2: 12,
      level3: 35,
      level4: 108,
    },
  }),

  /**
   * Mock strategy history response
   */
  mockStrategyHistory: () => ({
    strategies: [
      {
        id: 'strategy-001',
        objective: 'Previous Market Expansion',
        completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        success: true,
        hierarchyScore: 82,
      },
      {
        id: 'strategy-002',
        objective: 'Digital Transformation Initiative',
        completedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        success: true,
        hierarchyScore: 78,
      },
    ],
    patterns: {
      averageCompletionTime: 120,
      successRate: 0.92,
      trends: ['increasing_complexity', 'faster_execution'],
    },
    analytics: {
      totalStrategiesExecuted: 12,
      currentActive: 3,
      avgHierarchyScore: 82.5,
    },
  }),

  /**
   * Mock API error response
   */
  mockError: (message: string, status: number = 400) => ({
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString(),
  }),
};

/**
 * Helper functions for common test operations
 */
export const testHelpers = {
  /**
   * Wait for strategy to be created and visible
   */
  waitForStrategyCreation: async (page: Page, timeout = 10000) => {
    await page.waitForSelector('[data-testid="strategy-hierarchy"]', {
      timeout,
    });
  },

  /**
   * Wait for validation scores to load
   */
  waitForValidationScores: async (page: Page, timeout = 10000) => {
    await page.waitForSelector('[data-testid="validation-scores"]', {
      timeout,
    });
  },

  /**
   * Wait for synergy metrics to load
   */
  waitForSynergyMetrics: async (page: Page, timeout = 10000) => {
    await page.waitForSelector('[data-testid="synergy-breakdown"]', {
      timeout,
    });
  },

  /**
   * Check for UI flicker (unexpected re-renders)
   */
  checkForFlicker: async (page: Page) => {
    const flickerMarkers = await page.evaluate(() => {
      const markers: number[] = [];

      // Observe DOM mutations to detect flicker
      return new Promise<number[]>((resolve) => {
        let mutationCount = 0;
        const observer = new MutationObserver(() => {
          mutationCount++;
          markers.push(Date.now());
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false,
        });

        // Wait 1 second for mutations
        setTimeout(() => {
          observer.disconnect();
          resolve(markers);
        }, 1000);
      });
    });

    // If more than 20 mutations in 1 second = likely flicker
    return flickerMarkers.length > 20;
  },

  /**
   * Get element text value safely
   */
  getTextContent: async (page: Page, selector: string) => {
    try {
      return await page.locator(selector).textContent();
    } catch {
      return null;
    }
  },
};

export { expect } from '@playwright/test';
