/**
 * Knowledge Graph Relationships API
 * Phase: D70 - Unite Knowledge Graph Core
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRelationship,
  listRelationships,
  deleteRelationship,
  getEntityNeighbors,
  getEntity,
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

    // Get neighbors for an entity
    const entityId = request.nextUrl.searchParams.get('entity_id');
    if (entityId) {
      // Verify tenant access to entity
      const entity = await getEntity(entityId);
      if (!entity) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }
      if (entity.tenant_id && entity.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const depth = parseInt(request.nextUrl.searchParams.get('depth') || '1', 10);
      const relationshipTypes = request.nextUrl.searchParams.get('types')?.split(',');

      const neighbors = await getEntityNeighbors(entityId, {
        depth,
        relationship_types: relationshipTypes,
      });

      return NextResponse.json({
        entity_id: entityId,
        neighbors,
      });
    }

    // List relationships with filters
    const filters = {
      tenant_id: tenantId,
      source_id: request.nextUrl.searchParams.get('source_id') || undefined,
      target_id: request.nextUrl.searchParams.get('target_id') || undefined,
      type: request.nextUrl.searchParams.get('type') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const relationships = await listRelationships(filters);
    return NextResponse.json({ relationships });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch relationships' },
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
    const { action, relationship_id, source_id, target_id, type, metadata } = body;

    // Create relationship
    if (action === 'create') {
      if (!source_id || !target_id || !type) {
        return NextResponse.json(
          { error: 'source_id, target_id, and type are required' },
          { status: 400 }
        );
      }

      // Verify tenant access to both entities
      const sourceEntity = await getEntity(source_id);
      const targetEntity = await getEntity(target_id);

      if (!sourceEntity || !targetEntity) {
        return NextResponse.json(
          { error: 'Source or target entity not found' },
          { status: 404 }
        );
      }

      if (
        (sourceEntity.tenant_id && sourceEntity.tenant_id !== tenantId) ||
        (targetEntity.tenant_id && targetEntity.tenant_id !== tenantId)
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const relationship = await createRelationship({
        source_id,
        target_id,
        type,
        metadata: metadata || {},
        tenant_id: tenantId,
      });

      return NextResponse.json({ relationship }, { status: 201 });
    }

    // Delete relationship
    if (action === 'delete') {
      if (!relationship_id) {
        return NextResponse.json(
          { error: 'relationship_id is required for delete' },
          { status: 400 }
        );
      }

      // Verify tenant access via relationship query
      const rels = await listRelationships({
        tenant_id: tenantId,
        limit: 1,
      });

      const hasAccess = rels.some((r) => r.id === relationship_id);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await deleteRelationship(relationship_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process relationship operation' },
      { status: 500 }
    );
  }
}
