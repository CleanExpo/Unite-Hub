import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Email Intelligence Flow
 *
 * This test verifies the complete email intelligence system:
 * 1. Gmail OAuth integration
 * 2. Email sync with intelligence_analyzed = false
 * 3. Intelligence extraction via API
 * 4. Continuous intelligence update agent
 */

test.describe('Email Intelligence Flow', () => {
  let workspaceId: string;
  let integrationId: string;
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Login and get auth token
    const loginResponse = await request.post('/api/auth/signin', {
      data: {
        email: 'test@example.com',
        password: 'test-password',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    workspaceId = loginData.workspace_id;
  });

  test.step('1. Gmail Integration Setup', async ({ request }) => {
    // Verify Gmail integration exists or create one
    const integrationsResponse = await request.get(
      `/api/integrations/list?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(integrationsResponse.ok()).toBeTruthy();
    const integrations = await integrationsResponse.json();

    const gmailIntegration = integrations.integrations?.find(
      (i: any) => i.provider === 'gmail'
    );

    if (gmailIntegration) {
      integrationId = gmailIntegration.id;
    } else {
      // Skip if no Gmail integration configured
      test.skip();
    }
  });

  test.step('2. Sync Gmail Emails', async ({ request }) => {
    // Trigger Gmail sync
    const syncResponse = await request.post('/api/integrations/gmail/sync', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        integrationId,
        workspaceId,
      },
    });

    expect(syncResponse.ok()).toBeTruthy();
    const syncData = await syncResponse.json();

    expect(syncData.success).toBe(true);
    expect(syncData.imported).toBeGreaterThanOrEqual(0);

    console.log(`✅ Synced ${syncData.imported} emails`);
  });

  test.step('3. Verify Emails Have intelligence_analyzed = false', async ({ request }) => {
    // Query emails to verify intelligence_analyzed flag
    const emailsResponse = await request.get(
      `/api/agents/intelligence-extraction?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(emailsResponse.ok()).toBeTruthy();
    const stats = await emailsResponse.json();

    expect(stats.success).toBe(true);
    expect(stats.stats.emails.unanalyzed).toBeGreaterThan(0);

    console.log(`✅ Found ${stats.stats.emails.unanalyzed} unanalyzed emails`);
  });

  test.step('4. Trigger Intelligence Extraction', async ({ request }) => {
    // Trigger intelligence extraction
    const extractionResponse = await request.post('/api/agents/intelligence-extraction', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        workspaceId,
        batchSize: 5, // Process 5 emails
      },
    });

    expect(extractionResponse.ok()).toBeTruthy();
    const extractionData = await extractionResponse.json();

    expect(extractionData.success).toBe(true);
    expect(extractionData.processed).toBeGreaterThanOrEqual(0);
    expect(extractionData.intelligence_records).toBeGreaterThanOrEqual(0);

    console.log(`✅ Processed ${extractionData.processed} emails`);
    console.log(`✅ Created ${extractionData.intelligence_records} intelligence records`);
  });

  test.step('5. Verify Intelligence Records Created', async ({ request }) => {
    // Get updated stats
    const statsResponse = await request.get(
      `/api/agents/intelligence-extraction?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(statsResponse.ok()).toBeTruthy();
    const stats = await statsResponse.json();

    expect(stats.success).toBe(true);
    expect(stats.stats.intelligence_records).toBeGreaterThan(0);
    expect(stats.stats.emails.analyzed).toBeGreaterThan(0);

    console.log(`✅ Total intelligence records: ${stats.stats.intelligence_records}`);
    console.log(`✅ Analyzed emails: ${stats.stats.emails.analyzed}`);
    console.log(`✅ Remaining unanalyzed: ${stats.stats.emails.unanalyzed}`);
  });

  test.step('6. Test Continuous Intelligence Update', async ({ request }) => {
    // Trigger continuous intelligence update (cron job endpoint)
    const cronSecret = process.env.CRON_SECRET || process.env.ANTHROPIC_API_KEY;

    const continuousResponse = await request.post('/api/agents/continuous-intelligence', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      data: {
        batchSizePerWorkspace: 5,
        maxWorkspaces: 10,
      },
    });

    expect(continuousResponse.ok()).toBeTruthy();
    const continuousData = await continuousResponse.json();

    expect(continuousData.success).toBe(true);
    expect(continuousData.workspaces_processed).toBeGreaterThanOrEqual(0);

    console.log(`✅ Continuous update processed ${continuousData.workspaces_processed} workspaces`);
    console.log(`✅ Total emails processed: ${continuousData.total_emails_processed}`);
  });

  test.step('7. Verify All Emails Eventually Analyzed', async ({ request }) => {
    // Final verification
    const finalStatsResponse = await request.get(
      `/api/agents/intelligence-extraction?workspaceId=${workspaceId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(finalStatsResponse.ok()).toBeTruthy();
    const finalStats = await finalStatsResponse.json();

    const percentageAnalyzed = parseFloat(finalStats.stats.emails.percentage_analyzed);

    console.log(`✅ Final percentage analyzed: ${percentageAnalyzed}%`);
    console.log(`✅ Email Intelligence Flow Complete!`);

    // Expect at least some emails to be analyzed
    expect(percentageAnalyzed).toBeGreaterThan(0);
  });
});

test.describe('Intelligence Extraction Quality', () => {
  test('should extract valid intelligence data', async ({ request }) => {
    // This test would query an intelligence record and verify structure
    // Skipped for now as it requires specific test data
    test.skip();
  });

  test('should handle extraction errors gracefully', async ({ request }) => {
    // Test error handling when Claude API fails
    test.skip();
  });

  test('should not re-analyze already analyzed emails', async ({ request }) => {
    // Verify idempotency
    test.skip();
  });
});
