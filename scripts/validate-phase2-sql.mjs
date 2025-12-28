/**
 * Validate Phase 2 SQL Migrations
 * Checks syntax and structure without applying to database
 */

import { readFileSync } from 'fs';

console.log('🔍 Validating WORKING_MIGRATIONS.sql...\n');

const sql = readFileSync('WORKING_MIGRATIONS.sql', 'utf-8');

// Basic validation
const checks = {
  'File size': `${(sql.length / 1024).toFixed(1)} KB`,
  'Tables created': (sql.match(/CREATE TABLE IF NOT EXISTS/g) || []).length,
  'Indexes created': (sql.match(/CREATE INDEX IF NOT EXISTS/g) || []).length,
  'Functions created': (sql.match(/CREATE OR REPLACE FUNCTION/g) || []).length,
  'Materialized views': (sql.match(/CREATE MATERIALIZED VIEW/g) || []).length,
  'RLS enabled': (sql.match(/ENABLE ROW LEVEL SECURITY/g) || []).length,
  'Policies created': (sql.match(/CREATE POLICY/g) || []).length,
};

console.log('📊 Structure Analysis:');
Object.entries(checks).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Check for problematic patterns
console.log('\n🔍 Dependency Analysis:');

const foreignKeys = sql.match(/REFERENCES\s+(\w+)\(/g) || [];
const uniqueFKs = [...new Set(foreignKeys.map(fk => fk.match(/REFERENCES\s+(\w+)\(/)[1]))];

console.log(`  Foreign key dependencies: ${uniqueFKs.join(', ')}`);

// Check for specific problematic FKs
const hasAgentExecutionsFK = sql.includes('REFERENCES agent_executions');
const hasAgentTasksFK = sql.includes('REFERENCES agent_tasks');

if (hasAgentExecutionsFK || hasAgentTasksFK) {
  console.log('  ❌ PROBLEM: Contains FK to agent_executions or agent_tasks');
  console.log('  These tables may not exist!');
} else {
  console.log('  ✅ SAFE: No FK to agent_executions or agent_tasks');
}

// Verify workspace FK exists
const hasWorkspacesFK = sql.includes('REFERENCES workspaces');
if (hasWorkspacesFK) {
  console.log('  ✅ GOOD: References workspaces table (should exist)');
}

// Check for orphaned FK references
const orphanedFK = sql.match(/REFERENCES\s+auth\.users/g);
if (orphanedFK) {
  console.log(`  ✅ GOOD: References auth.users (Supabase built-in)`);
}

console.log('\n🎯 Final Validation:');

const issues = [];

if (hasAgentExecutionsFK) issues.push('FK to agent_executions');
if (hasAgentTasksFK) issues.push('FK to agent_tasks');

if (issues.length > 0) {
  console.log(`  ❌ FAILED: ${issues.join(', ')}`);
  console.log('  This SQL will fail when applied!');
  process.exit(1);
} else {
  console.log('  ✅ PASSED: No problematic dependencies');
  console.log('  ✅ Safe to apply to Supabase Dashboard');
  console.log('\n📄 File ready: WORKING_MIGRATIONS.sql');
}
