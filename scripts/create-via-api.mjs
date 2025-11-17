#!/usr/bin/env node

/**
 * Create Workspace, Project, and Mindmap via API
 *
 * This bypasses Supabase schema cache issues by using the REST API
 * which doesn't rely on cached schema.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const USER_ID = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
const ORG_ID = 'adedf006-ca69-47d4-adbf-fc91bd7f225d';

async function createWorkspace() {
  console.log('📍 Step 1: Creating workspace...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/workspaces`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      name: 'Default Workspace',
      org_id: ORG_ID,
      created_by: USER_ID
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to create workspace:', error);

    // Try to get existing workspace
    const getResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/workspaces?org_id=eq.${ORG_ID}&select=*&limit=1`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      }
    );

    if (getResponse.ok) {
      const workspaces = await getResponse.json();
      if (workspaces.length > 0) {
        console.log('✅ Using existing workspace:', workspaces[0].id);
        return workspaces[0];
      }
    }

    throw new Error('Failed to create or find workspace');
  }

  const [workspace] = await response.json();
  console.log('✅ Workspace created:', workspace.id);
  return workspace;
}

async function createProject(workspaceId) {
  console.log('\n📍 Step 2: Creating project...');

  // Use RPC call to bypass cache
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_project`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_org_id: ORG_ID,
      p_workspace_id: workspaceId,
      p_title: 'Demo E-Commerce Platform',
      p_client_name: 'Acme Corporation',
      p_description: 'A full-featured e-commerce platform',
      p_status: 'on-track',
      p_priority: 'high'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ RPC not available, using direct insert...');

    // Fallback: Try direct REST API with minimal fields
    const fallbackResponse = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        org_id: ORG_ID
      })
    });

    if (!fallbackResponse.ok) {
      throw new Error('Failed to create project: ' + await fallbackResponse.text());
    }

    const [project] = await fallbackResponse.json();

    // Update with other fields
    await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${project.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        title: 'Demo E-Commerce Platform',
        client_name: 'Acme Corporation',
        description: 'A full-featured e-commerce platform',
        status: 'on-track',
        priority: 'high',
        progress: 25
      })
    });

    console.log('✅ Project created:', project.id);
    return project;
  }

  const projectId = await response.json();
  console.log('✅ Project created:', projectId);
  return { id: projectId };
}

async function createMindmap(projectId, workspaceId) {
  console.log('\n📍 Step 3: Creating mindmap...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/project_mindmaps`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      project_id: projectId,
      workspace_id: workspaceId,
      org_id: ORG_ID,
      version: 1,
      created_by: USER_ID,
      last_updated_by: USER_ID
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create mindmap: ' + await response.text());
  }

  const [mindmap] = await response.json();
  console.log('✅ Mindmap created:', mindmap.id);
  return mindmap;
}

async function createRootNode(mindmapId) {
  console.log('\n📍 Step 4: Creating root node...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/mindmap_nodes`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      mindmap_id: mindmapId,
      node_type: 'project_root',
      label: 'Demo E-Commerce Platform',
      description: 'A full-featured e-commerce platform',
      position_x: 400,
      position_y: 50,
      created_by: USER_ID
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create root node: ' + await response.text());
  }

  const [node] = await response.json();
  console.log('✅ Root node created:', node.id);
  return node;
}

async function main() {
  console.log('🚀 Creating workspace, project, and mindmap via API...\n');

  try {
    const workspace = await createWorkspace();
    const project = await createProject(workspace.id);
    const mindmap = await createMindmap(project.id, workspace.id);
    const rootNode = await createRootNode(mindmap.id);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  Workspace: ${workspace.id}`);
    console.log(`  Project: ${project.id}`);
    console.log(`  Mindmap: ${mindmap.id}`);
    console.log(`  Root Node: ${rootNode.id}`);

    console.log('\n🌐 Access URL:');
    console.log(`  http://localhost:3008/dashboard/projects/${project.id}/mindmap`);

    console.log('\n💡 Next Steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Navigate to the URL above');
    console.log('  3. Start testing the mindmap!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
