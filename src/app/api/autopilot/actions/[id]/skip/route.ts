/**
 * Skip Autopilot Action API
 * Phase 89: Skip a suggested action
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { skipAction } from '@/lib/autopilot';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id } = await params;

    const success = await skipAction(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to skip action' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Skip action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
