#!/usr/bin/env node

/**
 * Create Storage Policies via Supabase Management API
 *
 * This uses the Supabase Management API which has the necessary permissions
 * to create storage bucket policies that the SQL Editor doesn't have.
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_ACCESS_TOKEN:', accessToken ? '✓' : '✗');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from SUPABASE_URL');
  process.exit(1);
}

console.log('🔧 Creating storage policies via Management API...\n');
console.log(`📡 Project: ${projectRef}\n`);

const policies = [
  {
    name: 'Users can view files in their workspace',
    definition: `(bucket_id = 'media-uploads'::text) AND ((storage.foldername(name))[1])::uuid IN ( SELECT w.id FROM (public.workspaces w JOIN public.user_organizations uo ON ((uo.org_id = w.org_id))) WHERE (uo.user_id = auth.uid()))`,
    command: 'SELECT',
    roles: ['authenticated'],
  },
  {
    name: 'Users can upload to their workspace',
    definition: `(bucket_id = 'media-uploads'::text) AND ((storage.foldername(name))[1])::uuid IN ( SELECT w.id FROM (public.workspaces w JOIN public.user_organizations uo ON ((uo.org_id = w.org_id))) WHERE (uo.user_id = auth.uid()))`,
    command: 'INSERT',
    roles: ['authenticated'],
    check: `(bucket_id = 'media-uploads'::text) AND ((storage.foldername(name))[1])::uuid IN ( SELECT w.id FROM (public.workspaces w JOIN public.user_organizations uo ON ((uo.org_id = w.org_id))) WHERE (uo.user_id = auth.uid()))`,
  },
  {
    name: 'Users can update their own files',
    definition: `(bucket_id = 'media-uploads'::text) AND (owner = auth.uid())`,
    command: 'UPDATE',
    roles: ['authenticated'],
    check: `(bucket_id = 'media-uploads'::text) AND (owner = auth.uid())`,
  },
  {
    name: 'Users can delete their own files',
    definition: `(bucket_id = 'media-uploads'::text) AND (owner = auth.uid())`,
    command: 'DELETE',
    roles: ['authenticated'],
  },
];

async function createPolicy(policy) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/policies`;

  const payload = {
    name: policy.name,
    schema: 'storage',
    table: 'objects',
    action: policy.command,
    roles: policy.roles,
    definition: policy.definition,
  };

  if (policy.check) {
    payload.check = policy.check;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();

      // If policy already exists, that's okay
      if (error.includes('already exists') || response.status === 409) {
        return { success: true, exists: true };
      }

      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return { success: true, exists: false };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createAllPolicies() {
  let created = 0;
  let existed = 0;
  let failed = 0;

  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    console.log(`${i + 1}/4 Creating: "${policy.name}"...`);

    const result = await createPolicy(policy);

    if (result.success) {
      if (result.exists) {
        console.log('   ⚠️  Already exists (skipping)\n');
        existed++;
      } else {
        console.log('   ✅ Created successfully\n');
        created++;
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`);
      failed++;
    }
  }

  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⚠️  Already existed: ${existed}`);
  console.log(`   ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('⚠️  Some policies failed. This might mean:');
    console.log('   1. The Management API doesn\'t support storage policies');
    console.log('   2. The access token doesn\'t have sufficient permissions');
    console.log('   3. We need to use the Dashboard UI (as Supabase recommends)\n');
    return false;
  }

  return true;
}

async function verifyPolicies() {
  console.log('🔍 Verifying policies via database query...\n');

  // We'll use the regular Supabase client to verify
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname IN (
          'Users can view files in their workspace',
          'Users can upload to their workspace',
          'Users can update their own files',
          'Users can delete their own files'
        )
    `,
  });

  if (error) {
    console.log('⚠️  Could not verify (but policies may still exist)\n');
    return;
  }

  console.log(`Found ${data?.length || 0}/4 policies in database\n`);
}

// Run
createAllPolicies()
  .then(success => {
    if (success) {
      console.log('🎉 All storage policies created successfully!\n');
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
