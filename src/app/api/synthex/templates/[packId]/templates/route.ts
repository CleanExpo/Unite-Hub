/**
 * Synthex Pack Templates API
 * GET /api/synthex/templates/[packId]/templates - List templates in pack
 * POST /api/synthex/templates/[packId]/templates - Add template to pack
 * Phase B24: Template Packs & Cross-Business Playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listTemplatesInPack,
  addTemplateToPack,
  type TemplateInput,
} from '@/lib/synthex/templatePackService';

/**
 * GET /api/synthex/templates/[packId]/templates
 * List all templates in a pack
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
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

    const { packId } = await params;

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      );
    }

    // Get filters from query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;

    const templates = await listTemplatesInPack(packId, {
      type,
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    console.error('[Pack Templates API] GET Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synthex/templates/[packId]/templates
 * Add a new template to a pack
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
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

    const { packId } = await params;

    if (!packId) {
      return NextResponse.json(
        { error: 'packId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { templateData } = body as {
      templateData: TemplateInput;
    };

    if (!templateData || !templateData.name || !templateData.type || !templateData.content) {
      return NextResponse.json(
        { error: 'templateData with name, type, and content is required' },
        { status: 400 }
      );
    }

    // Verify pack exists and user has access
    const { data: pack, error: packError } = await supabase
      .from('synthex_template_packs')
      .select('owner_tenant_id')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // If pack has owner_tenant_id, verify user is admin/owner
    if (pack.owner_tenant_id) {
      const { data: tenantUser, error: tenantError } = await supabase
        .from('synthex_tenant_members')
        .select('role')
        .eq('tenant_id', pack.owner_tenant_id)
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
    }

    const template = await addTemplateToPack(packId, templateData);

    return NextResponse.json({
      success: true,
      data: template,
    });

  } catch (error) {
    console.error('[Pack Templates API] POST Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add template' },
      { status: 500 }
    );
  }
}
