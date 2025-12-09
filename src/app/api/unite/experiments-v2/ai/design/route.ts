/**
 * AI Experiment Design API
 * Phase: D62
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiDesignExperiment } from '@/lib/unite/experimentServiceV2';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { goal, target_area } = body;

    if (!goal || !target_area) {
      return NextResponse.json({ error: 'goal and target_area required' }, { status: 400 });
    }

    const design = await aiDesignExperiment(goal, target_area);
    return NextResponse.json({ design });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
