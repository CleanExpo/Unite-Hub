/**
 * Synthex Template Marketplace API
 * Phase B34: Template Marketplace
 *
 * GET  - List templates with filters
 * POST - Create a new template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listTemplates,
  createTemplate,
  getPopularTemplates,
  getTemplateCategories,
  getTemplateTypeCounts,
  type TemplateType,
  type TemplateScope,
} from '@/lib/synthex/templateMarketplaceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenantId');

    // Get categories
    if (action === 'categories') {
      const categories = await getTemplateCategories();
      return NextResponse.json({ categories });
    }

    // Get type counts
    if (action === 'counts') {
      const counts = await getTemplateTypeCounts();
      return NextResponse.json({ counts });
    }

    // Get popular templates
    if (action === 'popular') {
      const type = searchParams.get('type') as TemplateType | null;
      const category = searchParams.get('category');
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const templates = await getPopularTemplates(type || undefined, category || undefined, limit);
      return NextResponse.json({ templates, count: templates.length });
    }

    // List templates with filters
    const templates = await listTemplates({
      tenantId: tenantId || undefined,
      userId: user.id,
      scope: searchParams.get('scope') as TemplateScope | undefined,
      type: searchParams.get('type') as TemplateType | undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      search: searchParams.get('search') || undefined,
      isPublic: searchParams.get('public') === 'true' ? true : undefined,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      onlyMine: searchParams.get('mine') === 'true',
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Error in templates/marketplace GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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

    const body = await request.json();
    const {
      tenant_id,
      name,
      type,
      content,
      description,
      category,
      tags,
      scope,
      is_public,
      preview_image_url,
      metadata,
    } = body;

    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'name, type, and content are required' },
        { status: 400 }
      );
    }

    const validTypes = ['email', 'campaign', 'automation', 'journey', 'prompt', 'landing_page'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const template = await createTemplate(
      {
        name,
        type,
        content,
        description,
        category,
        tags,
        scope: scope || 'tenant',
        is_public: is_public || false,
        preview_image_url,
        metadata,
      },
      {
        tenantId: tenant_id,
        userId: user.id,
      }
    );

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error in templates/marketplace POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
