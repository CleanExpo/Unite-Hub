/**
 * POST /api/executions/[id]/cancel
 * Cancel execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: executionId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = data.user.id;
    }

    const supabase = await getSupabaseServer();
    const { data: execution, error: execError } = await supabase
      .from('strategy_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (execError || !execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const { data: org, error: orgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', execution.workspace_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('strategy_executions')
      .update({ status: 'cancelled', completed_at: new Date() })
      .eq('id', executionId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Execution cancelled',
      execution: { id: executionId, status: 'cancelled' },
    });
  } catch (error) {
    console.error('Failed to cancel execution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
