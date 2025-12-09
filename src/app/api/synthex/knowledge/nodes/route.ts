/**
 * Synthex Knowledge Graph Nodes API
 * Phase B29: Knowledge Graph Engine
 *
 * GET  - List nodes for tenant
 * POST - Create a new node
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createNode,
  getAllNodes,
  getNodesByType,
  getNode,
  updateNode,
  deleteNode,
  type NodeType,
} from '@/lib/synthex/knowledgeGraphService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const nodeType = searchParams.get('type') as NodeType | null;
    const nodeId = searchParams.get('nodeId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get single node if nodeId provided
    if (nodeId) {
      const node = await getNode(tenantId, nodeId);
      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      return NextResponse.json({ node });
    }

    // Get nodes by type or all nodes
    const nodes = nodeType
      ? await getNodesByType(tenantId, nodeType, limit)
      : await getAllNodes(tenantId, limit);

    return NextResponse.json({ nodes, count: nodes.length });
  } catch (error) {
    console.error('Error in knowledge nodes GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, node_type, label, properties, importance_score, source_type, source_id } = body;

    if (!tenant_id || !node_type || !label) {
      return NextResponse.json(
        { error: 'tenant_id, node_type, and label are required' },
        { status: 400 }
      );
    }

    const node = await createNode({
      tenant_id,
      node_type,
      label,
      properties,
      importance_score,
      source_type,
      source_id,
    });

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Error in knowledge nodes POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, node_id, label, properties, importance_score } = body;

    if (!tenant_id || !node_id) {
      return NextResponse.json(
        { error: 'tenant_id and node_id are required' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (label !== undefined) {
updates.label = label;
}
    if (properties !== undefined) {
updates.properties = properties;
}
    if (importance_score !== undefined) {
updates.importance_score = importance_score;
}

    const node = await updateNode(tenant_id, node_id, updates);

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Error in knowledge nodes PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const nodeId = searchParams.get('nodeId');

    if (!tenantId || !nodeId) {
      return NextResponse.json(
        { error: 'tenantId and nodeId are required' },
        { status: 400 }
      );
    }

    await deleteNode(tenantId, nodeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in knowledge nodes DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
