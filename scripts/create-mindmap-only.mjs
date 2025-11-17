#!/usr/bin/env node

/**
 * Create Mindmap for Existing Project
 * Assumes a project already exists
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
const ORG_ID = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';
const WORKSPACE_ID = '5a92c7af-5aca-49a7-8866-3bfaa1d04532';

console.log('\n🎨 Creating Mindmap for Existing Project\n');
console.log('='.repeat(60));

async function createMindmap() {
  try {
    // Find or create a project
    console.log('\n1️⃣  Looking for projects...');
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (!projects || projects.length === 0) {
      console.log('⚠️  No projects found.');
      console.log('\n💡 To create a project:');
      console.log('   1. Go to http://localhost:3008/dashboard/projects');
      console.log('   2. Click "New Project" button');
      console.log('   3. Fill in details and save');
      console.log('   4. Then run this script again\n');
      process.exit(0);
    }

    console.log(`✅ Found ${projects.length} projects`);
    projects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title || p.name || 'Unnamed'} (${p.id})`);
    });

    const project = projects[0];
    console.log(`\n✅ Using project: ${project.title || project.name || 'Unnamed'}`);

    // Check if mindmap already exists
    const { data: existingMindmap } = await supabase
      .from('project_mindmaps')
      .select('*')
      .eq('project_id', project.id)
      .single();

    if (existingMindmap) {
      console.log(`\n✅ Mindmap already exists for this project: ${existingMindmap.id}`);
      console.log(`\n🌐 Open in browser:`);
      console.log(`   http://localhost:3008/dashboard/projects/${project.id}/mindmap\n`);
      return;
    }

    // Create mindmap
    console.log('\n2️⃣  Creating mindmap...');
    const { data: mindmap, error: mindmapError } = await supabase
      .from('project_mindmaps')
      .insert({
        project_id: project.id,
        workspace_id: project.workspace_id || WORKSPACE_ID,
        org_id: project.org_id || ORG_ID,
        version: 1,
        created_by: USER_ID,
        last_updated_by: USER_ID
      })
      .select()
      .single();

    if (mindmapError) throw mindmapError;
    console.log(`✅ Created mindmap: ${mindmap.id}`);

    // Create root node
    console.log('\n3️⃣  Creating root node...');
    const { data: rootNode, error: rootError } = await supabase
      .from('mindmap_nodes')
      .insert({
        mindmap_id: mindmap.id,
        node_type: 'project_root',
        label: project.title || project.name || 'Project',
        description: project.description || 'Project root node',
        position_x: 400,
        position_y: 50,
        status: 'in_progress',
        priority: 9
      })
      .select()
      .single();

    if (rootError) throw rootError;
    console.log(`✅ Created root node: ${rootNode.id}`);

    // Create sample features
    console.log('\n4️⃣  Creating sample nodes...');
    const nodes = [
      { type: 'feature', label: 'Feature 1', x: 200, y: 200 },
      { type: 'feature', label: 'Feature 2', x: 400, y: 200 },
      { type: 'feature', label: 'Feature 3', x: 600, y: 200 },
    ];

    const createdNodes = [];
    for (const node of nodes) {
      const { data, error } = await supabase
        .from('mindmap_nodes')
        .insert({
          mindmap_id: mindmap.id,
          parent_id: rootNode.id,
          node_type: node.type,
          label: node.label,
          description: `Sample ${node.type}`,
          position_x: node.x,
          position_y: node.y,
          status: 'pending',
          priority: 5
        })
        .select()
        .single();

      if (error) throw error;
      createdNodes.push(data);
      console.log(`   ✅ Created: ${node.label}`);
    }

    // Create connections
    console.log('\n5️⃣  Creating connections...');
    for (const node of createdNodes) {
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
    }
    console.log(`   ✅ Created ${createdNodes.length} connections`);

    // Create AI suggestion
    console.log('\n6️⃣  Creating sample AI suggestion...');
    const { data: suggestion } = await supabase
      .from('ai_suggestions')
      .insert({
        mindmap_id: mindmap.id,
        node_id: createdNodes[0].id,
        suggestion_type: 'add_feature',
        suggestion_text: 'Consider breaking this down into smaller tasks',
        reasoning: 'Smaller tasks are easier to estimate and track',
        confidence_score: 0.85,
        status: 'pending'
      })
      .select()
      .single();

    console.log(`   ✅ Created AI suggestion: ${suggestion.id}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 SUCCESS! Mindmap created!\n');
    console.log('📊 Summary:');
    console.log(`   Project: ${project.title || project.name} (${project.id})`);
    console.log(`   Mindmap: ${mindmap.id}`);
    console.log(`   Nodes: ${createdNodes.length + 1} (1 root + ${createdNodes.length} features)`);
    console.log(`   Connections: ${createdNodes.length}`);
    console.log(`   AI Suggestions: 1`);
    console.log('\n🌐 Open in browser:');
    console.log(`   http://localhost:3008/dashboard/projects/${project.id}/mindmap\n`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

createMindmap();
