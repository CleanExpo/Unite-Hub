/**
 * Experiment AI Suggestions API
 *
 * Phase: D55 - Global Experimentation & A/B Testing Engine
 *
 * Routes:
 * - POST /api/unite/experiments/ai/suggest - Generate experiment suggestions
 * - POST /api/unite/experiments/ai/analyze - Analyze experiment results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  aiSuggestExperiment,
  aiAnalyzeExperiment,
  getExperiment,
  getExperimentSummary,
} from '@/lib/unite/experimentService';

// =============================================================================
// POST - AI operations
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action') || 'suggest';
    const body = await request.json();

    // AI-suggest experiment
    if (action === 'suggest') {
      const { objective, scope, constraints } = body;

      if (!objective || !scope) {
        return NextResponse.json(
          { error: 'objective and scope are required' },
          { status: 400 }
        );
      }

      const suggestion = await aiSuggestExperiment(tenantId, {
        objective,
        scope,
        constraints,
      });

      return NextResponse.json({ suggestion });
    }

    // AI-analyze experiment
    if (action === 'analyze') {
      const { experiment_id } = body;

      if (!experiment_id) {
        return NextResponse.json({ error: 'experiment_id is required' }, { status: 400 });
      }

      const experiment = await getExperiment(tenantId, experiment_id);
      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
      }

      const summary = await getExperimentSummary(tenantId, experiment_id);
      const analysis = await aiAnalyzeExperiment(experiment, summary);

      return NextResponse.json({ analysis });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/unite/experiments/ai/suggest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
