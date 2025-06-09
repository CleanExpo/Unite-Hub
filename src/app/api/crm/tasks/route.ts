import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// =============================================================================
// REAL TASKS API - NO MOCK DATA
// =============================================================================
// This replaces all fake/mock task data with actual database operations

// GET /api/crm/tasks - Fetch all tasks from database
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get URL parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const clientId = searchParams.get('client_id');
    const dealId = searchParams.get('deal_id');
    const search = searchParams.get('search');
    const overdue = searchParams.get('overdue') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with related information
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        completed_at,
        estimated_hours,
        actual_hours,
        assigned_to,
        created_at,
        updated_at,
        client_id,
        deal_id,
        clients(
          id,
          name,
          email,
          company
        ),
        deals(
          id,
          title,
          stage,
          value
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (overdue) {
      query = query.lt('due_date', new Date().toISOString())
                   .neq('status', 'completed');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Calculate task statistics
    const { data: taskStats } = await supabase
      .from('tasks')
      .select('status, priority, due_date, completed_at, estimated_hours, actual_hours');

    const now = new Date();
    const stats = {
      total: taskStats?.length || 0,
      completed: taskStats?.filter(t => t.status === 'completed').length || 0,
      pending: taskStats?.filter(t => t.status === 'pending').length || 0,
      inProgress: taskStats?.filter(t => t.status === 'in_progress').length || 0,
      overdue: taskStats?.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
      ).length || 0,
      completionRate: taskStats?.length > 0 ? 
        ((taskStats.filter(t => t.status === 'completed').length / taskStats.length) * 100) : 0
    };

    return NextResponse.json({
      data: tasks || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      stats
    });

  } catch (error) {
    console.error('Unexpected error in tasks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/crm/tasks - Create new task in database
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate client exists if provided
    if (body.client_id) {
      const { data: clientExists, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', body.client_id)
        .single();

      if (clientError || !clientExists) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
    }

    // Validate deal exists if provided
    if (body.deal_id) {
      const { data: dealExists, error: dealError } = await supabase
        .from('deals')
        .select('id')
        .eq('id', body.deal_id)
        .single();

      if (dealError || !dealExists) {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: 'Priority must be one of: low, medium, high, urgent' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be one of: pending, in_progress, completed, cancelled' },
        { status: 400 }
      );
    }

    // Prepare task data
    const taskData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      client_id: body.client_id || null,
      deal_id: body.deal_id || null,
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      estimated_hours: body.estimated_hours ? parseInt(body.estimated_hours) : null,
      assigned_to: body.assigned_to || null
    };

    // Insert into database
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select(`
        *,
        clients(
          id,
          name,
          email,
          company
        ),
        deals(
          id,
          title,
          stage,
          value
        )
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: task, message: 'Task created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in task creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
