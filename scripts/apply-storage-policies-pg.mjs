#!/usr/bin/env node

/**
 * Apply Storage Bucket RLS Policies using Direct PostgreSQL Connection
 */

import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';

const { Client } = pg;

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

// Construct PostgreSQL connection string
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('🔧 Applying storage RLS policies via direct PostgreSQL connection...\n');
console.log(`📡 Connecting to: ${projectRef}.supabase.co\n`);

async function applyPolicies() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the SQL file
    const sql = fs.readFileSync('scripts/storage-policies-manual.sql', 'utf8');

    console.log('📝 Executing SQL...\n');

    // Execute the SQL
    const result = await client.query(sql);

    console.log('✅ SQL executed successfully!\n');

    // Verify policies
    console.log('📊 Verifying policies...\n');

    const verifyQuery = `
      SELECT policyname, cmd as operation
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname IN (
          'Users can view files in their workspace',
          'Users can upload to their workspace',
          'Users can update their own files',
          'Users can delete their own files'
        )
      ORDER BY cmd;
    `;

    const verifyResult = await client.query(verifyQuery);

    console.log(`Found ${verifyResult.rows.length}/4 storage policies:\n`);

    verifyResult.rows.forEach((row) => {
      console.log(`   ✅ [${row.operation}] ${row.policyname}`);
    });

    if (verifyResult.rows.length === 4) {
      console.log('\n🎉 All storage RLS policies applied successfully!\n');
    } else {
      console.log('\n⚠️  Only found ' + verifyResult.rows.length + '/4 policies. Some may have failed.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('permission denied') || error.message.includes('must be owner')) {
      console.log('\n⚠️  Permission denied. Storage policies require superuser access.');
      console.log('   Please run the SQL manually in Supabase Dashboard → SQL Editor\n');
      console.log('📋 Instructions:');
      console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
      console.log('   2. Copy contents of: scripts/storage-policies-manual.sql');
      console.log('   3. Paste and click "Run"\n');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

applyPolicies();
