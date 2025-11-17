#!/usr/bin/env node

/**
 * Quick Mindmap Test - Phase 1 Verification
 * Simpler test that focuses on key functionality
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🧪 QUICK MINDMAP TEST - PHASE 1\n');
console.log('='.repeat(50));

async function runQuickTest() {
  let passed = 0;
  let failed = 0;

  // Test 1: Check tables exist
  console.log('\n1️⃣  Checking database tables...\n');
  const tables = ['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ ${table}`);
        passed++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      failed++;
    }
  }

  // Test 2: Check schema structure (query first row to see columns)
  console.log('\n2️⃣  Checking table schemas...\n');

  try {
    const { data: mindmaps } = await supabase.from('project_mindmaps').select('*').limit(1);
    console.log(`✅ project_mindmaps schema: ${mindmaps ? Object.keys(mindmaps[0] || {}).join(', ') || 'empty table' : 'accessible'}`);
    passed++;
  } catch (err) {
    console.log(`❌ project_mindmaps schema check failed: ${err.message}`);
    failed++;
  }

  try {
    const { data: nodes } = await supabase.from('mindmap_nodes').select('*').limit(1);
    console.log(`✅ mindmap_nodes schema: ${nodes ? Object.keys(nodes[0] || {}).join(', ') || 'empty table' : 'accessible'}`);
    passed++;
  } catch (err) {
    console.log(`❌ mindmap_nodes schema check failed: ${err.message}`);
    failed++;
  }

  // Test 3: Get existing organization and workspace
  console.log('\n3️⃣  Finding test organization and workspace...\n');

  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
  const { data: workspaces } = await supabase.from('workspaces').select('id, name, org_id').limit(1);
  const { data: projects } = await supabase.from('projects').select('id, title').limit(1);

  if (orgs && orgs.length > 0) {
    console.log(`✅ Found organization: ${orgs[0].name} (${orgs[0].id})`);
    passed++;
  } else {
    console.log(`⚠️  No organizations found in database`);
  }

  if (workspaces && workspaces.length > 0) {
    console.log(`✅ Found workspace: ${workspaces[0].name} (${workspaces[0].id})`);
    passed++;
  } else {
    console.log(`⚠️  No workspaces found in database`);
  }

  if (projects && projects.length > 0) {
    console.log(`✅ Found project: ${projects[0].title} (${projects[0].id})`);
    passed++;
  } else {
    console.log(`⚠️  No projects found in database`);
  }

  // Test 4: Check API route files exist
  console.log('\n4️⃣  Checking API route files...\n');

  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  try {
    // Check if API routes exist (file system check)
    const apiPaths = [
      'd:\\Unite-Hub\\src\\app\\api\\health\\route.ts',
      'd:\\Unite-Hub\\src\\app\\api\\projects\\[projectId]\\mindmap\\route.ts',
      'd:\\Unite-Hub\\src\\app\\api\\mindmap\\[mindmapId]\\route.ts',
    ];

    for (const path of apiPaths) {
      try {
        const { stat } = await import('fs/promises');
        await stat(path);
        console.log(`✅ ${path.split('\\').slice(-3).join('/')}`);
        passed++;
      } catch {
        console.log(`❌ ${path.split('\\').slice(-3).join('/')}`);
        failed++;
      }
    }
  } catch (err) {
    console.log(`⚠️  File system check skipped: ${err.message}`);
  }

  // Test 5: Check UI components exist
  console.log('\n5️⃣  Checking UI components...\n');

  try {
    const componentPaths = [
      'd:\\Unite-Hub\\src\\components\\mindmap\\MindmapCanvas.tsx',
      'd:\\Unite-Hub\\src\\components\\mindmap\\panels\\AISuggestionPanel.tsx',
      'd:\\Unite-Hub\\src\\app\\dashboard\\projects\\[projectId]\\mindmap\\page.tsx',
    ];

    for (const path of componentPaths) {
      try {
        const { stat } = await import('fs/promises');
        await stat(path);
        console.log(`✅ ${path.split('\\').slice(-2).join('/')}`);
        passed++;
      } catch {
        console.log(`❌ ${path.split('\\').slice(-2).join('/')}`);
        failed++;
      }
    }
  } catch (err) {
    console.log(`⚠️  Component check skipped: ${err.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 TEST RESULTS\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('✅ Phase 1 is ready for manual browser testing\n');
    console.log('Next steps:');
    console.log('  1. Open http://localhost:3008/dashboard/projects');
    console.log('  2. Click "View Mindmap" on any project');
    console.log('  3. Test node creation, dragging, and connections\n');
  } else {
    console.log('⚠️  Some tests failed. Review output above.\n');
  }

  return failed === 0;
}

runQuickTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('\n❌ Test crashed:', err);
    process.exit(1);
  });
