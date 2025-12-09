/**
 * Synthex Template Generate API
 * Phase D04: Template Library
 *
 * POST - Generate a new template using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateTemplate,
  createTemplate,
  type TemplateType,
} from '@/lib/synthex/templateService';

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
    const {
      tenantId,
      prompt,
      template_type,
      tone,
      length,
      includeVariables = true,
      saveTemplate = false,
      category_id,
      tags,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!prompt || !template_type) {
      return NextResponse.json(
        { error: 'prompt and template_type are required' },
        { status: 400 }
      );
    }

    // Generate template using AI
    const generated = await generateTemplate(
      tenantId,
      prompt,
      template_type as TemplateType,
      { tone, length, includeVariables }
    );

    // Optionally save to database
    let savedTemplate = null;
    if (saveTemplate) {
      savedTemplate = await createTemplate(
        tenantId,
        {
          title: generated.title,
          template_type: template_type as TemplateType,
          content: generated.content,
          variables: generated.variables,
          category_id,
          tags,
          ai_generated: true,
          ai_model: 'claude-sonnet-4-5-20250514',
          ai_prompt: prompt,
          status: 'draft',
        },
        user.id
      );
    }

    return NextResponse.json({
      success: true,
      generated,
      template: savedTemplate,
    }, { status: 201 });
  } catch (error) {
    console.error('[Template Generate API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate template' },
      { status: 500 }
    );
  }
}
