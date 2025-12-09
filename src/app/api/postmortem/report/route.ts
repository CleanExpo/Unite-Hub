import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getReport } from '@/lib/postmortem';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const postmortemId = req.nextUrl.searchParams.get('id');
    if (!postmortemId) {
return NextResponse.json({ error: 'id required' }, { status: 400 });
}

    const report = await getReport(postmortemId);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
