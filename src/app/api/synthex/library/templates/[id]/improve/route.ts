/**
 * Synthex Template Improvement API
 * Phase D05: Template Intelligence
 *
 * POST - Generate improvements or rewrite template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTemplate } from '@/lib/synthex/templateService';
import {
  suggestImprovements,
  rewriteTemplate,
  type InsightType,
} from '@/lib/synthex/templateAIService';

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
    const {
      mode = 'suggestions', // 'suggestions' | 'rewrite'
      focusAreas = ['clarity', 'engagement', 'conversion'],
      objective = 'clarity', // For rewrite mode
    } = body;

    // Get template
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (mode === 'rewrite') {
      const result = await rewriteTemplate(template.content, objective);
      return NextResponse.json({
        success: true,
        mode: 'rewrite',
        objective,
        original: template.content,
        ...result,
      });
    }

    // Default: suggestions mode
    const improvements = await suggestImprovements(
      template.content,
      focusAreas as InsightType[]
    );

    return NextResponse.json({
      success: true,
      mode: 'suggestions',
      focusAreas,
      improvements,
    });
  } catch (error) {
    console.error('[Template Improve API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate improvements' },
      { status: 500 }
    );
  }
}
