/**
 * Posting Scheduler API
 * Phase 85: Trigger posting loop and manage engine
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runPostingLoop,
  processClientSchedules,
  getPostingEngineConfig,
  updatePostingEngineConfig,
  setEngineEnabled,
  setDraftMode,
  retryFailedAttempt,
} from '@/lib/postingEngine';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get current config
    const config = await getPostingEngineConfig(workspaceId);
    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Posting scheduler API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, action, clientId, scheduleId, attemptId, config } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Run posting loop
    if (action === 'run') {
      const result = await runPostingLoop(workspaceId);
      return NextResponse.json({
        data: result,
        message: `Processed ${result.processed} schedules: ${result.successful} successful, ${result.blocked} blocked, ${result.failed} failed`,
      });
    }

    // Process specific client
    if (action === 'process_client' && clientId) {
      const result = await processClientSchedules(clientId, workspaceId);
      return NextResponse.json({
        data: result,
        message: `Processed ${result.processed} schedules for client`,
      });
    }

    // Retry failed attempt
    if (action === 'retry' && attemptId) {
      const attempt = await retryFailedAttempt(attemptId);
      return NextResponse.json({
        data: attempt,
        message: attempt ? 'Retry successful' : 'Attempt not found',
      });
    }

    // Enable/disable engine
    if (action === 'enable') {
      await setEngineEnabled(workspaceId, true);
      return NextResponse.json({ message: 'Posting engine enabled' });
    }

    if (action === 'disable') {
      await setEngineEnabled(workspaceId, false);
      return NextResponse.json({ message: 'Posting engine disabled' });
    }

    // Set draft mode
    if (action === 'draft_mode') {
      const enabled = body.enabled !== false;
      await setDraftMode(workspaceId, enabled);
      return NextResponse.json({
        message: enabled ? 'Draft mode enabled' : 'Draft mode disabled',
      });
    }

    // Update config
    if (action === 'update_config' && config) {
      const updated = await updatePostingEngineConfig(workspaceId, config);
      return NextResponse.json({
        data: updated,
        message: 'Configuration updated',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Posting scheduler API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
