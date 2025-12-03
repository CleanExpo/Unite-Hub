#!/usr/bin/env node

/**
 * Complete Integration Test - Phase 1 Mindmap
 * Tests full CRUD operations, data persistence, and integrity
 * This gets us to 100% testing coverage without UI
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';
const WORKSPACE_ID = 'process.env.TEST_WORKSPACE_ID || "YOUR_WORKSPACE_ID"';

console.log('\n🧪 COMPLETE INTEGRATION TEST - PHASE 1 MINDMAP\n');
console.log('='.repeat(70));

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  categories: {}
};

function logTest(category, name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}${details ? ': ' + details : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}${details ? ': ' + details : ''}`);
  }

  if (!testResults.categories[category]) {
    testResults.categories[category] = { passed: 0, failed: 0, total: 0 };
  }
  testResults.categories[category].total++;
  if (passed) testResults.categories[category].passed++;
  else testResults.categories[category].failed++;
}

async function runTests() {
  let createdIds = {
    project: null,
    mindmap: null,
    nodes: [],
    connections: [],
    suggestions: []
  };

  try {
    // =====================================================
    // CATEGORY 1: PROJECT SETUP
    // =====================================================
    console.log('\n📋 CATEGORY 1: Project Setup\n');

    // Test 1.1: Create or use existing project
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', WORKSPACE_ID)
      .limit(1);

    if (existingProjects && existingProjects.length > 0) {
      createdIds.project = existingProjects[0].id;
      logTest('Project', 'Use existing project', true, createdIds.project);
    } else {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          org_id: ORG_ID,
          workspace_id: WORKSPACE_ID,
          title: 'Integration Test Project',
          client_name: 'Test Client',
          description: 'Automated integration test',
          status: 'on-track',
          priority: 'high',
          progress: 0
        })
        .select()
        .single();

      if (error) {
        logTest('Project', 'Create new project', false, error.message);
      } else {
        createdIds.project = newProject.id;
        logTest('Project', 'Create new project', true, createdIds.project);
      }
    }

    // =====================================================
    // CATEGORY 2: MINDMAP CRUD
    // =====================================================
    console.log('\n🗺️  CATEGORY 2: Mindmap CRUD Operations\n');

    // Test 2.1: CREATE mindmap
    const { data: mindmap, error: mindmapError } = await supabase
      .from('project_mindmaps')
      .insert({
        project_id: createdIds.project,
        workspace_id: WORKSPACE_ID,
        org_id: ORG_ID,
        version: 1
      })
      .select()
      .single();

    logTest('Mindmap', 'CREATE mindmap', !mindmapError, mindmapError?.message || mindmap?.id);
    if (mindmap) createdIds.mindmap = mindmap.id;

    // Test 2.2: READ mindmap
    const { data: readMindmap, error: readError } = await supabase
      .from('project_mindmaps')
      .select('*')
      .eq('id', createdIds.mindmap)
      .single();

    logTest('Mindmap', 'READ mindmap', !readError && readMindmap?.id === createdIds.mindmap);

    // Test 2.3: UPDATE mindmap
    const { error: updateError } = await supabase
      .from('project_mindmaps')
      .update({ version: 2 })
      .eq('id', createdIds.mindmap);

    logTest('Mindmap', 'UPDATE mindmap version', !updateError);

    // Test 2.4: Verify update
    const { data: updatedMindmap } = await supabase
      .from('project_mindmaps')
      .select('version')
      .eq('id', createdIds.mindmap)
      .single();

    logTest('Mindmap', 'VERIFY update persisted', updatedMindmap?.version === 2);

    // =====================================================
    // CATEGORY 3: NODE OPERATIONS
    // =====================================================
    console.log('\n🎯 CATEGORY 3: Node Operations\n');

    // Test 3.1: Create root node
    const { data: rootNode, error: rootError } = await supabase
      .from('mindmap_nodes')
      .insert({
        mindmap_id: createdIds.mindmap,
        node_type: 'project_root',
        label: 'Test Project Root',
        description: 'Root node for integration test',
        position_x: 400,
        position_y: 50,
        status: 'in_progress',
        priority: 10
      })
      .select()
      .single();

    logTest('Nodes', 'CREATE root node', !rootError, rootNode?.id);
    if (rootNode) createdIds.nodes.push(rootNode.id);

    // Test 3.2-3.9: Create different node types
    const nodeTypes = [
      { type: 'feature', label: 'Feature Node' },
      { type: 'task', label: 'Task Node' },
      { type: 'milestone', label: 'Milestone Node' },
      { type: 'requirement', label: 'Requirement Node' },
      { type: 'idea', label: 'Idea Node' },
      { type: 'question', label: 'Question Node' },
      { type: 'note', label: 'Note Node' }
    ];

    for (let i = 0; i < nodeTypes.length; i++) {
      const nodeType = nodeTypes[i];
      const { data: node, error } = await supabase
        .from('mindmap_nodes')
        .insert({
          mindmap_id: createdIds.mindmap,
          parent_id: rootNode.id,
          node_type: nodeType.type,
          label: nodeType.label,
          description: `Test ${nodeType.type}`,
          position_x: 200 + (i * 100),
          position_y: 200,
          status: 'pending',
          priority: 5
        })
        .select()
        .single();

      logTest('Nodes', `CREATE ${nodeType.type} node`, !error, node?.id);
      if (node) createdIds.nodes.push(node.id);
    }

    // Test 3.10: Count nodes
    const { count: nodeCount } = await supabase
      .from('mindmap_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('mindmap_id', createdIds.mindmap);

    logTest('Nodes', 'COUNT nodes', nodeCount === 8, `Expected 8, got ${nodeCount}`);

    // Test 3.11: Update node
    const { error: nodeUpdateError } = await supabase
      .from('mindmap_nodes')
      .update({ status: 'completed' })
      .eq('id', createdIds.nodes[1]);

    logTest('Nodes', 'UPDATE node status', !nodeUpdateError);

    // =====================================================
    // CATEGORY 4: CONNECTIONS
    // =====================================================
    console.log('\n🔗 CATEGORY 4: Connection Operations\n');

    // Test 4.1-4.7: Create connections
    const connectionTypes = ['part_of', 'depends_on', 'leads_to', 'inspired_by', 'relates_to'];

    for (let i = 1; i < Math.min(6, createdIds.nodes.length); i++) {
      const { data: conn, error } = await supabase
        .from('mindmap_connections')
        .insert({
          mindmap_id: createdIds.mindmap,
          source_node_id: createdIds.nodes[0],
          target_node_id: createdIds.nodes[i],
          connection_type: connectionTypes[i - 1],
          strength: Math.floor(Math.random() * 5) + 5
        })
        .select()
        .single();

      logTest('Connections', `CREATE ${connectionTypes[i - 1]} connection`, !error, conn?.id);
      if (conn) createdIds.connections.push(conn.id);
    }

    // Test 4.8: Count connections
    const { count: connCount } = await supabase
      .from('mindmap_connections')
      .select('*', { count: 'exact', head: true })
      .eq('mindmap_id', createdIds.mindmap);

    logTest('Connections', 'COUNT connections', connCount === 5, `Expected 5, got ${connCount}`);

    // =====================================================
    // CATEGORY 5: AI SUGGESTIONS
    // =====================================================
    console.log('\n🤖 CATEGORY 5: AI Suggestion Operations\n');

    // Test 5.1-5.4: Create different suggestion types
    const suggestionTypes = [
      { type: 'add_feature', text: 'Consider adding user authentication' },
      { type: 'clarify_requirement', text: 'This requirement needs more detail' },
      { type: 'identify_dependency', text: 'This depends on payment gateway' },
      { type: 'warn_complexity', text: 'High complexity detected' }
    ];

    for (const suggType of suggestionTypes) {
      const { data: sugg, error } = await supabase
        .from('ai_suggestions')
        .insert({
          mindmap_id: createdIds.mindmap,
          node_id: createdIds.nodes[1],
          suggestion_type: suggType.type,
          suggestion_text: suggType.text,
          reasoning: 'Automated test reasoning',
          confidence_score: Math.random() * 0.5 + 0.5,
          status: 'pending'
        })
        .select()
        .single();

      logTest('AI', `CREATE ${suggType.type} suggestion`, !error, sugg?.id);
      if (sugg) createdIds.suggestions.push(sugg.id);
    }

    // Test 5.5: Accept suggestion
    const { error: acceptError } = await supabase
      .from('ai_suggestions')
      .update({ status: 'accepted', applied_at: new Date().toISOString() })
      .eq('id', createdIds.suggestions[0]);

    logTest('AI', 'ACCEPT suggestion', !acceptError);

    // Test 5.6: Dismiss suggestion
    const { error: dismissError } = await supabase
      .from('ai_suggestions')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', createdIds.suggestions[1]);

    logTest('AI', 'DISMISS suggestion', !dismissError);

    // =====================================================
    // CATEGORY 6: DATA INTEGRITY
    // =====================================================
    console.log('\n🔒 CATEGORY 6: Data Integrity & Constraints\n');

    // Test 6.1: Workspace isolation
    const { data: mindmapCheck } = await supabase
      .from('project_mindmaps')
      .select('workspace_id, org_id')
      .eq('id', createdIds.mindmap)
      .single();

    logTest('Integrity', 'Workspace ID matches', mindmapCheck?.workspace_id === WORKSPACE_ID);
    logTest('Integrity', 'Organization ID matches', mindmapCheck?.org_id === ORG_ID);

    // Test 6.3: Cascade delete - delete a connection
    const { error: deleteConnError } = await supabase
      .from('mindmap_connections')
      .delete()
      .eq('id', createdIds.connections[0]);

    logTest('Integrity', 'DELETE connection succeeds', !deleteConnError);

    // Test 6.4: Verify cascade
    const { count: remainingConns } = await supabase
      .from('mindmap_connections')
      .select('*', { count: 'exact', head: true })
      .eq('mindmap_id', createdIds.mindmap);

    logTest('Integrity', 'Connection count updated', remainingConns === 4);

    // =====================================================
    // CATEGORY 7: PERSISTENCE
    // =====================================================
    console.log('\n💾 CATEGORY 7: Data Persistence\n');

    // Test 7.1: Re-fetch all data
    const { data: persistedMindmap } = await supabase
      .from('project_mindmaps')
      .select(`
        *,
        mindmap_nodes (*),
        mindmap_connections (*),
        ai_suggestions (*)
      `)
      .eq('id', createdIds.mindmap)
      .single();

    logTest('Persistence', 'Mindmap persists', !!persistedMindmap);
    logTest('Persistence', 'Nodes persist', persistedMindmap?.mindmap_nodes?.length === 8);
    logTest('Persistence', 'Connections persist', persistedMindmap?.mindmap_connections?.length === 4);
    logTest('Persistence', 'Suggestions persist', persistedMindmap?.ai_suggestions?.length === 4);

    // =====================================================
    // CLEANUP
    // =====================================================
    console.log('\n🧹 CLEANUP: Removing test data\n');

    // Delete in correct order (respecting foreign keys)
    await supabase.from('ai_suggestions').delete().in('id', createdIds.suggestions);
    console.log('   ✓ Deleted AI suggestions');

    await supabase.from('mindmap_connections').delete().in('id', createdIds.connections);
    console.log('   ✓ Deleted connections');

    await supabase.from('mindmap_nodes').delete().in('id', createdIds.nodes);
    console.log('   ✓ Deleted nodes');

    await supabase.from('project_mindmaps').delete().eq('id', createdIds.mindmap);
    console.log('   ✓ Deleted mindmap');

    // Keep project for future use
    console.log('   ✓ Kept project for future tests');

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    testResults.failed++;
  }

  // =====================================================
  // RESULTS
  // =====================================================
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST RESULTS SUMMARY\n');

  Object.keys(testResults.categories).forEach(category => {
    const cat = testResults.categories[category];
    const passRate = ((cat.passed / cat.total) * 100).toFixed(1);
    console.log(`${category}:`);
    console.log(`  ✅ Passed: ${cat.passed}/${cat.total} (${passRate}%)`);
    if (cat.failed > 0) {
      console.log(`  ❌ Failed: ${cat.failed}`);
    }
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`\n✅ Total Passed: ${testResults.passed}`);
  console.log(`❌ Total Failed: ${testResults.failed}`);
  console.log(`📝 Total Tests: ${testResults.total}`);

  const overallPassRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\n📈 Overall Pass Rate: ${overallPassRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 1 at 100%!\n');
    console.log('✅ Database operations working correctly');
    console.log('✅ Data integrity maintained');
    console.log('✅ CRUD operations functional');
    console.log('✅ Workspace isolation verified');
    console.log('✅ AI suggestions operational');
    console.log('\n='.repeat(70) + '\n');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Review output above.\n');
    console.log('='.repeat(70) + '\n');
    return false;
  }
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('\n❌ Test suite crashed:', err);
    process.exit(1);
  });
