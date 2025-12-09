/**
 * Synthex Template Library API
 * Phase D04: Template Library
 *
 * GET - List templates with filters
 * POST - Create a new template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listTemplates,
  createTemplate,
  getTemplateStats,
  type TemplateType,
  type TemplateStatus,
} from '@/lib/synthex/templateService';

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

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const filters = {
      category_id: searchParams.get('categoryId') || undefined,
      template_type: searchParams.get('type') as TemplateType | undefined,
      status: searchParams.get('status') as TemplateStatus | undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '100', 10),
    };

    // Check if stats requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getTemplateStats(tenantId);
      return NextResponse.json({ stats });
    }

    const templates = await listTemplates(tenantId, filters);

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('[Template Library API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list templates' },
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

    const body = await request.json();
    const { tenantId, ...templateData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!templateData.title || !templateData.template_type || !templateData.content) {
      return NextResponse.json(
        { error: 'title, template_type, and content are required' },
        { status: 400 }
      );
    }

    const template = await createTemplate(tenantId, templateData, user.id);

    return NextResponse.json({
      success: true,
      template,
    }, { status: 201 });
  } catch (error) {
    console.error('[Template Library API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}
