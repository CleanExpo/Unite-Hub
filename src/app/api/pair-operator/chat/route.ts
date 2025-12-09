import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { createSession, addSuggestion } from '@/lib/pairOperator';

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

    const { tenantId, action, sessionId, context, message } = await req.json();
    if (!tenantId) {
return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
}

    if (action === 'start') {
      const session = await createSession(tenantId, userData.user.id, context || {});
      return NextResponse.json({ success: true, session });
    }

    if (action === 'message' && sessionId && message) {
      // Generate a suggestion based on message (simplified)
      const suggestion = await addSuggestion(sessionId, 'insight', `Regarding "${message}": Consider reviewing related metrics`);
      return NextResponse.json({ success: true, suggestion });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
