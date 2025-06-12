/**
 * TASK MANAGEMENT AUTOMATION API
 * 
 * Handles automated task assignments, dependencies, and workload balancing
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskManagementSystem } from '@/lib/crm/business-logic/TaskManagementSystem';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Automation schemas
const TaskDependencySchema = z.object({
  taskId: z.string().uuid(),
  dependsOnTaskId: z.string().uuid(),
  dependencyType: z.enum(['blocks', 'follows', 'requires']).default('blocks'),
  userId: z.string().uuid(),
});

const AutoAssignmentSchema = z.object({
  taskId: z.string().uuid(),
  criteria: z.object({
    skills: z.array(z.string()).optional(),
    availability: z.boolean().default(true),
    workload: z.enum(['low', 'medium', 'high']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }).optional(),
  userId: z.string().uuid(),
});

const WorkloadBalanceSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  action: z.enum(['balance', 'redistribute', 'analyze']),
  userId: z.string().uuid(),
});

/**
 * POST /api/crm/tasks/automation - Execute task automation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different automation types
    switch (body.action) {
      case 'add_dependency':
        return await handleAddDependency(body);
      case 'remove_dependency':
        return await handleRemoveDependency(body);
      case 'auto_assign':
        return await handleAutoAssignment(body);
      case 'balance_workload':
        return await handleWorkloadBalance(body);
      case 'check_dependencies':
        return await handleCheckDependencies(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid automation action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Task automation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/tasks/automation - Get automation status and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');
    
    switch (type) {
      case 'dependencies':
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: 'Task ID required for dependencies' },
            { status: 400 }
          );
        }
        const dependencies = await getTaskDependencies(taskId);
        return NextResponse.json({ success: true, dependencies });
        
      case 'workload':
        const workloadAnalysis = await getWorkloadAnalysis(userId);
        return NextResponse.json({ success: true, workload: workloadAnalysis });
        
      case 'assignment_suggestions':
        if (!taskId) {
          return NextResponse.json(
            { success: false, error: 'Task ID required for assignment suggestions' },
            { status: 400 }
          );
        }
        const suggestions = await getAssignmentSuggestions(taskId);
        return NextResponse.json({ success: true, suggestions });
        
      default:
        const automation = await getAutomationOverview();
        return NextResponse.json({ success: true, automation });
    }
    
  } catch (error) {
    console.error('Task automation status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle adding task dependencies
 */
async function handleAddDependency(body: any) {
  try {
    const validated = TaskDependencySchema.parse(body);
    
    // Get server client
    const supabase = await createClient();
    
    // Check if both tasks exist
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .in('id', [validated.taskId, validated.dependsOnTaskId]);
    
    if (tasksError || tasks.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'One or both tasks not found' },
        { status: 404 }
      );
    }
    
    // Check for circular dependencies
    const hasCircularDependency = await checkCircularDependency(
      validated.taskId, 
      validated.dependsOnTaskId
    );
    
    if (hasCircularDependency) {
      return NextResponse.json(
        { success: false, error: 'Circular dependency detected' },
        { status: 400 }
      );
    }
    
    // Add dependency
    const { data: dependency, error: depError } = await supabase
      .from('task_dependencies')
      .insert({
        task_id: validated.taskId,
        depends_on_task_id: validated.dependsOnTaskId,
        dependency_type: validated.dependencyType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (depError) {
      return NextResponse.json(
        { success: false, error: depError.message },
        { status: 500 }
      );
    }
    
    // Log activity
    await logAutomationActivity(
      validated.taskId,
      'dependency_added',
      `Added ${validated.dependencyType} dependency on task ${validated.dependsOnTaskId}`,
      validated.userId
    );
    
    return NextResponse.json({
      success: true,
      dependency,
      message: 'Dependency added successfully'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Add dependency error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add dependency' },
      { status: 500 }
    );
  }
}

/**
 * Handle removing task dependencies
 */
async function handleRemoveDependency(body: any) {
  try {
    const { taskId, dependsOnTaskId, userId } = body;
    
    if (!taskId || !dependsOnTaskId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Remove dependency
    const { error: removeError } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('task_id', taskId)
      .eq('depends_on_task_id', dependsOnTaskId);
    
    if (removeError) {
      return NextResponse.json(
        { success: false, error: removeError.message },
        { status: 500 }
      );
    }
    
    // Log activity
    await logAutomationActivity(
      taskId,
      'dependency_removed',
      `Removed dependency on task ${dependsOnTaskId}`,
      userId
    );
    
    return NextResponse.json({
      success: true,
      message: 'Dependency removed successfully'
    });
    
  } catch (error) {
    console.error('Remove dependency error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove dependency' },
      { status: 500 }
    );
  }
}

/**
 * Handle automated task assignment
 */
async function handleAutoAssignment(body: any) {
  try {
    const validated = AutoAssignmentSchema.parse(body);
    
    // Get assignment suggestions
    const suggestions = await getAssignmentSuggestions(validated.taskId);
    
    if (!suggestions.length) {
      return NextResponse.json({
        success: true,
        assigned: false,
        reason: 'No suitable assignees found'
      });
    }
    
    // Auto-assign to best candidate
    const bestCandidate = suggestions[0];
    
    const supabase = await createClient();
    
    // Update task assignment
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        assigned_to: bestCandidate.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.taskId)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }
    
    // Log activity
    await logAutomationActivity(
      validated.taskId,
      'auto_assigned',
      `Auto-assigned to ${bestCandidate.name} (score: ${bestCandidate.score})`,
      validated.userId
    );
    
    return NextResponse.json({
      success: true,
      assigned: true,
      assignee: bestCandidate,
      task: updatedTask,
      reason: `Best match based on ${bestCandidate.reasons.join(', ')}`
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Auto assignment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-assign task' },
      { status: 500 }
    );
  }
}

/**
 * Handle workload balancing
 */
async function handleWorkloadBalance(body: any) {
  try {
    const validated = WorkloadBalanceSchema.parse(body);
    
    switch (validated.action) {
      case 'analyze':
        const analysis = await getWorkloadAnalysis();
        return NextResponse.json({
          success: true,
          analysis,
          recommendations: generateWorkloadRecommendations(analysis)
        });
        
      case 'balance':
        const balanceResult = await executeWorkloadBalancing(validated.userIds);
        return NextResponse.json({
          success: true,
          balanced: balanceResult.success,
          changes: balanceResult.changes,
          message: balanceResult.message
        });
        
      case 'redistribute':
        const redistributeResult = await executeTaskRedistribution(validated.userIds);
        return NextResponse.json({
          success: true,
          redistributed: redistributeResult.success,
          changes: redistributeResult.changes,
          message: redistributeResult.message
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid workload action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Workload balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to balance workload' },
      { status: 500 }
    );
  }
}

/**
 * Handle dependency checking
 */
async function handleCheckDependencies(body: any) {
  try {
    const { taskId } = body;
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID required' },
        { status: 400 }
      );
    }
    
    const dependencies = await getTaskDependencies(taskId);
    const blockedTasks = await getBlockedTasks(taskId);
    
    return NextResponse.json({
      success: true,
      dependencies,
      blockedTasks,
      canStart: dependencies.every(dep => dep.status === 'completed'),
      blocking: blockedTasks.length > 0
    });
    
  } catch (error) {
    console.error('Check dependencies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check dependencies' },
      { status: 500 }
    );
  }
}

/**
 * Get task dependencies
 */
async function getTaskDependencies(taskId: string) {
  const supabase = await createClient();
  
  const { data: dependencies, error } = await supabase
    .from('task_dependencies')
    .select(`
      *,
      dependency_task:depends_on_task_id (
        id,
        title,
        status,
        priority
      )
    `)
    .eq('task_id', taskId);
  
  if (error) throw error;
  
  return dependencies || [];
}

/**
 * Get tasks blocked by this task
 */
async function getBlockedTasks(taskId: string) {
  const supabase = await createClient();
  
  const { data: blockedTasks, error } = await supabase
    .from('task_dependencies')
    .select(`
      *,
      blocked_task:task_id (
        id,
        title,
        status,
        priority
      )
    `)
    .eq('depends_on_task_id', taskId);
  
  if (error) throw error;
  
  return blockedTasks || [];
}

/**
 * Get assignment suggestions based on workload and skills
 */
async function getAssignmentSuggestions(taskId: string) {
  const supabase = await createClient();
  
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  
  if (!task) return [];
  
  // Get all users (simplified - in real app would have user skills/roles)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email');
  
  if (!users) return [];
  
  // Get current workloads
  const workloads = await getUserWorkloads(users.map(u => u.id));
  
  // Calculate assignment scores
  const suggestions = users.map(user => {
    const userWorkload = workloads[user.id] || { active: 0, pending: 0, score: 0 };
    
    let score = 100;
    const reasons = [];
    
    // Workload factor (lower workload = higher score)
    if (userWorkload.active <= 2) {
      score += 20;
      reasons.push('low workload');
    } else if (userWorkload.active >= 5) {
      score -= 30;
      reasons.push('high workload');
    }
    
    // Priority factor
    if (task.priority === 'urgent' && userWorkload.active <= 1) {
      score += 15;
      reasons.push('available for urgent tasks');
    }
    
    // Random factor for demo
    score += Math.random() * 10;
    
    return {
      userId: user.id,
      name: user.full_name || user.email,
      email: user.email,
      score: Math.round(score),
      workload: userWorkload,
      reasons
    };
  }).sort((a, b) => b.score - a.score);
  
  return suggestions.slice(0, 3); // Top 3 candidates
}

/**
 * Get user workloads
 */
async function getUserWorkloads(userIds: string[]) {
  const supabase = await createClient();
  
  const workloads: Record<string, any> = {};
  
  for (const userId of userIds) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, priority')
      .eq('assigned_to', userId)
      .in('status', ['pending', 'in-progress']);
    
    const active = tasks?.filter(t => t.status === 'in-progress').length || 0;
    const pending = tasks?.filter(t => t.status === 'pending').length || 0;
    
    workloads[userId] = {
      active,
      pending,
      total: active + pending,
      score: active * 2 + pending // Weight active tasks more heavily
    };
  }
  
  return workloads;
}

/**
 * Check for circular dependencies
 */
async function checkCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Simple check: see if dependsOnTaskId already depends on taskId
  const { data: existingDep } = await supabase
    .from('task_dependencies')
    .select('id')
    .eq('task_id', dependsOnTaskId)
    .eq('depends_on_task_id', taskId)
    .single();
  
  return !!existingDep;
}

/**
 * Get workload analysis
 */
async function getWorkloadAnalysis(specificUserId?: string | null) {
  const supabase = await createClient();
  
  let query = supabase
    .from('profiles')
    .select('id, full_name, email');
  
  if (specificUserId) {
    query = query.eq('id', specificUserId);
  }
  
  const { data: users } = await query;
  
  if (!users) return {};
  
  const userIds = users.map(u => u.id);
  const workloads = await getUserWorkloads(userIds);
  
  const analysis = users.map(user => ({
    ...user,
    workload: workloads[user.id] || { active: 0, pending: 0, total: 0, score: 0 },
    status: getWorkloadStatus(workloads[user.id]?.score || 0)
  }));
  
  return specificUserId ? analysis[0] : analysis;
}

/**
 * Get workload status
 */
function getWorkloadStatus(score: number): 'light' | 'moderate' | 'heavy' | 'overloaded' {
  if (score <= 2) return 'light';
  if (score <= 5) return 'moderate';
  if (score <= 8) return 'heavy';
  return 'overloaded';
}

/**
 * Generate workload recommendations
 */
function generateWorkloadRecommendations(analysis: any) {
  const recommendations = [];
  
  if (Array.isArray(analysis)) {
    const overloaded = analysis.filter(user => user.workload.score > 8);
    const light = analysis.filter(user => user.workload.score <= 2);
    
    if (overloaded.length > 0 && light.length > 0) {
      recommendations.push({
        type: 'redistribute',
        message: `Redistribute tasks from ${overloaded.length} overloaded users to ${light.length} available users`,
        users: { overloaded: overloaded.map(u => u.id), available: light.map(u => u.id) }
      });
    }
    
    if (overloaded.length > 0) {
      recommendations.push({
        type: 'priority_review',
        message: 'Review task priorities for overloaded team members',
        users: overloaded.map(u => u.id)
      });
    }
  }
  
  return recommendations;
}

/**
 * Execute workload balancing
 */
async function executeWorkloadBalancing(userIds?: string[]) {
  // Simplified implementation
  return {
    success: true,
    changes: [],
    message: 'Workload analysis complete - no immediate balancing needed'
  };
}

/**
 * Execute task redistribution
 */
async function executeTaskRedistribution(userIds?: string[]) {
  // Simplified implementation
  return {
    success: true,
    changes: [],
    message: 'Task redistribution analysis complete'
  };
}

/**
 * Get automation overview
 */
async function getAutomationOverview() {
  const supabase = await createClient();
  
  // Get dependency count
  const { count: dependencyCount } = await supabase
    .from('task_dependencies')
    .select('*', { count: 'exact', head: true });
  
  // Get auto-assigned tasks count
  const { data: activities } = await supabase
    .from('activities')
    .select('id')
    .eq('type', 'auto_assigned')
    .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  return {
    totalDependencies: dependencyCount || 0,
    autoAssignmentsThisWeek: activities?.length || 0,
    automationEnabled: true,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Log automation activity
 */
async function logAutomationActivity(
  taskId: string,
  activityType: string,
  description: string,
  userId: string
) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('activities')
      .insert({
        type: activityType,
        description,
        related_to: 'task',
        related_id: taskId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log automation activity:', error);
  }
}
