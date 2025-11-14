#!/usr/bin/env node
/**
 * Database Setup Script
 * Applies schema to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupDatabase() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║        Unite-Hub Database Setup                       ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('Error: Missing Supabase environment variables', 'red');
    log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local', 'yellow');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  log('Reading schema file...', 'blue');
  const schema = readFileSync('./supabase-schema.sql', 'utf8');

  // Split schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  log(`Found ${statements.length} SQL statements to execute\n`, 'blue');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Get a short description of the statement
    const firstLine = statement.split('\n')[0].trim();
    const description = firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;

    try {
      // Execute the statement using Supabase's RPC
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (like "already exists"), so we handle them gracefully
        if (error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          log(`⚠ Skipped (${i + 1}/${statements.length}): ${description}`, 'yellow');
        } else {
          log(`✗ Error (${i + 1}/${statements.length}): ${description}`, 'red');
          log(`  ${error.message}`, 'red');
          errorCount++;
        }
      } else {
        log(`✓ Success (${i + 1}/${statements.length}): ${description}`, 'green');
        successCount++;
      }
    } catch (err) {
      log(`✗ Failed (${i + 1}/${statements.length}): ${description}`, 'red');
      log(`  ${err.message}`, 'red');
      errorCount++;
    }
  }

  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║                    Setup Summary                      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Statements: ${statements.length}`);
  log(`✓ Successful: ${successCount}`, 'green');

  if (errorCount > 0) {
    log(`✗ Errors: ${errorCount}`, 'red');
    log('\nNote: Some errors may be expected (e.g., tables already exist)', 'yellow');
  }

  log('\n✓ Database setup complete!', 'green');
  log('\nYou can now run the API tests with: node test-api-flows.mjs\n', 'blue');
}

setupDatabase().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
