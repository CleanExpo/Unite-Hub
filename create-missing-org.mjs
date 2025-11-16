#!/usr/bin/env node

/**
 * Create Missing Organization for User
 *
 * This script manually creates an organization for users who don't have one
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createOrganization() {
  console.log('🏢 Creating Missing Organization\n');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    for (const user of users.users) {
      console.log(`\n👤 Checking user: ${user.email}`);

      // Check if user has organizations
      const { data: userOrgs } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id);

      if (userOrgs && userOrgs.length > 0) {
        console.log(`   ✅ User already has ${userOrgs.length} organization(s)`);
        continue;
      }

      console.log('   ⚠️  No organizations found. Creating...');

      // Get user metadata
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      // Create organization (let Supabase generate the UUID)
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${fullName}'s Organization`,
          email: user.email,
          plan: 'starter',
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (orgError) {
        console.error('   ❌ Error creating organization:', orgError);
        continue;
      }

      console.log(`   ✅ Organization created: ${newOrg.id}`);

      // Link user to organization
      const { error: linkError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          org_id: newOrg.id,
          role: 'owner',
          is_active: true,
        });

      if (linkError) {
        console.error('   ❌ Error linking user to organization:', linkError);
        continue;
      }

      console.log('   ✅ User linked to organization as owner');

      // Create default workspace
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          org_id: newOrg.id,
          name: 'Default Workspace',
          description: 'Your main workspace',
        });

      if (workspaceError) {
        console.error('   ⚠️  Error creating workspace:', workspaceError);
      } else {
        console.log('   ✅ Default workspace created');
      }

      console.log('\n   🎉 Organization setup complete!');
    }

    console.log('\n✅ All done!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

createOrganization();
