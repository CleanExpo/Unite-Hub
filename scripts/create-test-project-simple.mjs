#!/usr/bin/env node

/**
 * Create Test Project - Simple Direct Insert
 * Bypasses schema cache by using service role with minimal fields
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const USER_ID = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
const ORG_ID = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';
const WORKSPACE_ID = 'process.env.TEST_WORKSPACE_ID || "YOUR_WORKSPACE_ID"';

async function main() {
  console.log('🚀 Creating test project...\n');

  try {
    // Create project with only required fields
    console.log('📍 Step 1: Creating project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: ORG_ID,
        workspace_id: WORKSPACE_ID,
        created_by: USER_ID,
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    console.log('✅ Project created:', project.id);

    // Update with full details
    console.log('\n📍 Step 2: Updating project details...');
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        title: 'Demo E-Commerce Platform',
        client_name: 'Acme Corporation',
        description: 'A full-featured e-commerce platform with payment processing and inventory management',
        status: 'on-track',
        priority: 'high',
        progress: 25,
      })
      .eq('id', project.id);

    if (updateError) {
      console.warn('⚠️  Update failed, but project exists:', updateError.message);
    } else {
      console.log('✅ Project updated with details');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS!');
    console.log('='.repeat(60));
    console.log('\n📊 Project Details:');
    console.log(`  ID: ${project.id}`);
    console.log(`  Workspace: ${WORKSPACE_ID}`);
    console.log(`  Organization: ${ORG_ID}`);

    console.log('\n🌐 Mindmap URL:');
    console.log(`  https://unite-hub.vercel.app/dashboard/projects/${project.id}/mindmap`);

    console.log('\n💡 Next Steps:');
    console.log('  1. Open the URL above in your browser');
    console.log('  2. The mindmap will auto-create on first access');
    console.log('  3. Start testing the mindmap features!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
