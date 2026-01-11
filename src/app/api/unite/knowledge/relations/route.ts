/**
 * Knowledge Graph Relations API
 *
 * Phase: D58 - Global Search & Knowledge Graph
 *
 * Routes:
 * - GET /api/unite/knowledge/relations - List edges
 * - POST /api/unite/knowledge/relations - Create edge
 *
 * Query Params:
 * - action=get&id=<edge-id> - Get specific edge
 * - action=neighbors - Get neighbors
 * - action=stats - Get graph stats
 * - action=discover - AI discover relationships
 * - action=delete&id=<edge-id> - Delete edge
 * - from_type=<type> - Filter by from_type
 * - from_id=<id> - Filter by from_id
 * - to_type=<type> - Filter by to_type
 * - to_id=<id> - Filter by to_id
 * - relation=<relation> - Filter by relation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEdge,
  getEdge,
  listEdges,
  deleteEdge,
  getNeighbors,
  getGraphStats,
  aiDiscoverRelationships,
  CreateEdgeInput,
} from '@/lib/unite/knowledgeGraphService';

// =============================================================================
// GET - List edges, get edge, neighbors, stats
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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific edge
    if (action === 'get' && id) {
      const edge = await getEdge(tenantId, id);
      if (!edge) {
        return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
      }
      return NextResponse.json({ edge });
    }

    // Get neighbors
    if (action === 'neighbors') {
      const entityType = request.nextUrl.searchParams.get('entity_type');
      const entityId = request.nextUrl.searchParams.get('entity_id');
      const depth = parseInt(request.nextUrl.searchParams.get('depth') || '1', 10);

      if (!entityType || !entityId) {
        return NextResponse.json(
          { error: 'entity_type and entity_id are required' },
          { status: 400 }
        );
      }

      const neighbors = await getNeighbors(tenantId, entityType, entityId, depth);
      return NextResponse.json({ neighbors });
    }

    // Get graph stats
    if (action === 'stats') {
      const stats = await getGraphStats(tenantId);
      return NextResponse.json({ stats });
    }

    // List edges
    const fromType = request.nextUrl.searchParams.get('from_type') || undefined;
    const fromId = request.nextUrl.searchParams.get('from_id') || undefined;
    const toType = request.nextUrl.searchParams.get('to_type') || undefined;
    const toId = request.nextUrl.searchParams.get('to_id') || undefined;
    const relation = request.nextUrl.searchParams.get('relation') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const edges = await listEdges(tenantId, {
      from_type: fromType,
      from_id: fromId,
      to_type: toType,
      to_id: toId,
      relation,
      limit,
    });

    return NextResponse.json({ edges });
  } catch (error: unknown) {
    console.error('GET /api/unite/knowledge/relations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch relations' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create edge, delete edge, discover relationships
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
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Delete edge
    if (action === 'delete') {
      const edgeId = request.nextUrl.searchParams.get('id') || body.edge_id;
      if (!edgeId) {
        return NextResponse.json({ error: 'edge_id is required' }, { status: 400 });
      }

      await deleteEdge(tenantId, edgeId);
      return NextResponse.json({ success: true });
    }

    // AI discover relationships
    if (action === 'discover') {
      const { entity_type, entity_id, entity_context } = body;

      if (!entity_type || !entity_id || !entity_context) {
        return NextResponse.json(
          { error: 'entity_type, entity_id, and entity_context are required' },
          { status: 400 }
        );
      }

      const discovered = await aiDiscoverRelationships(
        tenantId,
        entity_type,
        entity_id,
        entity_context
      );

      return NextResponse.json({ discovered });
    }

    // Create edge
    const input: CreateEdgeInput = {
      from_type: body.from_type,
      from_id: body.from_id,
      to_type: body.to_type,
      to_id: body.to_id,
      relation: body.relation,
      weight: body.weight,
      metadata: body.metadata,
    };

    if (
      !input.from_type ||
      !input.from_id ||
      !input.to_type ||
      !input.to_id ||
      !input.relation
    ) {
      return NextResponse.json(
        { error: 'from_type, from_id, to_type, to_id, and relation are required' },
        { status: 400 }
      );
    }

    const edge = await createEdge(tenantId, input);
    return NextResponse.json({ edge }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/unite/knowledge/relations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage relations' },
      { status: 500 }
    );
  }
}
