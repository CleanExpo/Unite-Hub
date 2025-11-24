import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getPatterns } from '@/lib/patternLibrary';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    const category = req.nextUrl.searchParams.get('category') || undefined;
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

    const patterns = await getPatterns(tenantId, category);

    return NextResponse.json({ success: true, patterns });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
