/**
 * /api/synthex/content
 *
 * GET: List content for a tenant with filters and pagination.
 * POST: Create new content.
 *
 * Phase: B3 - Synthex Content Library
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listContent,
  createContent,
  getContentStats,
  type ContentType,
  type ContentStatus,
} from '@/lib/synthex/contentService';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const brandId = searchParams.get('brandId');
    const type = searchParams.get('type') as ContentType | null;
    const status = searchParams.get('status') as ContentStatus | null;
    const tagsParam = searchParams.get('tags');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;

    const result = await listContent({
      tenantId,
      brandId: brandId || undefined,
      type: type || undefined,
      status: status || undefined,
      tags,
      limit,
      offset,
    });

    const response: Record<string, unknown> = {
      status: 'ok',
      content: result.content,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore,
      },
    };

    if (includeStats) {
      response.stats = await getContentStats(tenantId, brandId || undefined);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[content] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tenantId,
      brandId,
      title,
      type,
      contentMarkdown,
      contentHtml,
      tags,
      category,
      promptUsed,
      modelVersion,
      generationParams,
      meta,
    } = body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tenantId' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid title' },
        { status: 400 }
      );
    }

    if (!type || !['email', 'blog', 'social', 'image', 'landing_page', 'ad_copy', 'other'].includes(type)) {
      return NextResponse.json(
        { error: 'Missing or invalid type' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    const content = await createContent({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      title,
      type,
      contentMarkdown: contentMarkdown || null,
      contentHtml: contentHtml || null,
      tags: tags || null,
      category: category || null,
      promptUsed: promptUsed || null,
      modelVersion: modelVersion || null,
      generationParams: generationParams || null,
      meta: meta || null,
    });

    return NextResponse.json(
      {
        status: 'ok',
        content,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[content] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
