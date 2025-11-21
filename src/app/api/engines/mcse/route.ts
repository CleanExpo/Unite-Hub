// MCSE API - Cognitive Validation
import { NextRequest, NextResponse } from 'next/server';
import { mcseEngine } from '@/lib/services/engines';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, agentId, reasoning, output } = await req.json();

    if (!tenantId || !agentId || !reasoning || !output) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await mcseEngine.validateReasoning(tenantId, agentId, reasoning, output);

    return NextResponse.json(result);
  } catch (error) {
    console.error('MCSE API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
