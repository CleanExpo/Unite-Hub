#!/usr/bin/env node

/**
 * Check User Organization Data
 *
 * This script checks if the user has organizations in the database
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserOrganization() {
  console.log('🔍 Checking User Organization Data\n');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.users.length} user(s)\n`);

    for (const user of users.users) {
      console.log(`\n👤 User: ${user.email} (${user.id})`);

      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('   ❌ No profile found');
      } else {
        console.log(`   ✅ Profile: ${profile.full_name}`);
      }

      // Check user organizations
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('id, org_id, role, is_active')
        .eq('user_id', user.id);

      if (userOrgsError) {
        console.log('   ❌ Error fetching user_organizations:', userOrgsError.message);
      } else if (!userOrgs || userOrgs.length === 0) {
        console.log('   ⚠️  No organizations found for this user');
      } else {
        console.log(`   ✅ Found ${userOrgs.length} organization(s):`);

        for (const userOrg of userOrgs) {
          // Get organization details
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, email, plan, status')
            .eq('id', userOrg.org_id)
            .single();

          if (orgError) {
            console.log(`      ❌ Org ${userOrg.org_id}: Error fetching - ${orgError.message}`);
          } else {
            console.log(`      ✅ Org: ${org.name} (${org.id})`);
            console.log(`         Email: ${org.email}`);
            console.log(`         Plan: ${org.plan}, Status: ${org.status}`);
            console.log(`         Role: ${userOrg.role}, Active: ${userOrg.is_active}`);
          }

          // Check workspace
          const { data: workspaces, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id, name')
            .eq('org_id', userOrg.org_id);

          if (workspaceError) {
            console.log(`      ❌ Error fetching workspaces: ${workspaceError.message}`);
          } else if (!workspaces || workspaces.length === 0) {
            console.log('      ⚠️  No workspaces found for this org');
          } else {
            console.log(`      ✅ Workspaces: ${workspaces.map(w => w.name).join(', ')}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

checkUserOrganization();
