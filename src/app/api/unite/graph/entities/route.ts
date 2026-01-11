/**
 * Knowledge Graph Entities API
 * Phase: D70 - Unite Knowledge Graph Core
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createEntity,
  listEntities,
  getEntity,
  updateEntity,
  deleteEntity,
  type Entity,
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

    const entityId = request.nextUrl.searchParams.get('entity_id');

    // Get single entity
    if (entityId) {
      const entity = await getEntity(entityId);
      if (!entity) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }
      // Verify tenant access
      if (entity.tenant_id && entity.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ entity });
    }

    // List entities with filters
    const filters = {
      tenant_id: tenantId,
      type: request.nextUrl.searchParams.get('type') || undefined,
      name: request.nextUrl.searchParams.get('name') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const entities = await listEntities(filters);
    return NextResponse.json({ entities });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch entities' },
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
    const { action, entity_id, type, name, properties } = body;

    // Create entity
    if (action === 'create') {
      if (!type || !name) {
        return NextResponse.json(
          { error: 'type and name are required' },
          { status: 400 }
        );
      }

      const entity = await createEntity({
        type,
        name,
        properties: properties || {},
        tenant_id: tenantId,
      });

      return NextResponse.json({ entity }, { status: 201 });
    }

    // Update entity
    if (action === 'update') {
      if (!entity_id) {
        return NextResponse.json(
          { error: 'entity_id is required for update' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getEntity(entity_id);
      if (!existing) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates: Partial<Omit<Entity, 'id' | 'created_at' | 'updated_at'>> = {};
      if (type) updates.type = type;
      if (name) updates.name = name;
      if (properties) updates.properties = properties;

      const entity = await updateEntity(entity_id, updates);
      return NextResponse.json({ entity });
    }

    // Delete entity
    if (action === 'delete') {
      if (!entity_id) {
        return NextResponse.json(
          { error: 'entity_id is required for delete' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getEntity(entity_id);
      if (!existing) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await deleteEntity(entity_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process entity operation' },
      { status: 500 }
    );
  }
}
