#!/usr/bin/env node
/**
 * Apply AI Authority Migrations using PostgreSQL Client
 * Connects directly to Supabase Postgres and executes SQL migrations
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Extract connection details from Supabase URL
// Format: https://PROJECT_REF.supabase.co
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const host = `db.${projectRef}.supabase.co`;
const port = 5432;
const database = 'postgres';

// Get password from service role key (need to derive connection string)
console.log('\n🚀 AI Authority Migrations - PostgreSQL Direct Connection\n');
console.log('⚠️  Direct Postgres connection requires database password.');
console.log('   Service role key is a JWT, not a password.\n');
console.log('📋 Get your database password from Supabase Dashboard:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
console.log('2. Copy "Database Password" (or reset if needed)');
console.log('3. Set environment variable: DATABASE_PASSWORD=your-password');
console.log('4. Re-run this script\n');

if (!process.env.DATABASE_PASSWORD) {
  console.log('❌ DATABASE_PASSWORD not set\n');
  console.log('Alternative: Apply migrations manually in Supabase SQL Editor');
  console.log('Guide: QUICK_START_MIGRATIONS.md (5 minutes)\n');
  process.exit(1);
}

const client = new pg.Client({
  host,
  port,
  database,
  user: 'postgres',
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

console.log(`Connecting to: ${host}...`);

try {
  await client.connect();
  console.log('✅ Connected to Supabase Postgres\n');

  // Apply migrations
  const migrations = [
    'supabase/migrations/20251226120000_ai_authority_substrate.sql',
    'supabase/migrations/20251226120100_authority_supporting_tables.sql',
  ];

  for (const migrationFile of migrations) {
    console.log(`📄 Applying: ${migrationFile}`);

    const sql = readFileSync(migrationFile, 'utf-8');
    await client.query(sql);

    console.log(`✅ Applied successfully\n`);
  }

  console.log('✅ All migrations applied!\n');

  // Verify
  const result = await client.query('SELECT COUNT(*) FROM client_jobs');
  console.log(`✅ Verification: client_jobs table accessible (${result.rows[0].count} rows)\n`);

  await client.end();
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  await client.end();
  process.exit(1);
}
