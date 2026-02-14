/**
 * Staff Task by ID API Routes - Phase 2
 * GET /api/staff/tasks/[id] - Get task by ID
 * PATCH /api/staff/tasks/[id] - Update task
 * DELETE /api/staff/tasks/[id] - Delete task
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth } from '@/lib/middleware/auth';
import { supabaseStaff } from '@/lib/auth/supabase';
import { validateBody, taskSchemas } from '@/lib/middleware/validation';

export const GET = withStaffAuth(async (req, context) => {
  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const { data: task, error } = await supabaseStaff
      .from('tasks')
      .select('*, projects(id, client_id, status)')
      .eq('id', id)
      .single();

    if (error || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PATCH = withStaffAuth(async (req, context) => {
  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const { data, error: validationError } = await validateBody(req, taskSchemas.update);

    if (validationError || !data) {
      return NextResponse.json(
        { error: validationError || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabaseStaff
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withStaffAuth(async (req, context) => {
  try {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;
    const { error } = await supabaseStaff
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
