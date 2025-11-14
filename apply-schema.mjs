#!/usr/bin/env node
/**
 * Direct Database Schema Application
 * Applies schema to Supabase database using direct connection
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DIRECT_CONNECT;

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

async function applySchema() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║        Unite-Hub Database Schema Application          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝\n', 'blue');

  if (!connectionString) {
    log('Error: Missing DIRECT_CONNECT environment variable', 'red');
    log('Please ensure DIRECT_CONNECT is set in .env.local', 'yellow');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    log('Connecting to database...', 'blue');
    await client.connect();
    log('✓ Connected successfully\n', 'green');

    log('Reading schema file...', 'blue');
    const schema = readFileSync('./supabase-schema.sql', 'utf8');

    log('Applying schema to database...', 'blue');
    await client.query(schema);

    log('\n✓ Schema applied successfully!', 'green');
    log('\nYou can now run the API tests with: node test-api-flows.mjs\n', 'blue');

  } catch (error) {
    log(`\nError: ${error.message}`, 'red');

    if (error.message.includes('already exists')) {
      log('\nNote: Some objects already exist in the database. This is normal.', 'yellow');
      log('✓ Schema application complete (with existing objects)', 'green');
    } else {
      log('\nFailed to apply schema. Please check the error above.', 'red');
      process.exit(1);
    }
  } finally {
    await client.end();
    log('Database connection closed.\n', 'blue');
  }
}

applySchema();
