import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getSuggestions } from '@/lib/pairOperator';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionId = req.nextUrl.searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const suggestions = await getSuggestions(sessionId);

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
