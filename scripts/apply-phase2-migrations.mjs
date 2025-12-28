/**
 * Apply Project Vend Phase 2 Migrations
 * Runs all Phase 2 migrations programmatically via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Applying Project Vend Phase 2 migrations...');
console.log(`Database: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Phase 2 migrations in order
const migrations = [
  '20251229120000_agent_execution_metrics.sql',
  '20251229120100_agent_health_status.sql',
  '20251229120200_agent_business_rules.sql',
  '20251229120300_agent_rule_violations.sql'
];

async function applyMigration(filename) {
  try {
    console.log(`\n📄 Applying: ${filename}`);

    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', filename);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async (err) => {
      // If exec_sql function doesn't exist, try direct execution
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
        if (stmtError) throw stmtError;
      }

      return { error: null };
    });

    if (error) {
      console.error(`❌ Failed to apply ${filename}:`, error);
      throw error;
    }

    console.log(`✅ Successfully applied: ${filename}`);
  } catch (err) {
    console.error(`❌ Migration failed: ${filename}`, err);
    throw err;
  }
}

async function main() {
  try {
    for (const migration of migrations) {
      await applyMigration(migration);
    }

    console.log('\n✅ All Phase 2 migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run tests: npm run test tests/agents');
    console.log('  2. Verify tables: Check Supabase Dashboard > Table Editor');
    console.log('  3. Continue to Phase 3');

  } catch (err) {
    console.error('\n❌ Migration process failed:', err);
    console.error('\nFallback: Apply migrations manually via Supabase Dashboard');
    console.error('  1. Open Supabase Dashboard > SQL Editor');
    console.error('  2. Copy/paste from: combined_phase2_migrations.sql');
    console.error('  3. Click Run');
    process.exit(1);
  }
}

main();
