/**
 * Knowledge Graph Similarity Search API
 * Phase: D70 - Unite Knowledge Graph Core
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  findSimilarEntities,
  getEntity,
  createEmbedding,
  aiAnalyzeGraph,
} from '@/lib/unite/knowledgeGraphService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const action = request.nextUrl.searchParams.get('action') || 'similar';

    // AI-powered graph analysis
    if (action === 'analyze') {
      const entityType = request.nextUrl.searchParams.get('entity_type') || undefined;
      const relationshipType = request.nextUrl.searchParams.get('relationship_type') || undefined;

      const analysis = await aiAnalyzeGraph(tenantId, {
        entity_type: entityType,
        relationship_type: relationshipType,
      });

      return NextResponse.json({ analysis });
    }

    // Find similar entities
    const entityId = request.nextUrl.searchParams.get('entity_id');
    if (!entityId) {
      return NextResponse.json(
        { error: 'entity_id is required for similarity search' },
        { status: 400 }
      );
    }

    // Verify tenant access to entity
    const entity = await getEntity(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    if (entity.tenant_id && entity.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
    const threshold = parseFloat(request.nextUrl.searchParams.get('threshold') || '0.7');

    const similarEntities = await findSimilarEntities(entityId, {
      limit,
      threshold,
    });

    return NextResponse.json({
      entity_id: entityId,
      similar_entities: similarEntities,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform similarity search' },
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

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const { entity_id, text } = body;

    if (!entity_id || !text) {
      return NextResponse.json(
        { error: 'entity_id and text are required to create embedding' },
        { status: 400 }
      );
    }

    // Verify tenant access to entity
    const entity = await getEntity(entity_id);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    if (entity.tenant_id && entity.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const embedding = await createEmbedding(entity_id, tenantId, text);

    return NextResponse.json({ embedding }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create embedding' },
      { status: 500 }
    );
  }
}
