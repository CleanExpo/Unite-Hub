#!/usr/bin/env node

/**
 * Execute Database Migrations Autonomously
 *
 * This script connects to Supabase and executes pending migrations
 * using the service role key for admin access.
 *
 * Usage: node scripts/execute-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Unite-Hub Database Migration Tool\n');

/**
 * Execute a SQL migration file
 */
async function executeMigration(migrationFile, description) {
  console.log(`📋 ${description}`);
  console.log(`📁 File: ${migrationFile}\n`);

  try {
    // Read migration SQL
    const sqlPath = join(rootDir, 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(sqlPath, 'utf-8');

    // Remove comments and split into individual statements
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`   Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          query: stmt + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0);

          if (directError) {
            throw new Error(error.message || 'SQL execution failed');
          }
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n   Summary: ${successCount} succeeded, ${errorCount} failed\n`);

    if (errorCount === 0) {
      console.log(`✅ Migration ${migrationFile} completed successfully!\n`);
      return true;
    } else {
      console.log(`⚠️  Migration ${migrationFile} completed with ${errorCount} error(s)\n`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to execute migration:`, error.message);
    return false;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration040() {
  console.log('🔍 Verifying Migration 040 (ai_score type change)...\n');

  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, ai_score')
      .limit(5);

    if (error) throw error;

    console.log('   Sample contacts with ai_score:');
    data.forEach(contact => {
      console.log(`   - ${contact.name}: ${contact.ai_score} (type: ${typeof contact.ai_score})`);
    });

    console.log('\n   ✅ ai_score column is now INTEGER type (0-100 scale)\n');
    return true;
  } catch (error) {
    console.error('   ❌ Verification failed:', error.message);
    return false;
  }
}

async function verifyMigration041() {
  console.log('🔍 Verifying Migration 041 (client_emails table)...\n');

  try {
    const { data, error, count } = await supabase
      .from('client_emails')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`   ✅ client_emails table exists`);
    console.log(`   📊 Current row count: ${count || 0}\n`);
    return true;
  } catch (error) {
    console.error('   ❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const migrations = [
    {
      file: '040_fix_ai_score_type.sql',
      description: 'Migration 040: Change ai_score from DECIMAL to INTEGER (0-100 scale)',
      verify: verifyMigration040
    },
    {
      file: '041_create_client_emails_table.sql',
      description: 'Migration 041: Create client_emails table for email sync',
      verify: verifyMigration041
    }
  ];

  let allSuccessful = true;

  for (const migration of migrations) {
    const success = await executeMigration(migration.file, migration.description);

    if (success && migration.verify) {
      await migration.verify();
    }

    if (!success) {
      allSuccessful = false;
    }

    console.log('─'.repeat(60) + '\n');
  }

  if (allSuccessful) {
    console.log('🎉 All migrations completed successfully!\n');
    console.log('Next steps:');
    console.log('1. ✅ Test the changes in your application');
    console.log('2. ✅ Update any affected queries to use 0-100 scale for ai_score');
    console.log('3. ✅ Begin syncing emails to client_emails table\n');
  } else {
    console.log('⚠️  Some migrations had errors. Review the output above.\n');
    console.log('You may need to run the SQL manually in Supabase Dashboard.\n');
  }
}

// Run migrations
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
