/**
 * Events Annotation API
 * Phase: D67
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { annotateEvent, getAnnotations } from '@/lib/unite/observabilityService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const eventId = request.nextUrl.searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    const annotations = await getAnnotations(eventId);
    return NextResponse.json({ annotations });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { event_id, ...annotationInput } = body;

    if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    const annotation = await annotateEvent(event_id, { ...annotationInput, author_id: user.id });
    return NextResponse.json({ annotation }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
