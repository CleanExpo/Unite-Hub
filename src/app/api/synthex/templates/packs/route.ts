/**
 * Synthex Template Packs API
 * GET /api/synthex/templates/packs - List available packs
 * POST /api/synthex/templates/packs - Create new pack
 * Phase B24: Template Packs & Cross-Business Playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listAvailablePacks,
  createOrUpdatePack,
  type TemplatePackInput,
} from '@/lib/synthex/templatePackService';

/**
 * GET /api/synthex/templates/packs
 * List all available template packs (global, shared, and private)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant ID from query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Get filters from query params
    const category = searchParams.get('category') as any;
    const visibility = searchParams.get('visibility') as any;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;

    const packs = await listAvailablePacks(tenantId, {
      category,
      visibility,
      tags,
    });

    return NextResponse.json({
      success: true,
      data: packs,
    });

  } catch (error) {
    console.error('[Template Packs API] GET Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch template packs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/templates/packs
 * Create a new template pack
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantId, packData } = body as {
      tenantId: string;
      packData: TemplatePackInput;
    };

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!packData || !packData.name || !packData.category) {
      return NextResponse.json(
        { error: 'packData with name and category is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const { data: tenantUser, error: tenantError } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this tenant' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or owner role required' },
        { status: 403 }
      );
    }

    const pack = await createOrUpdatePack(tenantId, packData);

    return NextResponse.json({
      success: true,
      data: pack,
    });

  } catch (error) {
    console.error('[Template Packs API] POST Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template pack' },
      { status: 500 }
    );
  }
}
