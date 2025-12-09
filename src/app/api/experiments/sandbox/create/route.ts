import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { createSandbox } from '@/lib/experiments/sandbox';

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

    const { tenantId, name, description, config } = await req.json();
    if (!tenantId || !name) {
return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}

    const sandbox = await createSandbox(tenantId, name, description, config);

    return NextResponse.json({ success: true, sandbox });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
