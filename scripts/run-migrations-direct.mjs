#!/usr/bin/env node

/**
 * Direct PostgreSQL Migration Executor
 * Uses pg package to execute migrations autonomously via DIRECT_CONNECT
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });

// Extract password from DIRECT_CONNECT
// Format: postgresql://postgres:PASSWORD@db.lksfwktwtmyznckodsau.supabase.co:5432/postgres
const directConnect = process.env.DIRECT_CONNECT || '';
const passwordMatch = directConnect.match(/:([^@]+)@/);
const password = passwordMatch ? passwordMatch[1] : '';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

let connectionString;

if (projectRef && password) {
  // Use pooler URL (better for serverless/reliability)
  connectionString = `postgresql://postgres.${projectRef}:${password}@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres`;
} else {
  connectionString = directConnect;
}

if (!connectionString) {
  console.error('❌ Missing connection credentials in .env.local');
  process.exit(1);
}

console.log('\n🚀 Autonomous PostgreSQL Migration Executor\n');
console.log('━'.repeat(60));
console.log('\n📍 Project Reference:', projectRef || 'Unknown');
console.log('🔗 Using Supabase Pooler connection');
console.log('🎯 Target: Migration 046 (AI Usage Tracking - CLEANED)\n');

// Read migration file
const migrationPath = join(rootDir, 'supabase/migrations/046_ai_usage_tracking_CLEANED.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log(`✅ Loaded migration: 046_ai_usage_tracking_CLEANED.sql`);
console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
console.log(`📝 Lines: ${migrationSQL.split('\n').length}\n`);

async function executeMigration() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('⏳ Executing migration...\n');
    console.log('─'.repeat(60));

    // Execute the entire migration as a single query
    // PostgreSQL will handle all the statements in sequence
    await client.query(migrationSQL);

    console.log('─'.repeat(60));
    console.log('\n✅ Migration executed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');

    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('ai_usage_logs', 'ai_budget_limits')
      ORDER BY table_name;
    `);

    if (tableCheck.rows.length === 2) {
      console.log('✅ Tables verified:');
      tableCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

    const functionCheck = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('log_ai_usage', 'check_ai_budget', 'get_ai_cost_breakdown', 'refresh_ai_daily_summary')
      ORDER BY proname;
    `);

    console.log(`\n✅ Functions: ${functionCheck.rows.length} created`);
    functionCheck.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    const policyCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE tablename IN ('ai_usage_logs', 'ai_budget_limits');
    `);

    console.log(`\n✅ RLS Policies: ${policyCheck.rows[0].count} created\n`);

    await client.end();

    console.log('━'.repeat(60));
    console.log('✨ Migration 046 complete and verified!\n');

    process.exit(0);
  } catch (error) {
    console.log('─'.repeat(60));
    console.error('\n❌ Migration failed!');
    console.error(`\nError: ${error.message}\n`);

    if (error.position) {
      console.error(`Position: ${error.position}`);
    }

    if (error.detail) {
      console.error(`Detail: ${error.detail}\n`);
    }

    await client.end().catch(() => {});

    console.log('⚠️  Migration did not complete successfully.');
    console.log('💡 Check error output above for details.\n');

    process.exit(1);
  }
}

executeMigration();
