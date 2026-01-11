/**
 * Search API
 *
 * Phase: D58 - Global Search & Knowledge Graph
 *
 * Routes:
 * - GET /api/unite/search - Search entities
 * - POST /api/unite/search - Index entity
 *
 * Query Params:
 * - action=analytics - Get search analytics
 * - action=expand - AI expand query
 * - action=delete&entity_type=<type>&entity_id=<id> - Remove from index
 * - q=<query> - Search query
 * - entity_types=<type1,type2> - Filter by entity types
 * - limit=<number> - Limit results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  searchEntities,
  indexEntity,
  removeFromIndex,
  getSearchAnalytics,
  aiExpandQuery,
  IndexEntityInput,
} from '@/lib/unite/searchService';

// =============================================================================
// GET - Search, analytics, expand query
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

    // Get search analytics
    if (action === 'analytics') {
      const startDate = request.nextUrl.searchParams.get('start_date') || undefined;
      const endDate = request.nextUrl.searchParams.get('end_date') || undefined;
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '1000', 10);

      const analytics = await getSearchAnalytics(tenantId, {
        startDate,
        endDate,
        limit,
      });

      return NextResponse.json({ analytics });
    }

    // AI expand query
    if (action === 'expand') {
      const query = request.nextUrl.searchParams.get('q');
      if (!query) {
        return NextResponse.json({ error: 'q parameter is required' }, { status: 400 });
      }

      const expanded = await aiExpandQuery(query);
      return NextResponse.json({ expanded });
    }

    // Search entities
    const query = request.nextUrl.searchParams.get('q');
    if (!query) {
      return NextResponse.json({ error: 'q parameter is required' }, { status: 400 });
    }

    const entityTypesParam = request.nextUrl.searchParams.get('entity_types');
    const entityTypes = entityTypesParam ? entityTypesParam.split(',') : undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);

    const results = await searchEntities(tenantId, query, {
      entity_types: entityTypes,
      limit,
    });

    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('GET /api/unite/search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Index entity, remove from index
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

    // Remove from index
    if (action === 'delete') {
      const entityType = request.nextUrl.searchParams.get('entity_type') || body.entity_type;
      const entityId = request.nextUrl.searchParams.get('entity_id') || body.entity_id;

      if (!entityType || !entityId) {
        return NextResponse.json(
          { error: 'entity_type and entity_id are required' },
          { status: 400 }
        );
      }

      await removeFromIndex(tenantId, entityType, entityId);
      return NextResponse.json({ success: true });
    }

    // Index entity
    const input: IndexEntityInput = {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      title: body.title,
      summary: body.summary,
      content: body.content,
      tags: body.tags,
      extra: body.extra,
    };

    if (!input.entity_type || !input.entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    const indexed = await indexEntity(tenantId, input);
    return NextResponse.json({ indexed }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/unite/search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to index entity' },
      { status: 500 }
    );
  }
}
