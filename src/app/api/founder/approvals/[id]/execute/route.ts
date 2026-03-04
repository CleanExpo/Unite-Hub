/**
 * POST /api/founder/approvals/[id]/execute — execute an approved action
 *
 * For now, logs the execution. Actual integrations (Linear, GitHub, email)
 * are future work. Updates status to 'executed' and sets execution_result.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch the approval item
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('approval_queue')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (item.status !== 'approved') {
      return NextResponse.json(
        { error: 'Item must be approved before execution' },
        { status: 400 }
      );
    }

    // Execute based on type — placeholder for future integrations
    const executionResult: Record<string, any> = {
      executed_at: new Date().toISOString(),
      executed_by: user.id,
      type: item.type,
    };

    switch (item.type) {
      case 'linear':
        executionResult.action = 'linear_issue_update';
        executionResult.message = 'Linear integration pending — logged for manual execution';
        break;
      case 'pr':
        executionResult.action = 'github_pr';
        executionResult.message = 'GitHub PR integration pending — logged for manual execution';
        break;
      case 'email':
        executionResult.action = 'email_send';
        executionResult.message = 'Email send integration pending — logged for manual execution';
        break;
      case 'content':
        executionResult.action = 'content_publish';
        executionResult.message = 'Content publish integration pending — logged for manual execution';
        break;
      default:
        executionResult.action = 'generic';
        executionResult.message = `Execution logged for type: ${item.type}`;
    }

    console.log(`[EXECUTE /api/founder/approvals/${id}]`, executionResult);

    // Update to executed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('approval_queue')
      .update({
        status: 'executed',
        execution_result: executionResult,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[EXECUTE /api/founder/approvals/[id]]', updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ item: updated, execution: executionResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[EXECUTE /api/founder/approvals/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
