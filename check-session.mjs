#!/usr/bin/env node

/**
 * Check Current Session State
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const userId = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

async function checkSession() {
  console.log('🔍 Checking Session State\n');

  // Create anon client (same as browser)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check 1: Can we get session?
  console.log('Test 1: Get Session (should be null in Node)');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.log('  ❌ Error:', sessionError.message);
  } else if (session) {
    console.log('  ✅ Session found:', session.user.email);
  } else {
    console.log('  ⚠️  No session (expected in Node.js context)');
  }

  // Check 2: Try to query without auth (should fail with RLS)
  console.log('\nTest 2: Query user_profiles WITHOUT auth (should fail)');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('  ❌ Error:', error.message);
      console.log('     Code:', error.code);
    } else {
      console.log('  ✅ Success (unexpected!):', data.email);
    }
  } catch (e) {
    console.log('  ❌ Exception:', e.message);
  }

  // Check 3: Try with service role (should work)
  console.log('\nTest 3: Query user_profiles WITH service role (should work)');
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Success:', data.email);
    }
  } catch (e) {
    console.log('  ❌ Exception:', e.message);
  }

  // Check 4: Verify organization exists
  console.log('\nTest 4: Check if organization exists for user');
  try {
    const { data: userOrg, error } = await adminClient
      .from('user_organizations')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.log('  ❌ Error:', error.message);
    } else if (userOrg) {
      console.log('  ✅ Organization found:', userOrg.organizations.name);
      console.log('     Role:', userOrg.role);
      console.log('     Org ID:', userOrg.org_id);
    } else {
      console.log('  ⚠️  No organization found for user');
    }
  } catch (e) {
    console.log('  ❌ Exception:', e.message);
  }

  console.log('\n✅ Check complete');
}

checkSession();
