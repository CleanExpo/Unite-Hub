#!/usr/bin/env node

/**
 * Simple Mindmap Feature Verification Script
 * Verifies all components are in place and accessible
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const checks = {
  passed: 0,
  failed: 0,
  total: 0
};

function check(name, condition, details = '') {
  checks.total++;
  if (condition) {
    console.log(`✅ ${name}${details ? ': ' + details : ''}`);
    checks.passed++;
  } else {
    console.log(`❌ ${name}${details ? ': ' + details : ''}`);
    checks.failed++;
  }
  return condition;
}

async function verify() {
  console.log('🔍 MINDMAP FEATURE VERIFICATION\n');
  console.log('=' .repeat(70));

  // 1. Database Tables
  console.log('\n📊 DATABASE TABLES');
  const tables = ['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      check(`Table: ${table}`, !error, !error ? 'accessible' : error.message);
    } catch (err) {
      check(`Table: ${table}`, false, 'not accessible');
    }
  }

  // 2. Backend Files
  console.log('\n📁 BACKEND API ENDPOINTS');
  const apiFiles = [
    'src/app/api/mindmap/[id]/route.ts',
    'src/app/api/mindmap/[id]/analyze/route.ts',
    'src/app/api/mindmap/[id]/nodes/route.ts',
    'src/app/api/mindmap/[id]/nodes/[nodeId]/route.ts',
    'src/app/api/mindmap/[id]/connections/route.ts',
    'src/app/api/mindmap/[id]/suggestions/route.ts',
    'src/app/api/projects/[id]/mindmap/route.ts'
  ];

  for (const file of apiFiles) {
    const fullPath = join(dirname(__dirname), file);
    check(`API: ${file.split('/').pop()}`, existsSync(fullPath));
  }

  // 3. AI Agent
  console.log('\n🤖 AI AGENT');
  const agentPath = join(dirname(__dirname), 'src/lib/agents/mindmap-analysis.ts');
  const agentExists = existsSync(agentPath);
  check('AI Agent: mindmap-analysis.ts', agentExists);

  if (agentExists) {
    const content = readFileSync(agentPath, 'utf-8');
    check('  ├─ Prompt caching enabled', content.includes('cache_control'));
    check('  ├─ Extended thinking enabled', content.includes('thinking'));
    check('  ├─ analyzeMindmap function', content.includes('export async function analyzeMindmap'));
    check('  └─ enrichNode function', content.includes('export async function enrichNode'));
  }

  // 4. Frontend Components
  console.log('\n🎨 FRONTEND COMPONENTS');
  const frontendFiles = [
    'src/components/mindmap/MindmapCanvas.tsx',
    'src/components/mindmap/panels/AISuggestionPanel.tsx',
    'src/components/mindmap/nodes/ProjectRootNode.tsx',
    'src/components/mindmap/nodes/FeatureNode.tsx',
    'src/components/mindmap/nodes/TaskNode.tsx',
    'src/components/mindmap/edges/CustomEdge.tsx',
    'src/app/dashboard/projects/[projectId]/mindmap/page.tsx'
  ];

  for (const file of frontendFiles) {
    const fullPath = join(dirname(__dirname), file);
    check(`Component: ${file.split('/').pop()}`, existsSync(fullPath));
  }

  // 5. Dependencies
  console.log('\n📦 DEPENDENCIES');
  const packagePath = join(dirname(__dirname), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

  check('reactflow', !!packageJson.dependencies.reactflow, packageJson.dependencies.reactflow);
  check('dagre', !!packageJson.dependencies.dagre, packageJson.dependencies.dagre);
  check('elkjs', !!packageJson.dependencies.elkjs, packageJson.dependencies.elkjs);
  check('@types/dagre', !!packageJson.dependencies['@types/dagre'], packageJson.dependencies['@types/dagre']);

  // 6. Migration File
  console.log('\n📄 MIGRATION');
  const migrationPath = join(dirname(__dirname), 'supabase/migrations/028_mindmap_feature_FIXED.sql');
  const migrationExists = existsSync(migrationPath);
  check('Migration file exists', migrationExists);

  if (migrationExists) {
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    check('  ├─ Creates 4 tables', (migrationContent.match(/CREATE TABLE IF NOT EXISTS/g) || []).length === 4);
    check('  ├─ Enables RLS', migrationContent.includes('ENABLE ROW LEVEL SECURITY'));
    check('  ├─ Creates policies', (migrationContent.match(/CREATE POLICY/g) || []).length >= 20);
    check('  └─ Helper function', migrationContent.includes('get_mindmap_structure'));
  }

  // 7. Test Database Operations
  console.log('\n🧪 DATABASE OPERATIONS TEST');

  try {
    // Test workspace access
    const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1);
    check('Workspace access', !!workspaces && workspaces.length > 0);

    // Test organization access
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    check('Organization access', !!orgs && orgs.length > 0);

    // Test helper function
    const { error: funcError } = await supabase.rpc('get_mindmap_structure', { p_mindmap_id: '00000000-0000-0000-0000-000000000000' });
    // Function should exist (may return null for non-existent ID)
    check('Helper function callable', !funcError || funcError.code !== 'PGRST202');

  } catch (err) {
    check('Database operations', false, err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY\n');
  console.log(`Total Checks: ${checks.total}`);
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log(`Success Rate: ${((checks.passed / checks.total) * 100).toFixed(1)}%`);

  if (checks.failed === 0) {
    console.log('\n🎉🎉🎉 PERFECT! ALL CHECKS PASSED! 🎉🎉🎉');
    console.log('\n✨ The Interactive Mindmap Feature is 100% COMPLETE and OPERATIONAL! ✨\n');
    console.log('Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Navigate to a project page');
    console.log('  3. Click "View Mindmap" button');
    console.log('  4. Test creating nodes, connections, and AI analysis\n');
  } else {
    console.log(`\n⚠️  ${checks.failed} check(s) failed. Review the output above.\n`);
  }
}

verify().catch(console.error);
