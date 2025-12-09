/**
 * Runbook AI Generate API
 * Phase: D60
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiGenerateRunbook } from '@/lib/unite/runbookService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { description, category } = body;

    if (!description || !category) {
      return NextResponse.json({ error: 'description and category are required' }, { status: 400 });
    }

    const generated = await aiGenerateRunbook(description, category);
    return NextResponse.json({ generated });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
