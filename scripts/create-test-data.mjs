#!/usr/bin/env node

/**
 * Create Test Data for Mindmap Feature
 * Creates workspace, project, mindmap, and sample nodes
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
const ORG_ID = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';

console.log('\n🚀 Creating Test Data for Mindmap Feature\n');
console.log('='.repeat(60));

async function createTestData() {
  try {
    // Step 1: Check/Get workspace
    console.log('\n1️⃣  Checking workspace...');
    let { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', ORG_ID)
      .limit(1);

    let workspaceId;
    if (!workspaces || workspaces.length === 0) {
      console.log('⚠️  No workspace found, creating one...');
      const { data: newWorkspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: 'Default Workspace',
          org_id: ORG_ID,
          created_by: USER_ID
        })
        .select()
        .single();

      if (error) throw error;
      workspaceId = newWorkspace.id;
      console.log(`✅ Created workspace: ${workspaceId}`);
    } else {
      workspaceId = workspaces[0].id;
      console.log(`✅ Using existing workspace: ${workspaceId} (${workspaces[0].name})`);
    }

    // Step 2: Create test project
    console.log('\n2️⃣  Creating test project...');

    // First, try to use existing project
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(1);

    let project;
    if (existingProjects && existingProjects.length > 0) {
      project = existingProjects[0];
      console.log(`✅ Using existing project: ${project.id}`);
      console.log(`   Title: ${project.title || project.name || 'Unnamed'}`);
    } else {
      // Create new project - try both schemas
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          org_id: ORG_ID,
          workspace_id: workspaceId,
          title: 'Demo E-Commerce Platform',
          client_name: 'Acme Corporation',
          description: 'A full-featured e-commerce platform with shopping cart, payment processing, and admin dashboard',
          status: 'on-track',
          priority: 'high',
          progress: 25
        })
        .select()
        .single();

      if (projectError) throw projectError;
      project = newProject;
      console.log(`✅ Created project: ${project.id}`);
      console.log(`   Title: ${project.title}`);
    }

    // Step 3: Create mindmap
    console.log('\n3️⃣  Creating mindmap...');
    const { data: mindmap, error: mindmapError } = await supabase
      .from('project_mindmaps')
      .insert({
        project_id: project.id,
        workspace_id: workspaceId,
        org_id: ORG_ID,
        version: 1,
        created_by: USER_ID,
        last_updated_by: USER_ID
      })
      .select()
      .single();

    if (mindmapError) throw mindmapError;
    console.log(`✅ Created mindmap: ${mindmap.id}`);

    // Step 4: Create root node
    console.log('\n4️⃣  Creating root node...');
    const { data: rootNode, error: rootError } = await supabase
      .from('mindmap_nodes')
      .insert({
        mindmap_id: mindmap.id,
        node_type: 'project_root',
        label: 'Demo E-Commerce Platform',
        description: 'A full-featured e-commerce platform',
        position_x: 400,
        position_y: 50,
        status: 'in_progress',
        priority: 9
      })
      .select()
      .single();

    if (rootError) throw rootError;
    console.log(`✅ Created root node: ${rootNode.id}`);

    // Step 5: Create sample feature nodes
    console.log('\n5️⃣  Creating sample feature nodes...');

    const features = [
      { label: 'Shopping Cart', x: 200, y: 200, desc: 'Add items, update quantities, calculate totals' },
      { label: 'Payment Gateway', x: 400, y: 200, desc: 'Stripe integration for secure payments' },
      { label: 'Product Catalog', x: 600, y: 200, desc: 'Browse products with search and filters' },
    ];

    const featureNodes = [];
    for (const feature of features) {
      const { data: node, error } = await supabase
        .from('mindmap_nodes')
        .insert({
          mindmap_id: mindmap.id,
          parent_id: rootNode.id,
          node_type: 'feature',
          label: feature.label,
          description: feature.desc,
          position_x: feature.x,
          position_y: feature.y,
          status: 'pending',
          priority: 7
        })
        .select()
        .single();

      if (error) throw error;
      featureNodes.push(node);
      console.log(`   ✅ Created: ${feature.label}`);
    }

    // Step 6: Create connections
    console.log('\n6️⃣  Creating connections...');
    for (const node of featureNodes) {
      const { error } = await supabase
        .from('mindmap_connections')
        .insert({
          mindmap_id: mindmap.id,
          source_node_id: rootNode.id,
          target_node_id: node.id,
          connection_type: 'part_of',
          strength: 8
        });

      if (error) throw error;
      console.log(`   ✅ Connected: ${rootNode.label} → ${node.label}`);
    }

    // Step 7: Create sample AI suggestion
    console.log('\n7️⃣  Creating sample AI suggestion...');
    const { data: suggestion, error: suggError } = await supabase
      .from('ai_suggestions')
      .insert({
        mindmap_id: mindmap.id,
        node_id: featureNodes[0].id,
        suggestion_type: 'add_feature',
        suggestion_text: 'Consider adding a wishlist feature for better user engagement',
        reasoning: 'E-commerce platforms with wishlists see 30% higher conversion rates',
        confidence_score: 0.85,
        status: 'pending'
      })
      .select()
      .single();

    if (suggError) throw suggError;
    console.log(`✅ Created AI suggestion: ${suggestion.id}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 SUCCESS! Test data created!\n');
    console.log('📊 Summary:');
    console.log(`   Workspace: ${workspaceId}`);
    console.log(`   Project: ${project.id}`);
    console.log(`   Mindmap: ${mindmap.id}`);
    console.log(`   Nodes: 4 (1 root + 3 features)`);
    console.log(`   Connections: 3`);
    console.log(`   AI Suggestions: 1`);
    console.log('\n🌐 Open in browser:');
    console.log(`   http://localhost:3008/dashboard/projects/${project.id}/mindmap\n`);
    console.log('='.repeat(60) + '\n');

    return {
      workspaceId,
      projectId: project.id,
      mindmapId: mindmap.id,
      rootNodeId: rootNode.id
    };

  } catch (error) {
    console.error('\n❌ Error creating test data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestData();
