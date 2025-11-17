#!/usr/bin/env node

/**
 * Apply Storage Bucket RLS Policies via Supabase API
 *
 * This script uses the Supabase service role key to create RLS policies
 * on the storage.objects table for the media-uploads bucket.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

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

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔧 Applying storage RLS policies...\n');

const policies = [
  {
    name: 'Users can view files in their workspace',
    operation: 'SELECT',
    definition: `
      bucket_id = 'media-uploads'
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT w.id
        FROM public.workspaces w
        JOIN public.user_organizations uo ON uo.org_id = w.org_id
        WHERE uo.user_id = auth.uid()
      )
    `,
  },
  {
    name: 'Users can upload to their workspace',
    operation: 'INSERT',
    definition: `
      bucket_id = 'media-uploads'
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT w.id
        FROM public.workspaces w
        JOIN public.user_organizations uo ON uo.org_id = w.org_id
        WHERE uo.user_id = auth.uid()
      )
    `,
  },
  {
    name: 'Users can update their own files',
    operation: 'UPDATE',
    definition: `bucket_id = 'media-uploads' AND owner = auth.uid()`,
  },
  {
    name: 'Users can delete their own files',
    operation: 'DELETE',
    definition: `bucket_id = 'media-uploads' AND owner = auth.uid()`,
  },
];

async function applyPolicies() {
  try {
    // Enable RLS on storage.objects
    console.log('1. Enabling RLS on storage.objects...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;',
    });

    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.error('   ⚠️  Warning:', rlsError.message);
    } else {
      console.log('   ✅ RLS enabled\n');
    }

    // Create each policy
    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      console.log(`${i + 1}. Creating policy: "${policy.name}"...`);

      const sql = `
        CREATE POLICY "${policy.name}"
        ON storage.objects
        FOR ${policy.operation}
        TO authenticated
        ${policy.operation === 'UPDATE' ? 'USING (' + policy.definition + ') WITH CHECK (' + policy.definition + ')' :
          (policy.operation === 'INSERT' ? 'WITH CHECK (' + policy.definition + ')' :
          'USING (' + policy.definition + ')')}
      `;

      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  Policy already exists (skipping)');
        } else {
          console.error('   ❌ Error:', error.message);
        }
      } else {
        console.log('   ✅ Policy created successfully');
      }
      console.log('');
    }

    // Verify policies were created
    console.log('📊 Verifying policies...');
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND (
            policyname = 'Users can view files in their workspace'
            OR policyname = 'Users can upload to their workspace'
            OR policyname = 'Users can update their own files'
            OR policyname = 'Users can delete their own files'
          );
      `,
    });

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      const count = verifyData?.[0]?.policy_count || 0;
      console.log(`   Found ${count}/4 policies`);

      if (count === 4) {
        console.log('\n✅ All storage RLS policies applied successfully!');
      } else {
        console.log('\n⚠️  Not all policies were created. Please check the errors above.');
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
applyPolicies();
