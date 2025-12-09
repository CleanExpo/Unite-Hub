/**
 * Synthex Template Marketplace - Individual Template API
 * Phase B34: Template Marketplace
 *
 * GET   - Get template details with stats
 * POST  - Clone template to tenant
 * PATCH - Update template (if owner)
 * DELETE - Delete template (if owner)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTemplateWithStats,
  cloneTemplateToTenant,
  updateTemplate,
  deleteTemplate,
  recordTemplateUsage,
  suggestTemplateImprovements,
  autoGenerateTags,
} from '@/lib/synthex/templateMarketplaceService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action');

    // Get AI improvement suggestions
    if (action === 'suggestions') {
      const suggestions = await suggestTemplateImprovements(id);
      return NextResponse.json({ suggestions });
    }

    // Auto-generate tags
    if (action === 'auto-tags') {
      const tags = await autoGenerateTags(id);
      return NextResponse.json({ tags });
    }

    // Get template with stats
    const template = await getTemplateWithStats(id);

    // Record view
    if (tenantId) {
      await recordTemplateUsage(id, tenantId, user.id, 'view');
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in templates/marketplace/[id] GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tenant_id, name, content } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required to clone template' },
        { status: 400 }
      );
    }

    const clonedTemplate = await cloneTemplateToTenant(
      id,
      tenant_id,
      user.id,
      {
        name,
        content,
      }
    );

    return NextResponse.json(
      { template: clonedTemplate, message: 'Template cloned successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in templates/marketplace/[id] POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      category,
      tags,
      content,
      is_public,
      preview_image_url,
      metadata,
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
updates.name = name;
}
    if (description !== undefined) {
updates.description = description;
}
    if (category !== undefined) {
updates.category = category;
}
    if (tags !== undefined) {
updates.tags = tags;
}
    if (content !== undefined) {
updates.content = content;
}
    if (is_public !== undefined) {
updates.is_public = is_public;
}
    if (preview_image_url !== undefined) {
updates.preview_image_url = preview_image_url;
}
    if (metadata !== undefined) {
updates.metadata = metadata;
}

    const template = await updateTemplate(id, updates, user.id);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in templates/marketplace/[id] PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await deleteTemplate(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in templates/marketplace/[id] DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
