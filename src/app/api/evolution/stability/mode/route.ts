import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { setStabilityMode } from '@/lib/evolution/stability';

export async function POST(req: NextRequest) {
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

    const { tenantId, mode, reason } = await req.json();
    if (!tenantId || !mode || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await setStabilityMode(tenantId, mode, reason);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
