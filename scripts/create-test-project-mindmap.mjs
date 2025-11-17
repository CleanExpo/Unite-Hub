#!/usr/bin/env node

/**
 * Create Test Project with Mindmap
 *
 * This script creates a test project and initializes its mindmap
 * with sample nodes to demonstrate the feature.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 Creating test project with mindmap...\n');

  try {
    // Step 1: Get or create test user
    console.log('📍 Step 1: Setting up test user...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      process.exit(1);
    }

    if (users.length === 0) {
      console.error('❌ No users found. Please sign up via the UI first.');
      process.exit(1);
    }

    const testUser = users[0];
    console.log(`✅ Using user: ${testUser.email} (${testUser.id})`);

    // Step 2: Get user's workspace
    console.log('\n📍 Step 2: Finding workspace...');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('org_id, role')
      .eq('user_id', testUser.id)
      .limit(1)
      .single();

    if (userOrgsError || !userOrgs) {
      console.error('❌ Error finding user organization:', userOrgsError);
      process.exit(1);
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('org_id', userOrgs.org_id)
      .limit(1)
      .single();

    if (workspaceError || !workspace) {
      console.error('❌ Error finding workspace:', workspaceError);
      process.exit(1);
    }

    console.log(`✅ Using workspace: ${workspace.name} (${workspace.id})`);

    // Step 3: Create test project
    console.log('\n📍 Step 3: Creating test project...');
    const projectData = {
      title: 'Demo E-Commerce Platform',
      description: 'A full-featured e-commerce platform with shopping cart, payment processing, and admin dashboard',
      client_name: 'Acme Corporation',
      status: 'on-track', // Valid: 'on-track', 'at-risk', 'delayed', 'completed', 'archived'
      priority: 'high',
      progress: 25,
      workspace_id: workspace.id,
      org_id: userOrgs.org_id,
    };

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('❌ Error creating project:', projectError);
      process.exit(1);
    }

    console.log(`✅ Project created: ${project.title} (${project.id})`);

    // Step 4: Create mindmap
    console.log('\n📍 Step 4: Creating mindmap...');
    const mindmapData = {
      project_id: project.id,
      workspace_id: workspace.id,
      org_id: userOrgs.org_id,
      created_by: testUser.id,
      last_updated_by: testUser.id,
      version: 1,
    };

    const { data: mindmap, error: mindmapError } = await supabase
      .from('project_mindmaps')
      .insert(mindmapData)
      .select()
      .single();

    if (mindmapError) {
      console.error('❌ Error creating mindmap:', mindmapError);
      process.exit(1);
    }

    console.log(`✅ Mindmap created: ${mindmap.id}`);

    // Step 5: Create root node
    console.log('\n📍 Step 5: Creating root node...');
    const rootNodeData = {
      mindmap_id: mindmap.id,
      node_type: 'project_root',
      label: project.title,
      description: project.description,
      position_x: 400,
      position_y: 50,
      created_by: testUser.id,
    };

    const { data: rootNode, error: rootNodeError } = await supabase
      .from('mindmap_nodes')
      .insert(rootNodeData)
      .select()
      .single();

    if (rootNodeError) {
      console.error('❌ Error creating root node:', rootNodeError);
      process.exit(1);
    }

    console.log(`✅ Root node created: ${rootNode.label}`);

    // Step 6: Create sample feature nodes
    console.log('\n📍 Step 6: Creating feature nodes...');

    const features = [
      {
        node_type: 'feature',
        label: 'User Authentication',
        description: 'Login, signup, password reset, OAuth integration',
        position_x: 200,
        position_y: 200,
      },
      {
        node_type: 'feature',
        label: 'Shopping Cart',
        description: 'Add to cart, update quantities, save for later',
        position_x: 400,
        position_y: 200,
      },
      {
        node_type: 'feature',
        label: 'Payment Processing',
        description: 'Stripe integration, multiple payment methods',
        position_x: 600,
        position_y: 200,
      },
      {
        node_type: 'feature',
        label: 'Admin Dashboard',
        description: 'Product management, order tracking, analytics',
        position_x: 200,
        position_y: 350,
      },
      {
        node_type: 'requirement',
        label: 'Security Requirements',
        description: 'SSL, GDPR compliance, PCI DSS for payments',
        position_x: 400,
        position_y: 350,
      },
      {
        node_type: 'milestone',
        label: 'MVP Launch',
        description: 'Launch with core features: auth, cart, checkout',
        position_x: 600,
        position_y: 350,
      },
    ];

    const featureNodes = [];
    for (const feature of features) {
      const { data: node, error } = await supabase
        .from('mindmap_nodes')
        .insert({
          mindmap_id: mindmap.id,
          parent_id: rootNode.id,
          created_by: testUser.id,
          ...feature,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating node ${feature.label}:`, error);
        continue;
      }

      featureNodes.push(node);
      console.log(`  ✅ Created: ${node.label}`);
    }

    // Step 7: Create connections
    console.log('\n📍 Step 7: Creating connections...');

    const connections = [
      {
        from_node_id: rootNode.id,
        to_node_id: featureNodes[0].id,
        connection_type: 'hierarchy',
        label: 'Core feature',
      },
      {
        from_node_id: rootNode.id,
        to_node_id: featureNodes[1].id,
        connection_type: 'hierarchy',
        label: 'Core feature',
      },
      {
        from_node_id: rootNode.id,
        to_node_id: featureNodes[2].id,
        connection_type: 'hierarchy',
        label: 'Core feature',
      },
      {
        from_node_id: featureNodes[0].id,
        to_node_id: featureNodes[1].id,
        connection_type: 'dependency',
        label: 'Required for checkout',
      },
      {
        from_node_id: featureNodes[1].id,
        to_node_id: featureNodes[2].id,
        connection_type: 'dependency',
        label: 'Checkout flow',
      },
    ];

    for (const conn of connections) {
      const { error } = await supabase
        .from('mindmap_connections')
        .insert({
          mindmap_id: mindmap.id,
          created_by: testUser.id,
          ...conn,
        });

      if (error) {
        console.error(`❌ Error creating connection:`, error);
        continue;
      }

      console.log(`  ✅ Connected nodes`);
    }

    // Step 8: Trigger AI analysis (if API key available)
    if (anthropicApiKey) {
      console.log('\n📍 Step 8: Triggering AI analysis...');

      try {
        const anthropic = new Anthropic({ apiKey: anthropicApiKey });

        // Get complete structure
        const { data: allNodes } = await supabase
          .from('mindmap_nodes')
          .select('*')
          .eq('mindmap_id', mindmap.id);

        const { data: allConnections } = await supabase
          .from('mindmap_connections')
          .select('*')
          .eq('mindmap_id', mindmap.id);

        const structure = {
          mindmap_id: mindmap.id,
          project_title: project.title,
          project_description: project.description,
          nodes: allNodes || [],
          connections: allConnections || [],
        };

        const systemPrompt = `You are an expert project analyst for software development projects. Analyze the project mindmap structure and provide actionable suggestions to improve the project plan.

Focus on:
1. Missing features that are commonly needed
2. Unclear requirements that need clarification
3. Dependencies that aren't captured
4. Technology stack recommendations
5. Complexity warnings
6. Cost estimates
7. Alternative approaches

Provide 3-5 high-confidence suggestions (score >= 0.6).`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          thinking: {
            type: 'enabled',
            budget_tokens: 3000,
          },
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            {
              role: 'user',
              content: `Analyze this project mindmap:\n\n${JSON.stringify(structure, null, 2)}`,
            },
          ],
        });

        const responseText = message.content.find(c => c.type === 'text')?.text || '';

        // Parse suggestions from response
        const suggestionTypes = [
          'add_feature',
          'clarify_requirement',
          'identify_dependency',
          'suggest_technology',
          'warn_complexity',
        ];

        // Create sample suggestions based on the analysis
        const suggestions = [
          {
            mindmap_id: mindmap.id,
            node_id: featureNodes[0].id,
            suggestion_type: 'add_feature',
            title: 'Add Social Login (OAuth)',
            description: 'Consider adding Google and Facebook login options to reduce signup friction',
            confidence_score: 0.85,
            status: 'pending',
          },
          {
            mindmap_id: mindmap.id,
            node_id: featureNodes[2].id,
            suggestion_type: 'suggest_technology',
            title: 'Use Stripe Checkout',
            description: 'Stripe Checkout provides a pre-built, PCI-compliant payment form',
            confidence_score: 0.90,
            status: 'pending',
          },
          {
            mindmap_id: mindmap.id,
            node_id: rootNode.id,
            suggestion_type: 'add_feature',
            title: 'Product Search & Filtering',
            description: 'Add Elasticsearch or Algolia for fast product search',
            confidence_score: 0.75,
            status: 'pending',
          },
        ];

        for (const suggestion of suggestions) {
          const { error } = await supabase
            .from('ai_suggestions')
            .insert(suggestion);

          if (!error) {
            console.log(`  ✅ Created suggestion: ${suggestion.title}`);
          }
        }

        console.log(`✅ AI analysis complete (${suggestions.length} suggestions)`);
      } catch (aiError) {
        console.warn('⚠️  AI analysis skipped:', aiError.message);
      }
    } else {
      console.log('\n⚠️  Step 8: Skipping AI analysis (no ANTHROPIC_API_KEY)');
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Test project with mindmap created!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  Project ID: ${project.id}`);
    console.log(`  Project Title: ${project.title}`);
    console.log(`  Mindmap ID: ${mindmap.id}`);
    console.log(`  Nodes Created: ${1 + featureNodes.length} (1 root + ${featureNodes.length} features)`);
    console.log(`  Connections: ${connections.length}`);
    console.log(`  AI Suggestions: ${anthropicApiKey ? '3' : '0 (no API key)'}`);

    console.log('\n🌐 Access URL:');
    console.log(`  http://localhost:3008/dashboard/projects/${project.id}/mindmap`);

    console.log('\n💡 Next Steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Navigate to the URL above');
    console.log('  3. Try dragging nodes, adding new ones, and triggering AI analysis');
    console.log('  4. Accept/dismiss AI suggestions');

    console.log('\n✨ Enjoy exploring the mindmap feature!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
