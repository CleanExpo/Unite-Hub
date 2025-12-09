/**
 * Synthex Playbook Progress API
 * Phase B42: Guided Playbooks & In-App Coach
 *
 * GET - Get user's progress on all playbooks
 * POST - Start a playbook or update step progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUserProgress,
  getPlaybookProgress,
  startPlaybook,
  updateStepProgress,
} from '@/lib/synthex/playbookService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const playbookId = searchParams.get('playbookId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (playbookId) {
      // Get specific playbook progress
      const progress = await getPlaybookProgress(tenantId, user.id, playbookId);
      return NextResponse.json({ progress });
    }

    // Get all progress
    const progress = await getUserProgress(tenantId, user.id);

    return NextResponse.json({
      progress,
      count: progress.length,
    });
  } catch (error) {
    console.error('Error in progress GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, playbookId, stepId, action } = body;

    if (!tenantId || !playbookId) {
      return NextResponse.json(
        { error: 'tenantId and playbookId are required' },
        { status: 400 }
      );
    }

    // If no stepId, start the playbook
    if (!stepId) {
      const progress = await startPlaybook(tenantId, user.id, playbookId);
      return NextResponse.json({ progress }, { status: 201 });
    }

    // Update step progress
    if (!action || !['complete', 'skip'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "complete" or "skip"' },
        { status: 400 }
      );
    }

    const result = await updateStepProgress(
      tenantId,
      user.id,
      playbookId,
      stepId,
      action
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in progress POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
