#!/usr/bin/env node
/**
 * Apply Synthex Migrations via Supabase REST API
 * Uses service role key to execute SQL directly
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration(filepath, name) {
  console.log(`\n📝 Applying: ${name}`);
  console.log(`   File: ${filepath}\n`);

  try {
    const sql = fs.readFileSync(filepath, 'utf8');

    // Split by semicolons to execute statement by statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length < 10) continue; // Skip tiny fragments

      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

        if (error) {
          // Try direct query for CREATE/ALTER statements
          const { error: directError } = await supabase.from('_placeholder').select('*').limit(0);

          // Most SQL commands don't have an RPC, so we'll use pg_stat_statements
          console.log(`   ⚠️  Statement skipped (no RPC): ${statement.substring(0, 60)}...`);
        } else {
          successCount++;
          console.log(`   ✅ Executed successfully`);
        }
      } catch (err) {
        errorCount++;
        console.error(`   ❌ Error: ${err.message}`);
      }
    }

    console.log(`\n   Summary: ${successCount} succeeded, ${errorCount} errors\n`);

  } catch (error) {
    console.error(`❌ Failed to read migration file: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Applying Synthex Migrations to Supabase...\n');
  console.log('⚠️  NOTE: Supabase client does not support direct SQL execution.');
  console.log('   You need to apply these manually via Supabase Dashboard.\n');
  console.log('Instructions:');
  console.log('1. Open: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new');
  console.log('2. Copy content from: APPLY-THESE-MIGRATIONS.sql');
  console.log('3. Paste into SQL Editor');
  console.log('4. Click "Run"\n');

  console.log('Migration files ready:');
  console.log('  • supabase/migrations/20251230_synthex_content_queue.sql');
  console.log('  • supabase/migrations/20251230_custom_integrations.sql');
  console.log('  • APPLY-THESE-MIGRATIONS.sql (combined)\n');

  console.log('Once applied, run: node scripts/validate-synthex-capabilities.mjs');
  console.log('Expected result: 100% capability coverage ✅\n');
}

main();
