#!/usr/bin/env node

/**
 * Apply Storage Bucket RLS Policies via Direct SQL Execution
 *
 * This script uses the Supabase REST API to execute SQL directly
 * with service role privileges.
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔧 Applying storage RLS policies via direct SQL execution...\n');

// Read the migration file
const migrationSQL = fs.readFileSync('supabase/migrations/031_storage_policies.sql', 'utf8');

async function executeSQLDirect(sql) {
  try {
    // Use Supabase's PostgREST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'params=single-object',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function applyPoliciesDirectly() {
  console.log('📝 Executing migration SQL...\n');
  console.log('⚠️  NOTE: If you see permission errors, we need to use the Supabase Dashboard UI\n');

  try {
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip DO blocks and comments
      if (statement.includes('DO $$') || statement.startsWith('--')) {
        continue;
      }

      // Extract policy name for display
      const policyMatch = statement.match(/CREATE POLICY "(.+?)"/);
      const policyName = policyMatch ? policyMatch[1] : `Statement ${i + 1}`;

      console.log(`Executing: ${policyName}...`);

      try {
        await executeSQLDirect(statement + ';');
        console.log(`   ✅ Success\n`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipping)\n`);
          skipCount++;
        } else if (error.message.includes('must be owner')) {
          console.log(`   ❌ Permission denied - must use Dashboard UI\n`);
          errorCount++;
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
          errorCount++;
        }
      }
    }

    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some policies could not be created programmatically.');
      console.log('   Please use the Supabase Dashboard UI to create them manually.');
      console.log('   See: STORAGE_SETUP_INSTRUCTIONS.md for detailed steps.\n');
    } else {
      console.log('✅ All policies created successfully!\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
applyPoliciesDirectly();
