#!/usr/bin/env node
/**
 * Apply AI Authority Migrations Programmatically
 * Reads SQL migration files and executes them via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('\n🚀 Applying AI Authority Migrations\n');

// Migration files to apply
const migrations = [
  {
    file: 'supabase/migrations/20251226120000_ai_authority_substrate.sql',
    name: 'Main Migration (client_jobs + suburb_authority_substrate view)',
  },
  {
    file: 'supabase/migrations/20251226120100_authority_supporting_tables.sql',
    name: 'Supporting Tables (vacuums, audits, compliance, outreach)',
  },
];

let successCount = 0;
let errorCount = 0;

for (const migration of migrations) {
  console.log(`\n📄 Applying: ${migration.name}`);
  console.log(`   File: ${migration.file}\n`);

  try {
    // Read SQL file
    const sql = readFileSync(migration.file, 'utf-8');

    // Execute SQL
    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to use the REST API or PostgreSQL client directly

    console.log('⚠️  Cannot apply SQL directly via Supabase JS client');
    console.log('   Reason: Supabase client doesn\'t support raw SQL execution with multiple statements');
    console.log('\n   📋 COPY THIS SQL TO SUPABASE DASHBOARD:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql');
    console.log('   2. Click "+ New Query"');
    console.log(`   3. Copy contents of: ${migration.file}`);
    console.log('   4. Paste and click "Run"\n');

    errorCount++;
  } catch (error) {
    console.error(`\n❌ Error reading migration file: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(70));
console.log('Migration Application Status');
console.log('='.repeat(70));
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log('\n⚠️  MANUAL ACTION REQUIRED:\n');
console.log('Supabase JS client doesn\'t support executing raw SQL migrations.');
console.log('Please apply migrations manually in Supabase Dashboard:\n');
console.log('1. Open: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql');
console.log('2. Click "+ New Query"');
console.log('3. Copy/paste each migration file');
console.log('4. Click "Run" for each\n');
console.log('Or follow: QUICK_START_MIGRATIONS.md (5-minute guide)\n');

process.exit(errorCount > 0 ? 1 : 0);
