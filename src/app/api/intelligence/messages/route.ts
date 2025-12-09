import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { getMessages } from '@/lib/intelligenceExchange';

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

    const producerEngine = req.nextUrl.searchParams.get('producerEngine') || undefined;
    const consumerEngine = req.nextUrl.searchParams.get('consumerEngine') || undefined;

    const messages = await getMessages(producerEngine, consumerEngine);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
