/**
 * Models API
 * Phase: D76 - Unite Model Governance Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createModel,
  listModels,
  getModel,
  updateModel,
  deleteModel,
  getModelVersions,
  getLatestVersion,
  rollbackToVersion,
} from '@/lib/unite/modelGovernanceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;
    const action = request.nextUrl.searchParams.get('action') || 'list';

    // Get specific model
    if (action === 'get') {
      const name = request.nextUrl.searchParams.get('name');
      const version = request.nextUrl.searchParams.get('version');
      if (!name || !version) {
        return NextResponse.json({ error: 'name and version required' }, { status: 400 });
      }
      const model = await getModel(name, version, tenantId);
      return NextResponse.json({ model });
    }

    // Get versions
    if (action === 'versions') {
      const name = request.nextUrl.searchParams.get('name');
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }
      const versions = await getModelVersions(name, tenantId);
      return NextResponse.json({ versions });
    }

    // Get latest
    if (action === 'latest') {
      const name = request.nextUrl.searchParams.get('name');
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 });
      }
      const model = await getLatestVersion(name, tenantId);
      return NextResponse.json({ model });
    }

    // List models
    const filters = {
      tenant_id: tenantId,
      name: request.nextUrl.searchParams.get('name') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const models = await listModels(filters);
    return NextResponse.json({ models });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
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

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;
    const body = await request.json();
    const { action, name, version, schema_def, constraints, model_id, target_version } = body;

    // Create model
    if (action === 'create' || !action) {
      if (!name || !version || !schema_def) {
        return NextResponse.json(
          { error: 'name, version, schema_def required' },
          { status: 400 }
        );
      }
      const model = await createModel(name, version, schema_def, constraints, tenantId);
      return NextResponse.json({ model }, { status: 201 });
    }

    // Update model
    if (action === 'update') {
      if (!model_id) {
        return NextResponse.json({ error: 'model_id required' }, { status: 400 });
      }
      const updates: { schema_def?: unknown; constraints?: unknown } = {};
      if (schema_def) updates.schema_def = schema_def;
      if (constraints) updates.constraints = constraints;
      const model = await updateModel(model_id, updates, tenantId);
      return NextResponse.json({ model });
    }

    // Delete model
    if (action === 'delete') {
      if (!model_id) {
        return NextResponse.json({ error: 'model_id required' }, { status: 400 });
      }
      const success = await deleteModel(model_id, tenantId);
      return NextResponse.json({ success });
    }

    // Rollback
    if (action === 'rollback') {
      if (!name || !target_version) {
        return NextResponse.json({ error: 'name, target_version required' }, { status: 400 });
      }
      const result = await rollbackToVersion(name, target_version, tenantId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage model' },
      { status: 500 }
    );
  }
}
