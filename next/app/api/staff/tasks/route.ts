/**
 * Staff Tasks API Routes - Phase 2
 * GET /api/staff/tasks - List all tasks
 * POST /api/staff/tasks - Create new task
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth, getUserId } from '@/next/core/middleware/auth';
import { supabaseStaff } from '@/next/core/auth/supabase';
import { validateBody, taskSchemas } from '@/next/core/middleware/validation';

/**
 * GET /api/staff/tasks
 * List all tasks (optionally filter by assigned_to)
 */
export const GET = withStaffAuth(async (req) => {
  try {
    const userId = getUserId(req);
    const searchParams = req.nextUrl.searchParams;
    const myTasksOnly = searchParams.get('my_tasks_only') === 'true';

    let query = supabaseStaff
      .from('tasks')
      .select('*, projects(id, client_id, status)')
      .order('due_date', { ascending: true });

    // Filter to user's assigned tasks if requested
    if (myTasksOnly && userId) {
      query = query.eq('assigned_to', userId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/staff/tasks
 * Create a new task
 */
export const POST = withStaffAuth(async (req) => {
  try {
    const { data, error: validationError } = await validateBody(req, taskSchemas.create);

    if (validationError || !data) {
      return NextResponse.json(
        { error: validationError || 'Invalid request body' },
        { status: 400 }
      );
    }

    const userId = getUserId(req);

    const { data: task, error } = await supabaseStaff
      .from('tasks')
      .insert({
        ...data,
        assigned_to: userId, // Auto-assign to creator
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
