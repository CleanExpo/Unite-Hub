/**
 * Synthex Template Render API
 * Phase D04: Template Library
 *
 * POST - Render a template with variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTemplate,
  renderTemplate,
  trackUsage,
} from '@/lib/synthex/templateService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { variables = {}, context, context_id, trackUsage: shouldTrack = true } = body;

    const template = await getTemplate(id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const rendered = renderTemplate(template.content, variables);

    // Track usage if requested
    if (shouldTrack) {
      await trackUsage(template.tenant_id, id, {
        used_by: user.id,
        context,
        context_id,
        variables_used: variables,
        output_generated: rendered,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      rendered,
      template_title: template.title,
    });
  } catch (error) {
    console.error('[Template Render API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to render template' },
      { status: 500 }
    );
  }
}
