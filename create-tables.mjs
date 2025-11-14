#!/usr/bin/env node
/**
 * Create Database Tables via Supabase Client
 * Creates essential tables for Unite-Hub
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORG_ID = process.env.ORG_ID;

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

async function createTables() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║        Unite-Hub Database Table Creation             ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('Error: Missing Supabase environment variables', 'red');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  log('INFO: Tables must be created via Supabase Dashboard SQL Editor', 'yellow');
  log('Please follow these steps:\n', 'blue');

  log('1. Open Supabase Dashboard: https://supabase.com/dashboard', 'blue');
  log('2. Select your project', 'blue');
  log('3. Go to SQL Editor', 'blue');
  log('4. Copy and paste the contents of: supabase-schema.sql', 'blue');
  log('5. Click "Run" to execute the schema\n', 'blue');

  log('Checking current database state...', 'blue');

  // Check if organization exists
  try {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        log('✗ Organizations table does not exist', 'red');
        log('\nPlease run the schema via Supabase Dashboard SQL Editor', 'yellow');
      } else {
        log(`✗ Error checking organizations: ${error.message}`, 'red');
      }
    } else {
      log('✓ Organizations table exists', 'green');

      if (orgs && orgs.length > 0) {
        log(`  Found ${orgs.length} organization(s)`, 'blue');
      } else {
        log('  Creating default organization...', 'blue');

        // Create default organization
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            id: ORG_ID || undefined,
            name: 'Unite Group',
            email: 'contact@unite-group.in',
            plan: 'professional',
            status: 'active',
          })
          .select()
          .single();

        if (createError) {
          log(`  ✗ Error creating organization: ${createError.message}`, 'red');
        } else {
          log(`  ✓ Created organization: ${newOrg.name} (${newOrg.id})`, 'green');
        }
      }
    }
  } catch (err) {
    log(`Error: ${err.message}`, 'red');
  }

  // Check other tables
  const tables = ['team_members', 'projects', 'approvals', 'workspaces'];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          log(`✗ ${table} table does not exist`, 'red');
        } else {
          log(`⚠ ${table} table check: ${error.message}`, 'yellow');
        }
      } else {
        log(`✓ ${table} table exists`, 'green');
      }
    } catch (err) {
      log(`Error checking ${table}: ${err.message}`, 'red');
    }
  }

  log('\n════════════════════════════════════════════════════════', 'blue');
  log('\nTo complete setup:', 'blue');
  log('1. Run the schema via Supabase Dashboard if tables are missing', 'yellow');
  log('2. Then run: node test-api-flows.mjs to test the API\n', 'yellow');
}

createTables();
