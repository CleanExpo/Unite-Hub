/**
 * Graph Fusion API
 * Phase: D73 - Unite Cross-System Graph Fusion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createGraphSource,
  listGraphSources,
  getGraphSource,
  updateGraphSource,
  deleteGraphSource,
  fuseGraphData,
  listFusionLogs,
  type GraphSource,
} from '@/lib/unite/graphFusionService';

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

    const action = request.nextUrl.searchParams.get('action') || 'sources';

    // List fusion logs
    if (action === 'logs') {
      const filters = {
        tenant_id: tenantId,
        source: request.nextUrl.searchParams.get('source') || undefined,
        operation: request.nextUrl.searchParams.get('operation') || undefined,
        limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
      };

      const logs = await listFusionLogs(filters);
      return NextResponse.json({ logs });
    }

    // Get single source
    const sourceId = request.nextUrl.searchParams.get('source_id');
    if (sourceId) {
      const source = await getGraphSource(sourceId);
      if (!source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      // Verify tenant access
      if (source.tenant_id && source.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ source });
    }

    // List sources
    const filters = {
      tenant_id: tenantId,
      source: request.nextUrl.searchParams.get('source') || undefined,
      enabled: request.nextUrl.searchParams.get('enabled') === 'true' || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const sources = await listGraphSources(filters);
    return NextResponse.json({ sources });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch graph fusion data' },
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
    const { action, source_id, source, config, enabled, data } = body;

    // Create source
    if (action === 'create_source') {
      if (!source) {
        return NextResponse.json({ error: 'source is required' }, { status: 400 });
      }

      const newSource = await createGraphSource({
        source,
        config,
        enabled: enabled !== undefined ? enabled : true,
        tenant_id: tenantId,
      });

      return NextResponse.json({ source: newSource }, { status: 201 });
    }

    // Update source
    if (action === 'update_source') {
      if (!source_id) {
        return NextResponse.json(
          { error: 'source_id is required for update' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getGraphSource(source_id);
      if (!existing) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates: Partial<Omit<GraphSource, 'id' | 'created_at'>> = {};
      if (source) updates.source = source;
      if (config) updates.config = config;
      if (enabled !== undefined) updates.enabled = enabled;

      const updatedSource = await updateGraphSource(source_id, updates);
      return NextResponse.json({ source: updatedSource });
    }

    // Delete source
    if (action === 'delete_source') {
      if (!source_id) {
        return NextResponse.json(
          { error: 'source_id is required for delete' },
          { status: 400 }
        );
      }

      // Verify tenant access
      const existing = await getGraphSource(source_id);
      if (!existing) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      if (existing.tenant_id && existing.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await deleteGraphSource(source_id);
      return NextResponse.json({ success: true });
    }

    // Fuse graph data
    if (action === 'fuse') {
      if (!source_id || !data) {
        return NextResponse.json(
          { error: 'source_id and data are required for fusion' },
          { status: 400 }
        );
      }

      if (!data.entities || !data.relationships) {
        return NextResponse.json(
          { error: 'data must contain entities and relationships arrays' },
          { status: 400 }
        );
      }

      const result = await fuseGraphData(source_id, data, tenantId);
      return NextResponse.json({ result }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process graph fusion operation' },
      { status: 500 }
    );
  }
}
