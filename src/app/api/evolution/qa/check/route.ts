import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { runCheck } from '@/lib/evolution/qa';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId, taskId, checkType } = await req.json();
    if (!tenantId || !taskId || !checkType) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const result = await runCheck(tenantId, taskId, checkType);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
