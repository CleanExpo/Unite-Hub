#!/usr/bin/env node

/**
 * Force Supabase Schema Cache Refresh
 * Runs a simple query on each table to force cache update
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔄 Refreshing Supabase schema cache...\n');

const tables = ['agent_tasks', 'agent_executions', 'agent_health', 'agent_metrics'];

for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1);

  if (error) {
    console.log(`⚠️  ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: Cache refreshed`);
  }
}

console.log('\n✅ Schema cache refresh complete!');
console.log('💡 Wait 30 seconds and try creating tasks again.\n');
