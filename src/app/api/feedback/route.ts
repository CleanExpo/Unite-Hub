import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, comment, page, source } = body as {
      rating: 1 | 2 | 3 | 4 | 5;
      comment?: string;
      page?: string;
      source?: string;
    };

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('feedback').insert({
      rating,
      comment: comment ?? null,
      page: page ?? null,
      source: source ?? 'ato',
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Table may not exist yet — silently accept and log
      console.error('[feedback POST]', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
