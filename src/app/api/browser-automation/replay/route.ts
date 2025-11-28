/**
 * Browser Automation Replay API
 *
 * Manage replay tasks and executions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { replayService, ReplayStatus } from '@/lib/browserAutomation';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const type = req.nextUrl.searchParams.get('type');
    const taskId = req.nextUrl.searchParams.get('taskId');
    const runId = req.nextUrl.searchParams.get('runId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    if (type === 'stats') {
      const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
      const stats = await replayService.getRunStats(workspaceId, days);
      return NextResponse.json({ stats });
    }

    if (type === 'scheduled') {
      const tasks = await replayService.getScheduledTasks(workspaceId);
      return NextResponse.json({ tasks });
    }

    if (type === 'history' && taskId) {
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
      const history = await replayService.getRunHistory(taskId, limit);
      return NextResponse.json({ history });
    }

    if (type === 'run' && runId) {
      const run = await replayService.getRun(runId);
      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      return NextResponse.json({ run });
    }

    if (taskId) {
      const task = await replayService.getTask(taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      return NextResponse.json({ task });
    }

    // List tasks
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const hasSchedule = req.nextUrl.searchParams.get('hasSchedule');
    const lastRunStatus = req.nextUrl.searchParams.get('lastRunStatus') as ReplayStatus | undefined;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const result = await replayService.getTasks(
      workspaceId,
      {
        search,
        hasSchedule: hasSchedule === 'true' ? true : hasSchedule === 'false' ? false : undefined,
        lastRunStatus,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[BrowserAutomation] Error fetching replay data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action, workspaceId, taskId, runId, taskData, options } = body;

    if (action === 'create') {
      if (!workspaceId || !taskData) {
        return NextResponse.json({ error: 'workspaceId and taskData required' }, { status: 400 });
      }

      const task = await replayService.createTask(workspaceId, {
        ...taskData,
        createdBy: userId,
      });

      return NextResponse.json({ task });
    }

    if (action === 'update') {
      if (!taskId || !taskData) {
        return NextResponse.json({ error: 'taskId and taskData required' }, { status: 400 });
      }

      await replayService.updateTask(taskId, taskData);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!taskId) {
        return NextResponse.json({ error: 'taskId required' }, { status: 400 });
      }

      await replayService.deleteTask(taskId);
      return NextResponse.json({ success: true });
    }

    if (action === 'run') {
      if (!taskId) {
        return NextResponse.json({ error: 'taskId required' }, { status: 400 });
      }

      const run = await replayService.runTask(taskId, options);
      return NextResponse.json({ run });
    }

    if (action === 'cancel') {
      if (!runId) {
        return NextResponse.json({ error: 'runId required' }, { status: 400 });
      }

      await replayService.cancelRun(runId);
      return NextResponse.json({ success: true });
    }

    if (action === 'duplicate') {
      if (!taskId || !body.newName) {
        return NextResponse.json({ error: 'taskId and newName required' }, { status: 400 });
      }

      const task = await replayService.duplicateTask(taskId, body.newName);
      return NextResponse.json({ task });
    }

    if (action === 'export') {
      if (!taskId) {
        return NextResponse.json({ error: 'taskId required' }, { status: 400 });
      }

      const exportData = await replayService.exportTask(taskId);
      return NextResponse.json(exportData);
    }

    if (action === 'import') {
      if (!workspaceId || !taskData) {
        return NextResponse.json({ error: 'workspaceId and taskData required' }, { status: 400 });
      }

      const task = await replayService.importTask(workspaceId, taskData, userId);
      return NextResponse.json({ task });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[BrowserAutomation] Error processing replay action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
