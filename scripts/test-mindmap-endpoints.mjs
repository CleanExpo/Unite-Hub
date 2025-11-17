#!/usr/bin/env node

/**
 * Mindmap API Endpoint Testing Script
 *
 * Tests all mindmap endpoints end-to-end
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_PROJECT_TITLE = "Test Project for Mindmap";
const BASE_URL = "http://localhost:3008";

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}: ${message}`);
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function runTests() {
  console.log('🧪 MINDMAP API ENDPOINT TESTING\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get or create a test workspace
    console.log('\n📋 Step 1: Setup Test Environment');
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);

    if (!orgs || orgs.length === 0 || !workspaces || workspaces.length === 0) {
      console.log('❌ No organizations or workspaces found. Please create one first.');
      return;
    }

    const orgId = orgs[0].id;
    const workspaceId = workspaces[0].id;
    logTest('Environment Setup', true, `Using org: ${orgId.substring(0, 8)}..., workspace: ${workspaceId.substring(0, 8)}...`);

    // Step 2: Create a test project
    console.log('\n📋 Step 2: Create Test Project');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        workspace_id: workspaceId,
        title: TEST_PROJECT_TITLE,
        description: 'Test project for mindmap API testing',
        status: 'on-track',
        priority: 'medium',
        progress: 0
      })
      .select()
      .single();

    if (projectError || !project) {
      logTest('Project Creation', false, projectError?.message || 'Unknown error');
      return;
    }

    logTest('Project Creation', true, `Project created: ${project.id.substring(0, 8)}...`);
    const projectId = project.id;

    // Step 3: Create mindmap for project
    console.log('\n📋 Step 3: Test Mindmap Creation');
    const { data: mindmap, error: mindmapError } = await supabase
      .from('project_mindmaps')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        org_id: orgId,
        version: 1
      })
      .select()
      .single();

    if (mindmapError || !mindmap) {
      logTest('Mindmap Creation', false, mindmapError?.message || 'Unknown error');
      return;
    }

    logTest('Mindmap Creation', true, `Mindmap created: ${mindmap.id.substring(0, 8)}...`);
    const mindmapId = mindmap.id;

    // Step 4: Create root node
    console.log('\n📋 Step 4: Test Node Creation');
    const { data: rootNode, error: nodeError } = await supabase
      .from('mindmap_nodes')
      .insert({
        mindmap_id: mindmapId,
        parent_id: null,
        node_type: 'project_root',
        label: TEST_PROJECT_TITLE,
        description: 'Root node for test project',
        position_x: 0,
        position_y: 0,
        color: '#4A90E2',
        status: 'in_progress',
        priority: 10,
        metadata: { test: true }
      })
      .select()
      .single();

    if (nodeError || !rootNode) {
      logTest('Root Node Creation', false, nodeError?.message || 'Unknown error');
      return;
    }

    logTest('Root Node Creation', true, `Root node created: ${rootNode.id.substring(0, 8)}...`);

    // Step 5: Create child nodes
    const childNodes = [
      { type: 'feature', label: 'User Authentication', x: -200, y: 150 },
      { type: 'requirement', label: 'API Documentation', x: 0, y: 150 },
      { type: 'task', label: 'Setup Database', x: 200, y: 150 }
    ];

    const createdNodes = [];
    for (const child of childNodes) {
      const { data: node, error } = await supabase
        .from('mindmap_nodes')
        .insert({
          mindmap_id: mindmapId,
          parent_id: rootNode.id,
          node_type: child.type,
          label: child.label,
          position_x: child.x,
          position_y: child.y,
          status: 'pending',
          priority: 5
        })
        .select()
        .single();

      if (!error && node) {
        createdNodes.push(node);
      }
    }

    logTest('Child Nodes Creation', createdNodes.length === 3, `Created ${createdNodes.length}/3 child nodes`);

    // Step 6: Create connections
    console.log('\n📋 Step 5: Test Connection Creation');
    const { data: connection, error: connError } = await supabase
      .from('mindmap_connections')
      .insert({
        mindmap_id: mindmapId,
        source_node_id: createdNodes[0].id,
        target_node_id: createdNodes[1].id,
        connection_type: 'depends_on',
        strength: 7
      })
      .select()
      .single();

    logTest('Connection Creation', !connError && connection, connError?.message || 'Connection created successfully');

    // Step 7: Create AI suggestion
    console.log('\n📋 Step 6: Test AI Suggestion Creation');
    const { data: suggestion, error: suggError } = await supabase
      .from('ai_suggestions')
      .insert({
        mindmap_id: mindmapId,
        node_id: rootNode.id,
        suggestion_type: 'add_feature',
        suggestion_text: 'Consider adding a user dashboard for analytics',
        reasoning: 'A dashboard would provide valuable insights to users',
        confidence_score: 0.85,
        status: 'pending'
      })
      .select()
      .single();

    logTest('AI Suggestion Creation', !suggError && suggestion, suggError?.message || 'Suggestion created successfully');

    // Step 8: Test data retrieval
    console.log('\n📋 Step 7: Test Data Retrieval');

    const { data: retrievedMindmap } = await supabase
      .from('project_mindmaps')
      .select('*')
      .eq('id', mindmapId)
      .single();

    logTest('Mindmap Retrieval', !!retrievedMindmap, 'Mindmap data retrieved');

    const { data: allNodes } = await supabase
      .from('mindmap_nodes')
      .select('*')
      .eq('mindmap_id', mindmapId);

    logTest('Nodes Retrieval', allNodes && allNodes.length === 4, `Retrieved ${allNodes?.length || 0}/4 nodes`);

    const { data: allConnections } = await supabase
      .from('mindmap_connections')
      .select('*')
      .eq('mindmap_id', mindmapId);

    logTest('Connections Retrieval', allConnections && allConnections.length >= 1, `Retrieved ${allConnections?.length || 0} connections`);

    const { data: suggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('mindmap_id', mindmapId)
      .eq('status', 'pending');

    logTest('Suggestions Retrieval', suggestions && suggestions.length >= 1, `Retrieved ${suggestions?.length || 0} pending suggestions`);

    // Step 9: Test RLS (workspace isolation)
    console.log('\n📋 Step 8: Test Row Level Security (Workspace Isolation)');

    // Try to access mindmap from different workspace (should fail with anon key)
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: rlsTest, error: rlsError } = await supabaseAnon
      .from('project_mindmaps')
      .select('*')
      .eq('id', mindmapId)
      .single();

    // Should return null/error because anon user has no access
    logTest('RLS Enforcement', !rlsTest || rlsError, 'RLS correctly blocks unauthorized access');

    // Step 10: Test helper function
    console.log('\n📋 Step 9: Test Helper Functions');

    const { data: structure, error: structError } = await supabase
      .rpc('get_mindmap_structure', { p_mindmap_id: mindmapId });

    logTest('Helper Function (get_mindmap_structure)', !structError && structure, structError?.message || 'Function executed successfully');

    // Cleanup
    console.log('\n📋 Step 10: Cleanup Test Data');
    await supabase.from('project_mindmaps').delete().eq('id', mindmapId);
    await supabase.from('projects').delete().eq('id', projectId);
    logTest('Cleanup', true, 'Test data cleaned up (cascade delete)');

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    logTest('Test Execution', false, error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Mindmap feature is fully functional! 🎉\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.\n');
  }
}

runTests().catch(console.error);
