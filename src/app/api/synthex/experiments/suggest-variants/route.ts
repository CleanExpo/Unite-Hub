/**
 * Synthex Experiment Variant Suggestions API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * POST - Get AI-suggested variants for experiment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suggestExperimentVariants } from '@/lib/synthex/experimentService';

interface SuggestVariantsRequest {
  goalDescription: string;
  objectType:
    | 'subject_line'
    | 'email_body'
    | 'cta'
    | 'content_block'
    | 'send_time'
    | 'landing_page'
    | 'form';
  baselineContent: string;
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

    const body: SuggestVariantsRequest = await request.json();
    const { goalDescription, objectType, baselineContent } = body;

    if (!goalDescription || !objectType || !baselineContent) {
      return NextResponse.json(
        { error: 'goalDescription, objectType, and baselineContent are required' },
        { status: 400 }
      );
    }

    const validObjectTypes = [
      'subject_line',
      'email_body',
      'cta',
      'content_block',
      'send_time',
      'landing_page',
      'form',
    ];

    if (!validObjectTypes.includes(objectType)) {
      return NextResponse.json(
        { error: `objectType must be one of: ${validObjectTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const suggestions = await suggestExperimentVariants(
      goalDescription,
      objectType,
      baselineContent
    );

    return NextResponse.json({
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error in suggest-variants POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
