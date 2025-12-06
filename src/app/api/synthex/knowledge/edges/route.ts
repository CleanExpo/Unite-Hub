/**
 * Synthex Knowledge Graph Edges API
 * Phase B29: Knowledge Graph Engine
 *
 * GET  - List edges for tenant
 * POST - Create a new edge
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEdge,
  getAllEdges,
  getNeighbors,
  connectEntities,
  type RelationType,
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
    const nodeId = searchParams.get('nodeId');
    const depth = parseInt(searchParams.get('depth') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get neighbors if nodeId is provided
    if (nodeId) {
      const neighbors = await getNeighbors(tenantId, nodeId, depth);
      return NextResponse.json({ neighbors, count: neighbors.length });
    }

    // Get all edges
    const edges = await getAllEdges(tenantId, limit);

    return NextResponse.json({ edges, count: edges.length });
  } catch (error) {
    console.error('Error in knowledge edges GET:', error);
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
    const {
      tenant_id,
      source_node_id,
      target_node_id,
      relation,
      weight,
      metadata,
      confidence,
    } = body;

    if (!tenant_id || !source_node_id || !target_node_id || !relation) {
      return NextResponse.json(
        { error: 'tenant_id, source_node_id, target_node_id, and relation are required' },
        { status: 400 }
      );
    }

    const edge = await createEdge({
      tenant_id,
      source_node_id,
      target_node_id,
      relation: relation as RelationType,
      weight,
      metadata,
      confidence,
    });

    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    console.error('Error in knowledge edges POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Connect two entities (convenience endpoint)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, source_id, target_id, relation, weight } = body;

    if (!tenant_id || !source_id || !target_id || !relation) {
      return NextResponse.json(
        { error: 'tenant_id, source_id, target_id, and relation are required' },
        { status: 400 }
      );
    }

    const edge = await connectEntities(
      tenant_id,
      source_id,
      target_id,
      relation as RelationType,
      weight || 0.5
    );

    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    console.error('Error in knowledge edges PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
