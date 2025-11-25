/**
 * API Route: /api/founder/ops/tasks
 *
 * GET: List all tasks with optional filters (brand, status, priority)
 * POST: Create new task
 *
 * @requires Founder role
 * @requires workspace_id query parameter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { founderOpsTaskLibrary } from '@/lib/founderOps/founderOpsTaskLibrary';
import type { FounderTask, TaskArchetype, TaskPriority, TaskStatus } from '@/lib/founderOps/founderOpsTaskLibrary';

const logger = createApiLogger({ route: '/api/founder/ops/tasks' });

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brand = req.nextUrl.searchParams.get('brand');
    const status = req.nextUrl.searchParams.get('status');
    const priority = req.nextUrl.searchParams.get('priority');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    // Authenticate and verify founder role
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    if (profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Workspace mismatch' }, { status: 403 });
    }

    logger.info('Fetching tasks', { workspaceId, brand, status, priority });

    // Build query with filters
    let query = supabase
      .from('founder_ops_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (brand && brand !== 'all') {
      query = query.eq('brand_slug', brand);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error: tasksError } = await query;

    if (tasksError) throw tasksError;

    logger.info('Tasks fetched', { workspaceId, count: tasks?.length || 0 });

    return NextResponse.json({ success: true, tasks: tasks || [] });
  } catch (error) {
    logger.error('Failed to fetch tasks', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const {
      workspaceId,
      brandSlug,
      archetype,
      title,
      description,
      priority,
      channels,
      deadline,
      scheduledFor,
      metadata,
    } = body;

    if (!workspaceId || !brandSlug || !archetype || !title || !priority || !channels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Authenticate and verify founder role
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    if (profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Workspace mismatch' }, { status: 403 });
    }

    logger.info('Creating task', { workspaceId, brandSlug, archetype });

    // Validate task
    const validation = founderOpsTaskLibrary.validateTask({
      workspace_id: workspaceId,
      brand_slug: brandSlug,
      archetype: archetype as TaskArchetype,
      title,
      priority: priority as TaskPriority,
      channels,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Task validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Create task in database
    const { data: task, error: createError } = await supabase
      .from('founder_ops_tasks')
      .insert({
        workspace_id: workspaceId,
        brand_slug: brandSlug,
        archetype,
        title,
        description,
        priority,
        status: scheduledFor ? 'scheduled' : 'draft',
        channels,
        deadline,
        scheduled_for: scheduledFor,
        created_by: user.id,
        assigned_to: 'ai',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (createError) throw createError;

    logger.info('Task created', { taskId: task.id });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create task', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
