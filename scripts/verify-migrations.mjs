#!/usr/bin/env node
/**
 * Verify Synthex migrations were applied successfully
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('\n🔍 Verifying Migration Application...\n');

  // Test 1: synthex_content_queue
  console.log('1️⃣  Checking synthex_content_queue table...');
  try {
    const { data, error } = await supabase
      .from('synthex_content_queue')
      .select('id')
      .limit(1);

    if (error) {
      console.log('   ❌ Table does NOT exist or is inaccessible');
      console.log('   Error: ' + error.message);
      return false;
    } else {
      console.log('   ✅ Table exists and is accessible');
    }
  } catch (err) {
    console.log('   ❌ Error: ' + err.message);
    return false;
  }

  // Test 2: custom_integrations
  console.log('\n2️⃣  Checking custom_integrations table...');
  try {
    const { data, error } = await supabase
      .from('custom_integrations')
      .select('id')
      .limit(1);

    if (error) {
      console.log('   ❌ Table does NOT exist or is inaccessible');
      console.log('   Error: ' + error.message);
      return false;
    } else {
      console.log('   ✅ Table exists and is accessible');
    }
  } catch (err) {
    console.log('   ❌ Error: ' + err.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  SYNTHEX MIGRATION VERIFICATION                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const success = await verifyTables();

  console.log('\n' + '='.repeat(60));

  if (success) {
    console.log('✅ MIGRATIONS SUCCESSFULLY APPLIED');
    console.log('\nTables created:');
    console.log('  • synthex_content_queue (social post scheduling)');
    console.log('  • custom_integrations (Elite tier feature)');
    console.log('\n🎯 Next: Re-run full validation');
    console.log('   node scripts/validate-synthex-capabilities.mjs');
  } else {
    console.log('❌ MIGRATIONS NOT APPLIED');
    console.log('\nApply via Dashboard:');
    console.log('https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new');
    console.log('\nUse file: APPLY-THESE-MIGRATIONS.sql');
  }

  console.log('='.repeat(60) + '\n');
}

main();
