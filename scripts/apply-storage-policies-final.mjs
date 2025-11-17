#!/usr/bin/env node

/**
 * Apply Storage Bucket RLS Policies
 * Uses Supabase service role key to execute SQL with proper permissions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'storage',
  },
});

console.log('🔧 Applying storage RLS policies...\n');

// Read the SQL file
const sql = fs.readFileSync('scripts/storage-policies-manual.sql', 'utf8');

async function applyPolicies() {
  try {
    // Execute the SQL using Supabase's raw query execution
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      console.log('\n⚠️  The service role key may not have permission to create storage policies.');
      console.log('   Please copy the contents of scripts/storage-policies-manual.sql');
      console.log('   and run it in the Supabase Dashboard → SQL Editor\n');
      process.exit(1);
    }

    console.log('✅ SQL executed successfully!\n');
    console.log('📊 Verifying policies...\n');

    // Verify the policies were created
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('policyname, schemaname, tablename')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')
      .in('policyname', [
        'Users can view files in their workspace',
        'Users can upload to their workspace',
        'Users can update their own files',
        'Users can delete their own files',
      ]);

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      process.exit(1);
    }

    console.log(`Found ${policies?.length || 0}/4 storage policies:`);
    policies?.forEach((p) => console.log(`   ✅ ${p.policyname}`));

    if (policies?.length === 4) {
      console.log('\n🎉 All storage RLS policies applied successfully!\n');
    } else {
      console.log('\n⚠️  Not all policies were created. Please check manually.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('\n📋 Manual Instructions:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of scripts/storage-policies-manual.sql');
    console.log('   3. Paste and click "Run"\n');
    process.exit(1);
  }
}

applyPolicies();
