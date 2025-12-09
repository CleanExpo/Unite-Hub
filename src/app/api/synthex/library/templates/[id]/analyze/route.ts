/**
 * Synthex Template Analysis API
 * Phase D05: Template Intelligence
 *
 * POST - Analyze template and generate insights
 * GET - Get existing insights and scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTemplate } from '@/lib/synthex/templateService';
import {
  analyzeTemplate,
  getInsights,
  getScore,
  getPredictions,
  predictPerformance,
} from '@/lib/synthex/templateAIService';

export async function GET(
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
    const { searchParams } = new URL(request.url);

    // Get template to verify it exists
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Parse filters for insights
    const insightFilters = {
      status: searchParams.get('status') as any,
      severity: searchParams.get('severity') as any,
      insight_type: searchParams.get('type') as any,
    };

    const [insights, score, predictions] = await Promise.all([
      getInsights(id, insightFilters),
      getScore(id),
      getPredictions(id),
    ]);

    return NextResponse.json({
      success: true,
      insights,
      score,
      predictions,
    });
  } catch (error) {
    console.error('[Template Analysis API] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analysis' },
      { status: 500 }
    );
  }
}

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
    const { includePredictions = false } = body;

    // Get template
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Run analysis
    const { insights, score } = await analyzeTemplate(
      template.tenant_id,
      id,
      template.content,
      template.template_type
    );

    // Optionally run predictions
    let predictions = null;
    if (includePredictions) {
      predictions = await predictPerformance(
        template.tenant_id,
        id,
        template.content,
        template.template_type
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template analyzed successfully',
      insights,
      score,
      predictions,
    });
  } catch (error) {
    console.error('[Template Analysis API] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze template' },
      { status: 500 }
    );
  }
}
