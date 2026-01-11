/**
 * Experiment Assignment API
 * Phase: D69
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assignVariant } from '@/lib/unite/experimentService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { experiment_key, user_id, anonymous_id } = body;

    if (!experiment_key) {
      return NextResponse.json({ error: 'experiment_key required' }, { status: 400 });
    }

    if (!user_id && !anonymous_id) {
      return NextResponse.json(
        { error: 'Either user_id or anonymous_id required' },
        { status: 400 }
      );
    }

    const result = await assignVariant(experiment_key, user_id, anonymous_id);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
