/**
 * Knowledge Graph API
 *
 * Phase: D53 - Knowledge Graph + SOP/Playbook Engine
 *
 * Routes:
 * - GET /api/synthex/knowledge - List nodes
 * - POST /api/synthex/knowledge - Create node
 *
 * Query Params:
 * - action=get&id=<node-id> - Get specific node
 * - action=neighbors&id=<node-id>&direction=<dir> - Get neighbors
 * - action=create_edge - Create edge
 * - action=delete_edge&edge_id=<id> - Delete edge
 * - action=update&id=<node-id> - Update node
 * - action=delete&id=<node-id> - Delete node
 * - node_type=<type> - Filter by type
 * - parent_id=<id> - Filter by parent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createKnowledgeNode,
  getKnowledgeNode,
  listKnowledgeNodes,
  updateKnowledgeNode,
  deleteKnowledgeNode,
  createKnowledgeEdge,
  getNodeNeighbors,
  deleteKnowledgeEdge,
  CreateNodeInput,
  CreateEdgeInput,
  NodeType,
} from '@/lib/synthex/knowledgePlaybookService';

// =============================================================================
// GET - List nodes, get node, get neighbors
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user metadata or organizations
    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific node
    if (action === 'get' && id) {
      const node = await getKnowledgeNode(tenantId, id);
      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      return NextResponse.json({ node });
    }

    // Get neighbors
    if (action === 'neighbors' && id) {
      const direction = (request.nextUrl.searchParams.get('direction') || 'both') as 'outgoing' | 'incoming' | 'both';
      const neighbors = await getNodeNeighbors(id, direction);
      return NextResponse.json({ neighbors });
    }

    // List nodes
    const nodeType = request.nextUrl.searchParams.get('node_type') as NodeType | null;
    const parentId = request.nextUrl.searchParams.get('parent_id');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const nodes = await listKnowledgeNodes(tenantId, {
      nodeType: nodeType || undefined,
      parentId: parentId || undefined,
      limit,
    });

    return NextResponse.json({ nodes });
  } catch (error: unknown) {
    console.error('GET /api/synthex/knowledge error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch knowledge graph' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create node, create edge, update node, delete node, delete edge
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Create node
    if (!action || action === 'create') {
      const input: CreateNodeInput = {
        name: body.name,
        node_type: body.node_type,
        description: body.description,
        content: body.content,
        metadata: body.metadata,
        parent_id: body.parent_id,
      };

      if (!input.name || !input.node_type) {
        return NextResponse.json(
          { error: 'name and node_type are required' },
          { status: 400 }
        );
      }

      const node = await createKnowledgeNode(tenantId, input);
      return NextResponse.json({ node }, { status: 201 });
    }

    // Create edge
    if (action === 'create_edge') {
      const input: CreateEdgeInput = {
        from_node_id: body.from_node_id,
        to_node_id: body.to_node_id,
        edge_type: body.edge_type,
        weight: body.weight,
        properties: body.properties,
      };

      if (!input.from_node_id || !input.to_node_id || !input.edge_type) {
        return NextResponse.json(
          { error: 'from_node_id, to_node_id, and edge_type are required' },
          { status: 400 }
        );
      }

      const edge = await createKnowledgeEdge(tenantId, input);
      return NextResponse.json({ edge }, { status: 201 });
    }

    // Update node
    if (action === 'update') {
      const nodeId = request.nextUrl.searchParams.get('id') || body.node_id;
      if (!nodeId) {
        return NextResponse.json({ error: 'node_id is required' }, { status: 400 });
      }

      const updates = {
        name: body.name,
        description: body.description,
        content: body.content,
        metadata: body.metadata,
        parent_id: body.parent_id,
      };

      const node = await updateKnowledgeNode(tenantId, nodeId, updates);
      return NextResponse.json({ node });
    }

    // Delete node
    if (action === 'delete') {
      const nodeId = request.nextUrl.searchParams.get('id') || body.node_id;
      if (!nodeId) {
        return NextResponse.json({ error: 'node_id is required' }, { status: 400 });
      }

      await deleteKnowledgeNode(tenantId, nodeId);
      return NextResponse.json({ success: true });
    }

    // Delete edge
    if (action === 'delete_edge') {
      const edgeId = request.nextUrl.searchParams.get('edge_id') || body.edge_id;
      if (!edgeId) {
        return NextResponse.json({ error: 'edge_id is required' }, { status: 400 });
      }

      await deleteKnowledgeEdge(tenantId, edgeId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/synthex/knowledge error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage knowledge graph' },
      { status: 500 }
    );
  }
}
