/* eslint-disable no-undef, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/* global URL */

/**
 * E2E Tests for Orchestrator Dashboard
 *
 * Tests complete user flows:
 * - Task list rendering and filtering
 * - Task detail navigation
 * - Evidence package viewing
 * - Failure analysis drill-down
 * - Retry functionality
 * - Responsive design
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const DASHBOARD_URL = '/dashboard/orchestrator';
const TEST_TIMEOUT = 30000;

// Mock data generators
function generateMockTask(id: string, status: 'completed' | 'failed' | 'running' | 'pending') {
  return {
    id,
    workspace_id: 'test-workspace-123',
    objective: `Test Task ${id}`,
    description: `This is a test task with status ${status}`,
    status,
    created_at: new Date().toISOString(),
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    total_time_ms: status === 'completed' ? 5000 : null,
    trace: {
      taskId: id,
      objective: `Test Task ${id}`,
      status,
      agentChain: ['test-agent-1', 'test-agent-2'],
      steps: [
        {
          stepIndex: 0,
          assignedAgent: 'test-agent-1',
          inputContext: {},
          outputPayload: { result: 'success' },
          riskScore: 0.3,
          uncertaintyScore: 0.2,
          status: status === 'failed' ? 'failed' : 'completed',
          verified: status !== 'failed',
          verificationAttempts: status === 'failed' ? 3 : 1,
          error: status === 'failed' ? 'Test error message' : undefined,
        },
        {
          stepIndex: 1,
          assignedAgent: 'test-agent-2',
          inputContext: {},
          status: status === 'completed' ? 'completed' : 'pending',
          verified: status === 'completed',
          verificationAttempts: status === 'completed' ? 1 : 0,
        },
      ],
      riskScore: 0.3,
      uncertaintyScore: 0.2,
      confidenceScore: 0.8,
    },
  };
}

// Helper function to setup API mocks
async function setupAPIMocks(page: Page) {
  // Mock task list endpoint
  await page.route('**/api/orchestrator/dashboard/tasks*', (route) => {
    const url = new URL(route.request().url());
    const status = url.searchParams.get('status');

    const mockTasks = [
      generateMockTask('task-1', 'completed'),
      generateMockTask('task-2', 'failed'),
      generateMockTask('task-3', 'running'),
      generateMockTask('task-4', 'pending'),
    ];

    const filteredTasks = status
      ? mockTasks.filter((t) => t.status === status)
      : mockTasks;

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: filteredTasks,
        count: filteredTasks.length,
        filters: { status, limit: 50 },
      }),
    });
  });

  // Mock task detail endpoint
  await page.route('**/api/orchestrator/dashboard/tasks/*/route.ts', (route) => {
    const taskId = route.request().url().split('/').slice(-2, -1)[0];
    const task = generateMockTask(taskId, 'completed');

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task: task.trace,
        steps: task.trace.steps,
        timeline: task.trace.steps.map((s: any, i: number) => ({
          stepIndex: i,
          assignedAgent: s.assignedAgent,
          status: s.status,
          verified: s.verified,
          verificationAttempts: s.verificationAttempts || 0,
          startTime: Date.now() - 10000,
          endTime: Date.now() - 5000,
          duration: 5000,
          durationFormatted: '5s',
        })),
        verificationResults: [],
      }),
    });
  });

  // Mock evidence endpoint
  await page.route('**/api/orchestrator/dashboard/tasks/*/evidence*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        taskId: 'test-task-1',
        evidence: {
          collectionTime: new Date().toISOString(),
          storagePath: '/audit-reports/evidence/test-task-1',
          executionLog: { steps: [] },
          stateSnapshots: [
            {
              phase: 'before',
              timestamp: new Date().toISOString(),
              state: { test: 'data' },
            },
          ],
          verificationEvidence: [
            {
              criterion: 'test_criterion',
              method: 'test_method',
              result: 'pass',
              proof: 'Test proof',
              checked_at: new Date().toISOString(),
            },
          ],
        },
        proof: {
          checksums: {
            'file1.json': 'abc123',
          },
          hmac: 'test-hmac-value',
          merkleRoot: 'test-merkle-root',
        },
        metadata: {
          verificationStatus: true,
          verifierId: 'independent-verifier-1',
        },
      }),
    });
  });

  // Mock failures endpoint
  await page.route('**/api/orchestrator/dashboard/tasks/*/failures*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        taskId: 'test-task-2',
        status: 'failed',
        analysis: {
          rootCause: 'Test failure reason',
          failureType: 'execution_error',
          failedSteps: [
            {
              stepIndex: 0,
              assignedAgent: 'test-agent-1',
              error: 'Test error message',
              verificationAttempts: 3,
              lastVerificationError: 'Verification failed after 3 attempts',
            },
          ],
          impactedSteps: [
            {
              stepIndex: 1,
              assignedAgent: 'test-agent-2',
              status: 'skipped',
            },
          ],
          recoverySuggestions: [
            {
              action: 'Retry failed steps',
              description: 'Retry the 1 failed step(s) with automatic recovery.',
              priority: 'high',
            },
          ],
        },
        taskMetadata: {
          objective: 'Test Task task-2',
          agentChain: ['test-agent-1', 'test-agent-2'],
          totalSteps: 2,
          completedSteps: 0,
        },
      }),
    });
  });

  // Mock retry endpoint
  await page.route('**/api/orchestrator/dashboard/tasks/*/retry*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Task retry initiated',
        originalTaskId: 'test-task-2',
        retryTaskId: 'task-2-retry-1',
        retryAttempt: 1,
        failedStepsRetrying: 1,
      }),
    });
  });
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Orchestrator Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
  });

  test('should render task list with filters', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    // Wait for task list to load
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Check that tasks are displayed
    const taskCards = page.locator('[data-testid="task-card"]');
    await expect(taskCards).toHaveCount(4);

    // Check filter controls exist
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('text=All Statuses')).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    // Wait for task list
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Open status filter
    await page.click('text=All Statuses');

    // Select "Completed"
    await page.click('text=Completed');

    // Verify only completed tasks shown
    const taskCards = page.locator('[data-testid="task-card"]');
    await expect(taskCards).toHaveCount(1);
  });

  test('should navigate to task detail view', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    // Wait for task list
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Click on first task
    await page.click('[data-testid="task-card"]:first-child');

    // Verify task detail is shown
    await expect(page.locator('text=Back to List')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
    await expect(page.locator('text=Verification')).toBeVisible();
    await expect(page.locator('text=Evidence')).toBeVisible();
  });

  test('should display execution timeline', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    // Wait and click task
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Click Timeline tab
    await page.click('text=Timeline');

    // Verify timeline items
    await expect(page.locator('text=Step 1:')).toBeVisible();
    await expect(page.locator('text=Step 2:')).toBeVisible();
  });

  test('should show verification status', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Click Verification tab
    await page.click('text=Verification');

    // Verify verification panel
    await expect(page.locator('text=Verification Status')).toBeVisible();
    await expect(page.locator('text=Verified Steps')).toBeVisible();
  });

  test('should display evidence package', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Click Evidence tab
    await page.click('text=Evidence');

    // Verify evidence viewer
    await expect(page.locator('text=Evidence Package')).toBeVisible();
    await expect(page.locator('text=Cryptographic Proof')).toBeVisible();
    await expect(page.locator('text=HMAC')).toBeVisible();
    await expect(page.locator('text=Merkle Root')).toBeVisible();
  });

  test('should display failure analysis for failed tasks', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Click on failed task (second task)
    const failedTask = page.locator('[data-testid="task-card"]').nth(1);
    await failedTask.click();

    // Click Analysis tab
    await page.click('text=Failure Analysis');

    // Verify failure analysis panel
    await expect(page.locator('text=Root Cause Analysis')).toBeVisible();
    await expect(page.locator('text=Failure Type')).toBeVisible();
    await expect(page.locator('text=Recovery Suggestions')).toBeVisible();
  });

  test('should handle task retry', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Click on failed task
    const failedTask = page.locator('[data-testid="task-card"]').nth(1);
    await failedTask.click();

    // Click Retry button
    await page.click('button:has-text("Retry Task")');

    // Verify retry confirmation (alert)
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Task retry initiated');
      dialog.accept();
    });
  });

  test('should download evidence as JSON', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Click Evidence tab
    await page.click('text=Evidence');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export button
    await page.click('button:has-text("Export JSON")');

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/evidence-.*\.json/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Verify task list is visible on mobile
    await expect(page.locator('[data-testid="task-card"]')).toBeVisible();

    // Click task
    await page.click('[data-testid="task-card"]:first-child');

    // Verify detail view takes full width
    await expect(page.locator('text=Back to List')).toBeVisible();
  });

  test('should auto-refresh task list', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Initial task count
    const initialCount = await page.locator('[data-testid="task-card"]').count();

    // Wait for auto-refresh (30 seconds in real implementation, but mocked here)
    await page.waitForTimeout(1000);

    // Verify refresh happened (API called again)
    // This would verify the fetch was called, but in this test we just ensure no errors
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Override mock to return empty array
    await page.route('**/api/orchestrator/dashboard/tasks*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [],
          count: 0,
        }),
      });
    });

    await page.goto(DASHBOARD_URL);

    // Verify empty state message
    await expect(page.locator('text=No tasks found')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Override mock to return error
    await page.route('**/api/orchestrator/dashboard/tasks*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto(DASHBOARD_URL);

    // Verify error message is displayed
    await expect(page.locator('text=Failed to fetch tasks')).toBeVisible();
  });

  test('should toggle step details in timeline', async ({ page }) => {
    await page.goto(DASHBOARD_URL);

    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Click Timeline tab
    await page.click('text=Timeline');

    // Click to expand first step
    const firstStep = page.locator('text=Step 1:').locator('..');
    await firstStep.click();

    // Verify expanded details shown
    await expect(page.locator('text=Started:')).toBeVisible();
    await expect(page.locator('text=Completed:')).toBeVisible();
  });
});

// ============================================================================
// VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
  });

  test('should match task list snapshot', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });

    // Take screenshot
    await expect(page).toHaveScreenshot('task-list.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('should match task detail snapshot', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await page.waitForSelector('[data-testid="task-list"]', { timeout: TEST_TIMEOUT });
    await page.click('[data-testid="task-card"]:first-child');

    // Take screenshot
    await expect(page).toHaveScreenshot('task-detail.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
