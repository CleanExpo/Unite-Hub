#!/usr/bin/env node

/**
 * Execute Migrations Using Supabase REST API
 *
 * This uses the service role key to execute SQL via Supabase's management API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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

console.log('🚀 Autonomous Migration Executor (Supabase API)\n');
console.log(`📍 Project: ${supabaseUrl}\n`);

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL by creating a database function and calling it
 */
async function executeMigration(migrationFile, description) {
  console.log(`📋 ${description}`);
  console.log('─'.repeat(60));

  try {
    const sqlPath = join(rootDir, 'supabase', 'migrations', migrationFile);
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split into statements
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`   Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement using rpc
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`   [${i + 1}/${statements.length}] Executing...`);

      try {
        // Use raw SQL execution via Supabase
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: stmt
        });

        if (error) {
          // Try alternative: Direct query for simple operations
          if (stmt.includes('SELECT') || stmt.includes('INSERT') || stmt.includes('UPDATE')) {
            // These can be executed directly
            console.log(`   ⚠️  RPC failed, trying direct execution...`);
            throw error;
          } else {
            throw error;
          }
        }

        console.log(`   ✅ Statement ${i + 1} completed`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
        console.error(`   SQL: ${stmt.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log(`\n   Summary: ${successCount} succeeded, ${errorCount} failed\n`);

    return errorCount === 0;
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    return false;
  }
}

/**
 * Verify migrations using direct queries
 */
async function verifyMigration040() {
  console.log('🔍 Verifying Migration 040...\n');

  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, ai_score')
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('   Sample contacts:');
      data.forEach(contact => {
        console.log(`   - ${contact.name || 'Unnamed'}: ${contact.ai_score}`);
      });
      console.log('\n   ✅ ai_score column verified\n');
    } else {
      console.log('   ℹ️  No contacts found (table might be empty)\n');
    }

    return true;
  } catch (error) {
    console.error('   ❌ Verification failed:', error.message);
    return false;
  }
}

async function verifyMigration041() {
  console.log('🔍 Verifying Migration 041...\n');

  try {
    const { count, error } = await supabase
      .from('client_emails')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`   ✅ client_emails table exists`);
    console.log(`   📊 Row count: ${count || 0}\n`);
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
  console.log('⚠️  Note: SQL execution via Supabase API has limitations\n');
  console.log('📝 Recommended: Execute SQL manually in Supabase Dashboard\n');
  console.log('Attempting to verify current state...\n');
  console.log('─'.repeat(60));
  console.log('\n');

  // Check if migrations are already applied
  console.log('🔍 Checking current database state...\n');

  // Check Migration 040 state
  try {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('ai_score')
      .limit(1);

    if (contacts && contacts.length > 0) {
      const scoreValue = contacts[0].ai_score;
      const isInteger = Number.isInteger(scoreValue);

      console.log(`Migration 040 Status:`);
      console.log(`   Current ai_score value: ${scoreValue}`);
      console.log(`   Type: ${isInteger ? 'INTEGER ✅' : 'DECIMAL ⚠️'}`);

      if (isInteger && scoreValue >= 0 && scoreValue <= 100) {
        console.log(`   ✅ Migration 040 appears to be already applied\n`);
      } else {
        console.log(`   ⚠️  Migration 040 needs to be applied\n`);
      }
    }
  } catch (err) {
    console.log(`   ❌ Could not check Migration 040 status:`, err.message);
  }

  // Check Migration 041 state
  try {
    const { error } = await supabase
      .from('client_emails')
      .select('id')
      .limit(1);

    if (!error) {
      console.log(`Migration 041 Status:`);
      console.log(`   ✅ client_emails table exists\n`);
    }
  } catch (err) {
    console.log(`Migration 041 Status:`);
    console.log(`   ⚠️  client_emails table does not exist\n`);
  }

  console.log('─'.repeat(60));
  console.log('\n');

  console.log('📋 Next Steps:\n');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('   https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new\n');

  console.log('2. Execute Migration 040 (if needed):');
  console.log('   Copy from: supabase/migrations/040_fix_ai_score_type.sql\n');

  console.log('3. Execute Migration 041 (if needed):');
  console.log('   Copy from: supabase/migrations/041_create_client_emails_table.sql\n');

  console.log('4. Verify with:');
  console.log('   SELECT id, name, ai_score FROM contacts LIMIT 5;');
  console.log('   SELECT COUNT(*) FROM client_emails;\n');

  console.log('💡 Alternatively, use the Supabase CLI:');
  console.log('   supabase db push\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
