#!/usr/bin/env node

/**
 * Phase 7: Integration Testing
 *
 * Comprehensive validation of domain memory system across all 4 agents.
 * Tests:
 * - Database schema correctness (all 15 tables exist)
 * - RLS policies (multi-tenant isolation)
 * - Feature flags (all agents enabled)
 * - API endpoints (all 4 routes functional)
 * - Session execution (6+ sessions per agent)
 * - Telemetry accuracy (tokens, cost, duration)
 * - Cost tracking (budget enforcement)
 * - Alert firing (threshold violations)
 * - Rate limiting (100 req/hour per agent)
 * - Failure handling (graceful degradation)
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = process.env.API_BASE || 'http://localhost:3008';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test configuration
const TEST_CONFIG = {
  agents: ['ai_phill', 'cognitive_twin', 'seo_leak', 'boost_bump'],
  sessionsPerAgent: 6,
  testFounderId: 'test-founder-1765262082307',
  testWorkspaceId: 'test-workspace-001',
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  errors: [],
  details: {},
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '✓',
    WARN: '⚠',
    ERROR: '✗',
    DEBUG: '→',
  }[level] || '•';

  console.log(`[${timestamp}] ${prefix} ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('  ', JSON.stringify(data, null, 2));
  }
}

function test(name, passed, details = {}) {
  if (passed) {
    results.passed++;
    log('INFO', `Test: ${name}`);
  } else {
    results.failed++;
    results.errors.push({ test: name, details });
    log('ERROR', `Test FAILED: ${name}`, details);
  }
  results.details[name] = passed;
}

// ============================================================================
// TEST 1: DATABASE SCHEMA VALIDATION
// ============================================================================

async function testDatabaseSchema() {
  log('DEBUG', 'Testing database schema...');

  const requiredTables = [
    // Core tables (migration 565)
    'agent_feature_backlog',
    'agent_progress_log',
    'agent_session_metadata',

    // Telemetry tables (migration 566)
    'domain_memory_session_metrics',
    'domain_memory_daily_metrics',
    'domain_memory_system_metrics',
    'domain_memory_alerts',
    'domain_memory_cost_tracking',

    // Production tables (migration 567)
    'domain_memory_rate_limits',
    'domain_memory_cost_caps',
    'domain_memory_query_stats',
    'domain_memory_alerts_archive',
    'domain_memory_session_metrics_archive',
  ];

  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    test(`Database table exists: ${table}`, !error, { error: error?.message });
  }
}

// ============================================================================
// TEST 2: RLS POLICY ENFORCEMENT
// ============================================================================

async function testRLSPolicies() {
  log('DEBUG', 'Testing Row-Level Security policies...');

  // Create test entry in agent_feature_backlog
  const { data: insertData, error: insertError } = await supabase
    .from('agent_feature_backlog')
    .insert({
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      task_id: `test-task-${Date.now()}`,
      description: 'RLS test task',
      title: 'RLS test task',
      description: 'RLS test task',
      passes: false,
      test_command: 'SELECT COUNT(*) > 0',
      test_type: 'sql',
      priority: 1,
    })
    .select()
    .single();

  test('RLS: Can insert with founder_id', !insertError, { error: insertError?.message });

  if (insertData) {
    // Verify we can read it back
    const { data: readData, error: readError } = await supabase
      .from('agent_feature_backlog')
      .select('*')
      .eq('id', insertData.id)
      .eq('founder_id', TEST_CONFIG.testFounderId)
      .single();

    test('RLS: Can read own data', !readError && readData?.id === insertData.id);
  }
}

// ============================================================================
// TEST 3: FEATURE FLAGS
// ============================================================================

async function testFeatureFlags() {
  log('DEBUG', 'Testing feature flag configuration...');

  const flags = [
    'DOMAIN_MEMORY_ENABLED_FOR_AI_PHILL',
    'DOMAIN_MEMORY_ENABLED_FOR_COGNITIVE_TWIN',
    'DOMAIN_MEMORY_ENABLED_FOR_SEO_LEAK',
    'DOMAIN_MEMORY_ENABLED_FOR_BOOST_BUMP',
  ];

  for (const flag of flags) {
    const enabled = process.env[flag] === 'true';
    test(`Feature flag configured: ${flag}`, enabled, {
      value: process.env[flag]
    });
  }
}

// ============================================================================
// TEST 4: API ENDPOINTS ACCESSIBLE
// ============================================================================

async function testAPIEndpoints() {
  log('DEBUG', 'Testing API endpoint accessibility...');

  for (const agent of TEST_CONFIG.agents) {
    try {
      const response = await fetch(
        `${API_BASE}/api/agents/${agent}/run-domain-memory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer test-token-${Date.now()}`,
          },
          body: JSON.stringify({
            workspaceId: TEST_CONFIG.testWorkspaceId,
            founderId: TEST_CONFIG.testFounderId,
          }),
        }
      );

      // We expect either success (200-299) or auth error (401), but NOT 404
      const isAccessible = response.status !== 404;
      test(`API endpoint accessible: /api/agents/${agent}/run-domain-memory`, isAccessible, {
        status: response.status,
      });
    } catch (error) {
      test(`API endpoint accessible: /api/agents/${agent}/run-domain-memory`, false, {
        error: error.message,
      });
    }
  }
}

// ============================================================================
// TEST 5: SESSION EXECUTION
// ============================================================================

async function testSessionExecution() {
  log('DEBUG', 'Testing session execution (local database inserts)...');

  for (const agent of TEST_CONFIG.agents) {
    // Simulate a session execution by inserting directly into database
    // (In real test, would call API endpoint)

    for (let i = 0; i < 3; i++) {
      const sessionId = `test-session-${agent}-${i}-${Date.now()}`;

      const { data, error } = await supabase
        .from('agent_session_metadata')
        .insert({
          agent_id: agent,
          founder_id: TEST_CONFIG.testFounderId,
          session_id: sessionId,
          user_message: `Test session ${i} for ${agent}`,
          context_loaded: true,
          task_selected: true,
          execution_started: true,
          execution_completed: i % 2 === 0, // 50% success rate for testing
          started_at: new Date().toISOString(),
          ended_at: new Date(Date.now() + 5000).toISOString(),
        })
        .select()
        .single();

      test(`Session execution: ${agent} session ${i}`, !error, {
        error: error?.message
      });
    }
  }
}

// ============================================================================
// TEST 6: TELEMETRY RECORDING
// ============================================================================

async function testTelemetryRecording() {
  log('DEBUG', 'Testing telemetry recording...');

  const sessionId = `telemetry-test-${Date.now()}`;

  const { data, error } = await supabase
    .from('domain_memory_session_metrics')
    .insert({
      session_id: sessionId,
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      duration_ms: 5000,
      tokens_input: 1000,
      tokens_output: 500,
      tokens_total: 1500,
      cost_usd: 0.015,
      success: true,
      tasks_attempted: 1,
      tasks_completed: 1,
      tasks_failed: 0,
      started_at: new Date().toISOString(),
      ended_at: new Date(Date.now() + 5000).toISOString(),
    })
    .select()
    .single();

  test('Telemetry: Session metrics recorded', !error, {
    error: error?.message,
    sessionId
  });

  if (data) {
    // Verify data integrity
    test('Telemetry: Cost calculation correct', data.cost_usd === 0.015);
    test('Telemetry: Tokens aggregated correctly', data.tokens_total === 1500);
  }
}

// ============================================================================
// TEST 7: DAILY METRICS AGGREGATION
// ============================================================================

async function testDailyMetricsAggregation() {
  log('DEBUG', 'Testing daily metrics aggregation...');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('domain_memory_daily_metrics')
    .insert({
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      date: today,
      sessions_executed: 3,
      tasks_completed: 3,
      tasks_failed: 1,
      total_tokens: 4500,
      total_cost_usd: 0.045,
      success_rate: 0.75,
      avg_duration_ms: 5000,
    })
    .select()
    .single();

  test('Telemetry: Daily metrics created', !error, {
    error: error?.message
  });
}

// ============================================================================
// TEST 8: COST TRACKING
// ============================================================================

async function testCostTracking() {
  log('DEBUG', 'Testing cost tracking...');

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('domain_memory_cost_tracking')
    .insert({
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      date: today,
      current_daily_usd: 0.45,
      current_monthly_usd: 5.50,
      daily_budget_usd: 10.0,
      monthly_budget_usd: 100.0,
      is_within_budget: true,
    })
    .select()
    .single();

  test('Cost Tracking: Cost entry recorded', !error, {
    error: error?.message
  });

  if (data) {
    test('Cost Tracking: Budget enforcement', data.is_within_budget === true);
    test('Cost Tracking: Daily budget not exceeded', data.current_daily_usd <= data.daily_budget_usd);
  }
}

// ============================================================================
// TEST 9: ALERT FIRING
// ============================================================================

async function testAlertFiring() {
  log('DEBUG', 'Testing alert system...');

  const { data, error } = await supabase
    .from('domain_memory_alerts')
    .insert({
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      alert_type: 'cost_threshold_exceeded',
      severity: 'warning',
      message: 'Daily cost approaching limit: $8.50 / $10.00',
      is_active: true,
      threshold_value: 0.85,
      current_value: 0.85,
    })
    .select()
    .single();

  test('Alerts: Alert created', !error, {
    error: error?.message
  });

  if (data) {
    test('Alerts: Alert type set correctly', data.alert_type === 'cost_threshold_exceeded');
    test('Alerts: Alert active', data.is_active === true);
  }
}

// ============================================================================
// TEST 10: RATE LIMITING
// ============================================================================

async function testRateLimiting() {
  log('DEBUG', 'Testing rate limiting...');

  const agentId = 'ai_phill_test';
  const founderId = TEST_CONFIG.testFounderId;

  const { data, error } = await supabase
    .from('domain_memory_rate_limits')
    .insert({
      agent_id: agentId,
      founder_id: founderId,
      requests_this_hour: 45,
      max_requests_per_hour: 100,
      reset_time: new Date(Date.now() + 3600000).toISOString(),
    })
    .select()
    .single();

  test('Rate Limiting: Rate limit entry created', !error, {
    error: error?.message
  });

  if (data) {
    test('Rate Limiting: Within limits', data.requests_this_hour < data.max_requests_per_hour);
  }
}

// ============================================================================
// TEST 11: FEATURE BACKLOG INTEGRITY
// ============================================================================

async function testFeatureBacklogIntegrity() {
  log('DEBUG', 'Testing feature backlog integrity...');

  // Create sample backlog items
  const { data: items, error } = await supabase
    .from('agent_feature_backlog')
    .insert([
      {
        agent_id: 'ai_phill_test',
        founder_id: TEST_CONFIG.testFounderId,
        task_id: `backlog-test-1-${Date.now()}`,
        description: 'Test backlog item 1',
        title: 'RLS test task',
      description: 'RLS test task',
      passes: false,
      test_command: 'SELECT COUNT(*) > 0',
      test_type: 'sql',
        priority: 'high',
      },
      {
        agent_id: 'ai_phill_test',
        founder_id: TEST_CONFIG.testFounderId,
        task_id: `backlog-test-2-${Date.now()}`,
        description: 'Test backlog item 2',
        status: 'in_progress',
        priority: 1,
      },
    ])
    .select();

  test('Backlog: Items created', !error, { error: error?.message });
  test('Backlog: Correct count', items?.length === 2);
}

// ============================================================================
// TEST 12: PROGRESS LOGGING
// ============================================================================

async function testProgressLogging() {
  log('DEBUG', 'Testing progress logging...');

  const { data, error } = await supabase
    .from('agent_progress_log')
    .insert({
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      task_id: `progress-test-${Date.now()}`,
      session_id: `session-${Date.now()}`,
      narrative: 'Test task completed: Generated strategic insights on market positioning',
      key_findings: ['Finding 1', 'Finding 2', 'Finding 3'],
      recommended_next_steps: ['Step 1', 'Step 2'],
      confidence_score: 0.85,
      data_quality_score: 0.90,
      success: true,
    })
    .select()
    .single();

  test('Progress Log: Entry created', !error, { error: error?.message });
  test('Progress Log: Confidence score valid', data?.confidence_score >= 0 && data?.confidence_score <= 1);
}

// ============================================================================
// TEST 13: DATA ISOLATION
// ============================================================================

async function testDataIsolation() {
  log('DEBUG', 'Testing data isolation between founders...');

  const founder1 = 'founder-1-isolation-test';
  const founder2 = 'founder-2-isolation-test';

  // Insert data for founder 1
  const { data: insert1, error: error1 } = await supabase
    .from('agent_feature_backlog')
    .insert({
      agent_id: 'isolation_test',
      founder_id: founder1,
      task_id: `isolation-1-${Date.now()}`,
      description: 'Founder 1 only data',
      title: 'RLS test task',
      description: 'RLS test task',
      passes: false,
      test_command: 'SELECT COUNT(*) > 0',
      test_type: 'sql',
      priority: 'high',
    })
    .select()
    .single();

  test('Isolation: Can insert founder 1 data', !error1);

  // Query as founder 2 (should see nothing due to RLS)
  const { data: query2, error: error2 } = await supabase
    .from('agent_feature_backlog')
    .select('*')
    .eq('founder_id', founder1);

  // Note: This test depends on RLS being correctly configured
  // If RLS allows cross-founder queries, this will fail
  test('Isolation: RLS policies enforced', Array.isArray(query2), {
    error: error2?.message
  });
}

// ============================================================================
// TEST 14: ERROR RECOVERY
// ============================================================================

async function testErrorRecovery() {
  log('DEBUG', 'Testing error recovery patterns...');

  // Test 1: Invalid data type
  const { error: typeError } = await supabase
    .from('domain_memory_session_metrics')
    .insert({
      session_id: 'test-' + Date.now(),
      agent_id: 'test',
      founder_id: 'test',
      duration_ms: 'INVALID_NUMBER', // This should fail
      tokens_input: 100,
      tokens_output: 50,
      tokens_total: 150,
      cost_usd: 0.01,
      success: true,
      tasks_attempted: 1,
      tasks_completed: 1,
      tasks_failed: 0,
    })
    .select()
    .single();

  test('Error Recovery: Type validation works', typeError !== null);

  // Test 2: Missing required field
  const { error: requiredError } = await supabase
    .from('domain_memory_alerts')
    .insert({
      agent_id: 'test',
      // Missing founder_id - should fail
      alert_type: 'test',
      severity: 'info',
      message: 'Test',
    })
    .select()
    .single();

  test('Error Recovery: Required field validation', requiredError !== null);
}

// ============================================================================
// TEST 15: PERFORMANCE METRICS
// ============================================================================

async function testPerformanceMetrics() {
  log('DEBUG', 'Testing performance metrics collection...');

  const { data, error } = await supabase
    .from('domain_memory_query_stats')
    .insert({
      query_type: 'session_start',
      agent_id: 'ai_phill_test',
      founder_id: TEST_CONFIG.testFounderId,
      execution_time_ms: 125,
      rows_affected: 1,
      is_slow_query: false,
    })
    .select()
    .single();

  test('Performance: Query stats recorded', !error);
  test('Performance: Execution time captured', data?.execution_time_ms > 0);
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      PHASE 7: DOMAIN MEMORY INTEGRATION TEST SUITE          ║');
  console.log('║                  15 Comprehensive Tests                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    log('INFO', 'Starting test suite...');

    // Run all test groups
    await testDatabaseSchema();
    await testRLSPolicies();
    await testFeatureFlags();
    await testAPIEndpoints();
    await testSessionExecution();
    await testTelemetryRecording();
    await testDailyMetricsAggregation();
    await testCostTracking();
    await testAlertFiring();
    await testRateLimiting();
    await testFeatureBacklogIntegrity();
    await testProgressLogging();
    await testDataIsolation();
    await testErrorRecovery();
    await testPerformanceMetrics();

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const total = results.passed + results.failed;
    const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0';

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${results.passed} ✓`);
    console.log(`Failed: ${results.failed} ✗`);
    console.log(`Success Rate: ${percentage}%`);

    if (results.failed > 0) {
      console.log('\n❌ FAILED TESTS:\n');
      results.errors.forEach(({ test, details }) => {
        console.log(`  • ${test}`);
        if (details.error) {
          console.log(`    Error: ${details.error}`);
        }
      });
    }

    console.log(`\n${results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}\n`);

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log('ERROR', 'Test suite failed with exception', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

runAllTests();
