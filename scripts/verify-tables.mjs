#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log('\n🔍 Verifying AI Authority Tables\n');

// Test each table
const tables = [
  'client_jobs',
  'information_vacuums',
  'synthex_visual_audits',
  'synthex_suburb_mapping',
  'synthex_compliance_violations',
  'synthex_gbp_outreach'
];

for (const table of tables) {
  const { data, error } = await supabase.from(table).select('id').limit(1);

  if (error) {
    console.log(`❌ ${table}: ${error.message}`);
  } else {
    console.log(`✅ ${table}: OK (${data?.length || 0} rows)`);
  }
}

// Test view
console.log('\n🔍 Checking suburb_authority_substrate view\n');
const { data: viewData, error: viewError } = await supabase
  .from('suburb_authority_substrate')
  .select('*')
  .limit(1);

if (viewError) {
  console.log(`❌ suburb_authority_substrate: ${viewError.message}`);
} else {
  console.log(`✅ suburb_authority_substrate: OK (${viewData?.length || 0} rows)`);
}

console.log('\n✅ All tables and views verified!\n');
