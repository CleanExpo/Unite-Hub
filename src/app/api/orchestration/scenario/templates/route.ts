/**
 * Scenario Templates API
 * Phase: D79 - Scenario Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTemplate, listTemplates, getTemplate } from '@/lib/orchestration/scenarioEngine';

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

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;
    const action = request.nextUrl.searchParams.get('action') || 'list';

    // Get specific template
    if (action === 'get') {
      const templateId = request.nextUrl.searchParams.get('template_id');
      if (!templateId) {
        return NextResponse.json({ error: 'template_id required' }, { status: 400 });
      }
      const template = await getTemplate(templateId, tenantId);
      return NextResponse.json({ template });
    }

    // List templates
    const filters = {
      tenant_id: tenantId,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const templates = await listTemplates(filters);
    return NextResponse.json({ templates });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

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

    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, variables } = body;

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const template = await createTemplate(name, description, variables || {}, tenantId);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}
