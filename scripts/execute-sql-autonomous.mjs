#!/usr/bin/env node

/**
 * Autonomous SQL Migration Executor
 *
 * Executes SQL migrations using Supabase's pg connection directly
 * This script uses the service role key to execute DDL statements
 */

import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Extract database connection details
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL');
  process.exit(1);
}

console.log('🚀 Autonomous SQL Migration Executor\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

/**
 * Execute SQL using fetch to Supabase's query endpoint
 */
async function executeSQL(sql, description) {
  console.log(`📋 ${description}`);
  console.log('─'.repeat(60));

  try {
    // Use Supabase's REST API to execute SQL
    // Note: This requires the SQL to be executable through PostgREST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    return false;
  }
}

/**
 * Alternative: Execute via direct PostgreSQL connection
 */
async function executeSQLDirect(sql, description) {
  console.log(`\n📋 ${description}`);
  console.log('─'.repeat(60));

  // This would require DIRECT_URL or DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.log('⚠️  No DATABASE_URL found. Skipping direct execution.');
    console.log('💡 Add DATABASE_URL to .env.local for direct PostgreSQL access');
    return false;
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n   Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      console.log(`   [${i + 1}/${statements.length}] Executing...`);
      try {
        await client.query(statements[i]);
        console.log(`   ✅ Statement ${i + 1} completed`);
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
      }
    }

    await client.end();
    console.log('\n✅ Migration completed\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await client.end().catch(() => {});
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('📖 Reading migration files...\n');

  const migration040 = readFileSync(
    join(rootDir, 'supabase/migrations/040_fix_ai_score_type.sql'),
    'utf-8'
  );

  const migration041 = readFileSync(
    join(rootDir, 'supabase/migrations/041_create_client_emails_table.sql'),
    'utf-8'
  );

  console.log('✅ Migration files loaded\n');

  // Check if we have direct database access
  if (process.env.DATABASE_URL || process.env.DIRECT_URL) {
    console.log('🔌 Direct database connection available - using PostgreSQL client\n');

    await executeSQLDirect(migration040, 'Migration 040: Fix ai_score type');
    await executeSQLDirect(migration041, 'Migration 041: Create client_emails table');
  } else {
    console.log('⚠️  No direct database connection available\n');
    console.log('🎯 Recommended: Execute migrations manually in Supabase Dashboard\n');
    console.log('To enable autonomous execution, add one of these to .env.local:');
    console.log('   DATABASE_URL=postgresql://[connection-string]');
    console.log('   DIRECT_URL=postgresql://[connection-string]\n');
    console.log('📍 Find your connection string:');
    console.log('   Supabase Dashboard → Settings → Database → Connection String\n');

    // Output SQL for manual execution
    console.log('📋 Migration 040 SQL:');
    console.log('─'.repeat(60));
    console.log(migration040);
    console.log('─'.repeat(60));
    console.log('\n📋 Migration 041 SQL:');
    console.log('─'.repeat(60));
    console.log(migration041);
    console.log('─'.repeat(60));
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
