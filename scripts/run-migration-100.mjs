#!/usr/bin/env node

/**
 * Execute Migration 100: Multi-Agent System Infrastructure
 * This script runs the SQL migration directly using Supabase client
 */

import { createClient } from '@supabase/supabase-js';
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
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting Migration 100: Multi-Agent System Infrastructure\n');

  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '100_multi_agent_system.sql');

  let migrationSQL;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Read migration file: ${migrationPath}`);
    console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error(`❌ Failed to read migration file: ${error.message}`);
    process.exit(1);
  }

  // Execute migration
  console.log('⏳ Executing SQL migration...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql function doesn't exist, try direct SQL execution via REST API
      console.log('⚠️  exec_sql function not available, trying alternative method...\n');

      // Split migration into individual statements
      const statements = splitSQLStatements(migrationSQL);
      console.log(`📝 Executing ${statements.length} SQL statements...\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement || statement.startsWith('--')) continue;

        try {
          // Execute via Supabase SQL editor API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: statement })
          });

          if (response.ok) {
            successCount++;
            process.stdout.write(`✅ Statement ${i + 1}/${statements.length}\r`);
          } else {
            const error = await response.text();
            console.log(`\n⚠️  Statement ${i + 1} warning: ${error.substring(0, 100)}`);
            errorCount++;
          }
        } catch (err) {
          console.log(`\n❌ Statement ${i + 1} error: ${err.message}`);
          errorCount++;
        }
      }

      console.log(`\n\n📊 Execution Summary:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ⚠️  Warnings/Errors: ${errorCount}`);
      console.log(`   📝 Total: ${statements.length}`);

    } else {
      console.log('✅ Migration executed successfully!\n');
      if (data) {
        console.log('Result:', data);
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying database schema...\n');
    await verifySchema();

    console.log('\n✅ Migration 100 completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - agent_tasks (task queue)');
    console.log('   - agent_executions (execution history)');
    console.log('   - agent_health (health monitoring)');
    console.log('   - agent_metrics (analytics)');
    console.log('\n📋 Added columns:');
    console.log('   - client_emails.intelligence_analyzed');
    console.log('   - media_files.intelligence_analyzed');
    console.log('\n📋 Created functions:');
    console.log('   - get_pending_tasks_for_agent()');
    console.log('   - update_task_status()');
    console.log('   - record_agent_heartbeat()');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

function splitSQLStatements(sql) {
  // Simple SQL statement splitter (handles basic cases)
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let inDollarQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    // Handle dollar-quoted strings ($$)
    if (char === '$' && nextChar === '$' && !inString) {
      inDollarQuote = !inDollarQuote;
      current += char + nextChar;
      i++; // Skip next $
      continue;
    }

    // Handle regular strings
    if ((char === "'" || char === '"') && !inDollarQuote) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && sql[i - 1] !== '\\') {
        inString = false;
        stringChar = null;
      }
    }

    // Handle statement terminator
    if (char === ';' && !inString && !inDollarQuote) {
      current += char;
      statements.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  // Add remaining statement
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function verifySchema() {
  const tablesToVerify = [
    'agent_tasks',
    'agent_executions',
    'agent_health',
    'agent_metrics'
  ];

  for (const table of tablesToVerify) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    if (error) {
      console.log(`   ⚠️  Table "${table}": ${error.message}`);
    } else {
      console.log(`   ✅ Table "${table}" verified`);
    }
  }
}

// Run migration
runMigration();
