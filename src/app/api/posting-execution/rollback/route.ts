/**
 * Rollback API Route
 * Phase 87: Post removal/retraction capability
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  initiateRollback,
  listRollbacks,
  getRollbackById,
} from '@/lib/postingExecution';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const rollbackId = req.nextUrl.searchParams.get('id');
    const status = req.nextUrl.searchParams.get('status');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    // Get single rollback
    if (rollbackId) {
      const rollback = await getRollbackById(rollbackId);
      if (!rollback) {
        return NextResponse.json({ error: 'Rollback not found' }, { status: 404 });
      }
      return NextResponse.json({ data: rollback });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // List rollbacks
    const rollbacks = await listRollbacks(workspaceId, {
      status: status as any || undefined,
      limit,
    });

    return NextResponse.json({ data: rollbacks });
  } catch (error: any) {
    console.error('Rollback GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { executionId, reason } = body;

    if (!executionId || !reason) {
      return NextResponse.json(
        { error: 'executionId and reason required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const result = await initiateRollback({
      executionId,
      requestedBy: userId,
      reason,
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Rollback POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
