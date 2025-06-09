import { NextRequest, NextResponse } from 'next/server';
import { TaskManagementSystem } from '@/lib/crm/business-logic/TaskManagementSystem';

// =============================================================================
// TASKS API - USING BUSINESS LOGIC LAYER
// =============================================================================
// This uses the TaskManagementSystem business logic for consistent operations

// GET /api/crm/tasks - Fetch tasks using business logic
export async function GET(request: NextRequest) {
  try {
    console.log('✅ Tasks API: Fetching tasks using business logic layer...');
    
    // Get URL parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const clientId = searchParams.get('client_id');
    const dealId = searchParams.get('deal_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters for business logic
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (clientId) filters.client_id = clientId;
    if (dealId) filters.deal_id = dealId;

    // Use business logic to get tasks
    const result = await TaskManagementSystem.getTasks(filters);

    if (!result.success) {
      console.error('❌ Failed to fetch tasks:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: result.error },
        { status: 500 }
      );
    }

    const tasks = result.tasks || [];
    const analytics = result.analytics;

    // Apply pagination to results
    const paginatedTasks = tasks.slice(offset, offset + limit);
    const totalCount = tasks.length;

    console.log(`✅ Fetched ${paginatedTasks.length} tasks (${totalCount} total)`);

    return NextResponse.json({
      data: paginatedTasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      analytics: analytics ? {
        totalTasks: analytics.totalTasks,
        completedTasks: analytics.completedTasks,
        pendingTasks: analytics.pendingTasks,
        completionRate: analytics.completionRate,
        overdueTasks: analytics.overdueTasks,
        priorityDistribution: analytics.priorityDistribution
      } : null
    });

  } catch (error) {
    console.error('❌ Unexpected error in tasks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/crm/tasks - Create new task using business logic
export async function POST(request: NextRequest) {
  try {
    console.log('✅ Tasks API: Creating task using business logic layer...');
    
    const body = await request.json();
    
    // For now, use a placeholder user ID - this will be replaced with proper auth later
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';

    // Prepare input for business logic
    const taskInput = {
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      due_date: body.due_date,
      assigned_to: body.assigned_to,
      client_id: body.client_id,
      deal_id: body.deal_id,
      userId: body.userId || placeholderUserId // Allow override or use placeholder
    };

    // Use business logic to create task
    const result = await TaskManagementSystem.createTask(taskInput);

    if (!result.success) {
      console.error('❌ Failed to create task:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Task created successfully:', result.task?.id);

    return NextResponse.json(
      { 
        data: result.task, 
        message: 'Task created successfully',
        success: true 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Unexpected error in task creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/tasks - Update task status using business logic workflows
export async function PUT(request: NextRequest) {
  try {
    console.log('✅ Tasks API: Updating task using business logic layer...');
    
    const body = await request.json();
    
    // For now, use a placeholder user ID - this will be replaced with proper auth later
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';

    // Check if this is a status update or general update
    if (body.fromStatus && body.toStatus) {
      // Status update workflow
      const statusUpdateInput = {
        taskId: body.taskId,
        fromStatus: body.fromStatus,
        toStatus: body.toStatus,
        notes: body.notes,
        userId: body.userId || placeholderUserId
      };

      const result = await TaskManagementSystem.updateTaskStatus(statusUpdateInput);

      if (!result.success) {
        console.error('❌ Failed to update task status:', result.error);
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      console.log('✅ Task status updated successfully:', result.task?.id);

      return NextResponse.json({
        data: result.task,
        message: 'Task status updated successfully',
        success: true
      });

    } else {
      // General task update
      const updateInput = {
        taskId: body.taskId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        due_date: body.due_date,
        assigned_to: body.assigned_to,
        client_id: body.client_id,
        deal_id: body.deal_id,
        userId: body.userId || placeholderUserId
      };

      const result = await TaskManagementSystem.updateTask(updateInput);

      if (!result.success) {
        console.error('❌ Failed to update task:', result.error);
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      console.log('✅ Task updated successfully:', result.task?.id);

      return NextResponse.json({
        data: result.task,
        message: 'Task updated successfully',
        success: true
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in task update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/tasks - Delete task using business logic
export async function DELETE(request: NextRequest) {
  try {
    console.log('✅ Tasks API: Deleting task using business logic layer...');
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // For now, use a placeholder user ID - this will be replaced with proper auth later
    const placeholderUserId = '00000000-0000-0000-0000-000000000000';

    // Use business logic to delete task
    const result = await TaskManagementSystem.deleteTask(taskId, placeholderUserId);

    if (!result.success) {
      console.error('❌ Failed to delete task:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('✅ Task deleted successfully:', taskId);

    return NextResponse.json({
      message: 'Task deleted successfully',
      success: true
    });

  } catch (error) {
    console.error('❌ Unexpected error in task deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
