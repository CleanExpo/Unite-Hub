#!/usr/bin/env node
/**
 * Apply time tracking migration to Supabase
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function checkTableExists(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  return !error || error.code !== '42P01';
}

async function run() {
  console.log('Checking existing tables...');

  const timeEntriesExists = await checkTableExists('time_entries');
  const activeTimersExists = await checkTableExists('active_timers');

  if (timeEntriesExists && activeTimersExists) {
    console.log('✅ Tables already exist! Migration was previously applied.');
    return;
  }

  console.log('Tables missing. Please apply migration manually:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Paste the contents of: supabase/migrations/700_time_tracking.sql');
  console.log('3. Click "Run"');
  console.log('\nAlternatively, the migration SQL starts with:');

  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '700_time_tracking.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(sql.substring(0, 500) + '...');
}

run().catch(console.error);
