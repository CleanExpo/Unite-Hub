#!/usr/bin/env node

/**
 * =====================================================
 * MINDMAP API ENDPOINT TESTING SCRIPT
 * =====================================================
 * Tests all 7 mindmap API endpoints with full CRUD operations
 *
 * Endpoints tested:
 * 1. POST /api/projects/[projectId]/mindmap - Create mindmap
 * 2. GET /api/mindmap/[mindmapId] - Get mindmap
 * 3. POST /api/mindmap/[mindmapId]/nodes - Add nodes
 * 4. PUT /api/mindmap/nodes/[nodeId] - Update node
 * 5. POST /api/mindmap/[mindmapId]/connections - Create connections
 * 6. POST /api/mindmap/[mindmapId]/ai-analyze - AI analysis
 * 7. PUT /api/mindmap/suggestions/[suggestionId] - Update suggestion
 * =====================================================
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008';
const WORKSPACE_ID = process.env.WORKSPACE_ID || 'test-workspace-id';
const PROJECT_ID = 'test-project-001'; // You can change this

// Test tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper to log test results
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper to make API requests
async function apiRequest(method, path, body = null) {
  try {
    const url = `${API_BASE}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

// Test storage for IDs
const testData = {
  mindmapId: null,
  projectRootNodeId: null,
  featureNodeId: null,
  taskNodeId: null,
  connectionId: null,
  suggestionId: null,
};

// =====================================================
// TEST 1: Create Mindmap
// =====================================================
async function test1_CreateMindmap() {
  console.log('\n📝 TEST 1: Create Mindmap');

  const response = await apiRequest(
    'POST',
    `/api/projects/${PROJECT_ID}/mindmap?workspaceId=${WORKSPACE_ID}`,
    {
      workspace_id: WORKSPACE_ID,
    }
  );

  if (response.ok && response.data.mindmap_id) {
    testData.mindmapId = response.data.mindmap_id;
    logTest('Create mindmap', true, `Mindmap ID: ${testData.mindmapId}`);
    return true;
  } else {
    logTest('Create mindmap', false, response.error || `Status: ${response.status}`);
    return false;
  }
}

// =====================================================
// TEST 2: Get Mindmap
// =====================================================
async function test2_GetMindmap() {
  console.log('\n📖 TEST 2: Get Mindmap');

  if (!testData.mindmapId) {
    logTest('Get mindmap', false, 'Mindmap ID not available from previous test');
    return false;
  }

  const response = await apiRequest(
    'GET',
    `/api/mindmap/${testData.mindmapId}?workspaceId=${WORKSPACE_ID}`
  );

  if (response.ok && response.data.mindmap) {
    logTest('Get mindmap', true, `Fetched mindmap with ${response.data.nodes?.length || 0} nodes`);
    return true;
  } else {
    logTest('Get mindmap', false, response.error || `Status: ${response.status}`);
    return false;
  }
}

// =====================================================
// TEST 3: Add Nodes (8 different types)
// =====================================================
async function test3_AddNodes() {
  console.log('\n➕ TEST 3: Add Nodes (8 types)');

  if (!testData.mindmapId) {
    logTest('Add nodes', false, 'Mindmap ID not available');
    return false;
  }

  const nodeTypes = [
    { type: 'project_root', label: 'Test Project', description: 'Root node for testing' },
    { type: 'feature', label: 'User Authentication', description: 'OAuth login feature', priority: 8 },
    { type: 'task', label: 'Setup database schema', description: 'Create users table', status: 'pending' },
    { type: 'milestone', label: 'MVP Launch', description: 'First production release', priority: 10 },
    { type: 'requirement', label: 'Must support 10k users', description: 'Scalability requirement' },
    { type: 'idea', label: 'AI-powered search', description: 'Explore Claude integration' },
    { type: 'question', label: 'Which payment gateway?', description: 'Stripe vs PayPal' },
    { type: 'note', label: 'Design inspiration', description: 'Check Linear.app UI patterns' },
  ];

  let allPassed = true;

  for (const nodeType of nodeTypes) {
    const response = await apiRequest(
      'POST',
      `/api/mindmap/${testData.mindmapId}/nodes?workspaceId=${WORKSPACE_ID}`,
      {
        node_type: nodeType.type,
        label: nodeType.label,
        description: nodeType.description,
        position_x: Math.random() * 500,
        position_y: Math.random() * 500,
        priority: nodeType.priority || 5,
        status: nodeType.status || 'pending',
      }
    );

    if (response.ok && response.data.id) {
      // Store specific node IDs for later tests
      if (nodeType.type === 'project_root') testData.projectRootNodeId = response.data.id;
      if (nodeType.type === 'feature') testData.featureNodeId = response.data.id;
      if (nodeType.type === 'task') testData.taskNodeId = response.data.id;

      logTest(`Add ${nodeType.type} node`, true, `Node ID: ${response.data.id}`);
    } else {
      logTest(`Add ${nodeType.type} node`, false, response.error || `Status: ${response.status}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// =====================================================
// TEST 4: Update Node
// =====================================================
async function test4_UpdateNode() {
  console.log('\n✏️ TEST 4: Update Node');

  if (!testData.taskNodeId) {
    logTest('Update node', false, 'Task node ID not available');
    return false;
  }

  const response = await apiRequest(
    'PUT',
    `/api/mindmap/nodes/${testData.taskNodeId}?workspaceId=${WORKSPACE_ID}`,
    {
      status: 'in_progress',
      position_x: 100,
      position_y: 200,
    }
  );

  if (response.ok) {
    logTest('Update node', true, 'Updated status to in_progress');
    return true;
  } else {
    logTest('Update node', false, response.error || `Status: ${response.status}`);
    return false;
  }
}

// =====================================================
// TEST 5: Create Connections (6 types)
// =====================================================
async function test5_CreateConnections() {
  console.log('\n🔗 TEST 5: Create Connections (6 types)');

  if (!testData.projectRootNodeId || !testData.featureNodeId || !testData.taskNodeId) {
    logTest('Create connections', false, 'Not enough nodes available');
    return false;
  }

  const connectionTypes = [
    { type: 'relates_to', source: testData.projectRootNodeId, target: testData.featureNodeId },
    { type: 'depends_on', source: testData.taskNodeId, target: testData.featureNodeId },
    { type: 'leads_to', source: testData.featureNodeId, target: testData.taskNodeId },
    { type: 'part_of', source: testData.taskNodeId, target: testData.projectRootNodeId },
    { type: 'inspired_by', source: testData.featureNodeId, target: testData.projectRootNodeId },
    { type: 'conflicts_with', source: testData.taskNodeId, target: testData.featureNodeId },
  ];

  let allPassed = true;

  for (const conn of connectionTypes) {
    const response = await apiRequest(
      'POST',
      `/api/mindmap/${testData.mindmapId}/connections?workspaceId=${WORKSPACE_ID}`,
      {
        source_node_id: conn.source,
        target_node_id: conn.target,
        connection_type: conn.type,
        strength: 5,
      }
    );

    if (response.ok && response.data.id) {
      if (!testData.connectionId) testData.connectionId = response.data.id;
      logTest(`Create ${conn.type} connection`, true, `Connection ID: ${response.data.id}`);
    } else {
      logTest(`Create ${conn.type} connection`, false, response.error || `Status: ${response.status}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// =====================================================
// TEST 6: AI Analysis
// =====================================================
async function test6_AIAnalysis() {
  console.log('\n🤖 TEST 6: AI Analysis');

  if (!testData.mindmapId) {
    logTest('AI analysis', false, 'Mindmap ID not available');
    return false;
  }

  const response = await apiRequest(
    'POST',
    `/api/mindmap/${testData.mindmapId}/ai-analyze?workspaceId=${WORKSPACE_ID}`,
    {
      context: 'Full project analysis for testing',
    }
  );

  if (response.ok && response.data.suggestions) {
    const suggestions = response.data.suggestions;
    if (suggestions.length > 0) {
      testData.suggestionId = suggestions[0].id;
    }
    logTest('AI analysis', true, `Generated ${suggestions.length} suggestions`);
    return true;
  } else {
    logTest('AI analysis', false, response.error || `Status: ${response.status}`);
    return false;
  }
}

// =====================================================
// TEST 7: Update Suggestion
// =====================================================
async function test7_UpdateSuggestion() {
  console.log('\n✅ TEST 7: Update Suggestion');

  if (!testData.suggestionId) {
    logTest('Update suggestion', false, 'No suggestion ID available (AI analysis may not have generated suggestions)');
    return false;
  }

  // Test accepting a suggestion
  const acceptResponse = await apiRequest(
    'PUT',
    `/api/mindmap/suggestions/${testData.suggestionId}?workspaceId=${WORKSPACE_ID}`,
    { status: 'accepted' }
  );

  if (acceptResponse.ok) {
    logTest('Accept suggestion', true, 'Suggestion accepted');

    // Test dismissing a suggestion
    const dismissResponse = await apiRequest(
      'PUT',
      `/api/mindmap/suggestions/${testData.suggestionId}?workspaceId=${WORKSPACE_ID}`,
      { status: 'dismissed' }
    );

    if (dismissResponse.ok) {
      logTest('Dismiss suggestion', true, 'Suggestion dismissed');
      return true;
    } else {
      logTest('Dismiss suggestion', false, dismissResponse.error || `Status: ${dismissResponse.status}`);
      return false;
    }
  } else {
    logTest('Accept suggestion', false, acceptResponse.error || `Status: ${acceptResponse.status}`);
    return false;
  }
}

// =====================================================
// RUN ALL TESTS
// =====================================================
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 MINDMAP API ENDPOINT TESTING');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`Workspace ID: ${WORKSPACE_ID}`);
  console.log(`Project ID: ${PROJECT_ID}`);

  // Run tests sequentially (each depends on previous)
  await test1_CreateMindmap();
  await test2_GetMindmap();
  await test3_AddNodes();
  await test4_UpdateNode();
  await test5_CreateConnections();
  await test6_AIAnalysis();
  await test7_UpdateSuggestion();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  // Print failures if any
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.details}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with error code if any tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Fatal error running tests:', error);
  process.exit(1);
});
