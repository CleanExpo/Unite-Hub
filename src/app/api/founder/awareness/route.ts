import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getAwarenessSnapshots } from '@/lib/situationalAwareness';

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

    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
}

    const snapshots = await getAwarenessSnapshots(tenantId);
    return NextResponse.json({ success: true, snapshots });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
