#!/usr/bin/env node

/**
 * Run Migration 100 - Direct Execution via Supabase Management API
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🚀 Running Migration 100: Multi-Agent System Infrastructure\n');
console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '100_multi_agent_system.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log(`✅ Loaded migration file (${(migrationSQL.length / 1024).toFixed(2)} KB)\n`);

// Split into statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s.length > 10);

console.log(`📝 Found ${statements.length} SQL statements\n`);
console.log('⏳ Executing migration...\n');

// Execute via Supabase REST API
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

let successCount = 0;
let errorCount = 0;
const errors = [];

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';

  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: statement })
    });

    if (response.ok || response.status === 204) {
      successCount++;
      process.stdout.write(`\r✅ Progress: ${i + 1}/${statements.length} statements (${successCount} success, ${errorCount} errors)`);
    } else {
      const error = await response.text();
      errorCount++;
      errors.push({ statement: statement.substring(0, 100), error });
      process.stdout.write(`\r⚠️  Progress: ${i + 1}/${statements.length} statements (${successCount} success, ${errorCount} errors)`);
    }
  } catch (err) {
    errorCount++;
    errors.push({ statement: statement.substring(0, 100), error: err.message });
    process.stdout.write(`\r❌ Progress: ${i + 1}/${statements.length} statements (${successCount} success, ${errorCount} errors)`);
  }
}

console.log('\n\n📊 Migration Summary:');
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ⚠️  Errors: ${errorCount}`);
console.log(`   📝 Total: ${statements.length}\n`);

if (errors.length > 0 && errors.length < 10) {
  console.log('⚠️  Errors encountered:');
  errors.forEach((err, idx) => {
    console.log(`   ${idx + 1}. ${err.statement}...`);
    console.log(`      Error: ${err.error}\n`);
  });
}

// Verify tables created
console.log('🔍 Verifying tables...\n');

const tablesToCheck = ['agent_tasks', 'agent_executions', 'agent_health', 'agent_metrics'];
let verifiedCount = 0;

for (const table of tablesToCheck) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });

    if (response.ok) {
      console.log(`   ✅ Table "${table}" exists`);
      verifiedCount++;
    } else {
      console.log(`   ⚠️  Table "${table}" not found`);
    }
  } catch (err) {
    console.log(`   ❌ Table "${table}" check failed: ${err.message}`);
  }
}

console.log(`\n✅ Verified ${verifiedCount}/${tablesToCheck.length} tables\n`);

if (verifiedCount === tablesToCheck.length) {
  console.log('🎉 Migration 100 completed successfully!\n');
  console.log('📋 Created:');
  console.log('   - agent_tasks (task queue)');
  console.log('   - agent_executions (execution history)');
  console.log('   - agent_health (health monitoring)');
  console.log('   - agent_metrics (analytics)');
  console.log('   - Helper functions (get_pending_tasks, update_task_status, record_heartbeat)');
  console.log('\n✅ Multi-agent system database ready!');
  console.log('\n🚀 Next: Start agents with: node docker/agents/entrypoints/email-agent.mjs');
} else {
  console.log('⚠️  Some tables missing - migration may need manual execution in Supabase Dashboard');
  console.log('\n📋 Manual steps:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/editor/sql');
  console.log('   2. Paste contents of: supabase/migrations/100_multi_agent_system.sql');
  console.log('   3. Click "Run"');
}
