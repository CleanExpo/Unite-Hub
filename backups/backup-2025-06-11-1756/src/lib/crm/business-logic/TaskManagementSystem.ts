/**
 * TASK MANAGEMENT SYSTEM - BUSINESS LOGIC LAYER
 * 
 * Implements core business logic for task management workflows
 * with real database integration and validation.
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Local type definitions for immediate fix
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  client_id?: string;
  deal_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Validation Schemas
export const TaskCreationSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  userId: z.string().uuid('Valid user ID required'),
});

export const TaskUpdateSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().datetime().optional(),
  assigned_to: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  userId: z.string().uuid('Valid user ID required'),
});

export const TaskStatusUpdateSchema = z.object({
  taskId: z.string().uuid(),
  fromStatus: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  toStatus: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

export type TaskCreationInput = z.infer<typeof TaskCreationSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;
export type TaskStatusUpdateInput = z.infer<typeof TaskStatusUpdateSchema>;

// Business Logic Classes
export class TaskManagementSystem {
  
  /**
   * Create a new task with proper validation and business rules
   */
  static async createTask(input: TaskCreationInput): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // Validate input
      const validated = TaskCreationSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Validate related entities exist
      if (validated.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('id', validated.client_id)
          .single();
        
        if (clientError || !client) {
          return { success: false, error: 'Client not found' };
        }
      }
      
      if (validated.deal_id) {
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .select('id')
          .eq('id', validated.deal_id)
          .single();
        
        if (dealError || !deal) {
          return { success: false, error: 'Deal not found' };
        }
      }
      
      // Create task record
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: validated.title,
          description: validated.description,
          priority: validated.priority,
          status: 'pending',
          due_date: validated.due_date,
          assigned_to: validated.assigned_to,
          client_id: validated.client_id,
          deal_id: validated.deal_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (taskError) {
        return { success: false, error: taskError.message };
      }
      
      // Log activity
      await this.logTaskActivity(task.id, 'task_created', `Task "${validated.title}" created`, validated.userId);
      
      return { success: true, task };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to create task' };
    }
  }
  
  /**
   * Update task status with business rule validation
   */
  static async updateTaskStatus(input: TaskStatusUpdateInput): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // Validate input
      const validated = TaskStatusUpdateSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Get current task
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', validated.taskId)
        .single();
      
      if (fetchError || !currentTask) {
        return { success: false, error: 'Task not found' };
      }
      
      // Validate status transition
      const isValidTransition = this.validateStatusTransition(validated.fromStatus, validated.toStatus);
      if (!isValidTransition) {
        return { success: false, error: `Invalid status transition from ${validated.fromStatus} to ${validated.toStatus}` };
      }
      
      // Prepare update data
      const updateData: any = {
        status: validated.toStatus,
        updated_at: new Date().toISOString(),
      };
      
      // Set completion timestamp for completed tasks
      if (validated.toStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (currentTask.status === 'completed' && validated.toStatus !== 'completed') {
        // Clear completion timestamp if moving away from completed
        updateData.completed_at = null;
      }
      
      // Update task
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', validated.taskId)
        .select()
        .single();
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Log activity
      await this.logTaskActivity(
        validated.taskId,
        'status_changed',
        `Status changed from ${validated.fromStatus} to ${validated.toStatus}${validated.notes ? `: ${validated.notes}` : ''}`,
        validated.userId
      );
      
      return { success: true, task: updatedTask };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to update task status' };
    }
  }
  
  /**
   * Get tasks with filtering and analytics
   */
  static async getTasks(filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: string;
    client_id?: string;
    deal_id?: string;
    due_after?: string;
    due_before?: string;
  }): Promise<{
    success: boolean;
    tasks?: Task[];
    analytics?: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      completionRate: number;
      priorityDistribution: Record<TaskPriority, number>;
      overdueTasks: number;
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          clients (
            id,
            name,
            email
          ),
          deals (
            id,
            title,
            value
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.deal_id) {
        query = query.eq('deal_id', filters.deal_id);
      }
      if (filters?.due_after) {
        query = query.gte('due_date', filters.due_after);
      }
      if (filters?.due_before) {
        query = query.lte('due_date', filters.due_before);
      }
      
      const { data: tasks, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate analytics
      const analytics = this.calculateTaskAnalytics(tasks || []);
      
      return { success: true, tasks: tasks || [], analytics };
      
    } catch (error) {
      return { success: false, error: 'Failed to fetch tasks' };
    }
  }
  
  /**
   * Get task analytics and metrics
   */
  static async getTaskMetrics(): Promise<{
    success: boolean;
    metrics?: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      inProgressTasks: number;
      completionRate: number;
      priorityDistribution: Record<TaskPriority, number>;
      statusDistribution: Record<TaskStatus, number>;
      overdueTasks: number;
      dueTodayTasks: number;
      dueThisWeekTasks: number;
      avgCompletionTime: number;
      productivity: {
        thisWeek: number;
        lastWeek: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Get all tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');
      
      if (tasksError) {
        return { success: false, error: tasksError.message };
      }
      
      const tasks = allTasks || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(weekStart.getDate() - 7);
      
      // Basic counts
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const pendingTasks = tasks.filter(task => task.status === 'pending').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
      
      // Completion rate
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Priority distribution
      const priorityDistribution = tasks.reduce((acc, task) => {
        const priority = task.priority as TaskPriority;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<TaskPriority, number>);
      
      // Status distribution
      const statusDistribution = tasks.reduce((acc, task) => {
        const status = task.status as TaskStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<TaskStatus, number>);
      
      // Overdue tasks
      const overdueTasks = tasks.filter(task => 
        task.due_date && 
        new Date(task.due_date) < now && 
        task.status !== 'completed' && 
        task.status !== 'cancelled'
      ).length;
      
      // Due today
      const dueTodayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate.toDateString() === today.toDateString() && 
               task.status !== 'completed' && 
               task.status !== 'cancelled';
      }).length;
      
      // Due this week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const dueThisWeekTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= weekStart && 
               dueDate < weekEnd && 
               task.status !== 'completed' && 
               task.status !== 'cancelled';
      }).length;
      
      // Average completion time
      const completedTasksWithDates = tasks.filter(task => 
        task.status === 'completed' && 
        task.created_at && 
        task.completed_at
      );
      
      const avgCompletionTime = completedTasksWithDates.length > 0 
        ? completedTasksWithDates.reduce((sum, task) => {
            const created = new Date(task.created_at);
            const completed = new Date(task.completed_at!);
            return sum + (completed.getTime() - created.getTime());
          }, 0) / completedTasksWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;
      
      // Productivity trend
      const thisWeekCompleted = tasks.filter(task => 
        task.status === 'completed' && 
        task.completed_at && 
        new Date(task.completed_at) >= weekStart
      ).length;
      
      const lastWeekCompleted = tasks.filter(task => 
        task.status === 'completed' && 
        task.completed_at && 
        new Date(task.completed_at) >= lastWeekStart && 
        new Date(task.completed_at) < weekStart
      ).length;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (thisWeekCompleted > lastWeekCompleted) trend = 'up';
      else if (thisWeekCompleted < lastWeekCompleted) trend = 'down';
      
      return {
        success: true,
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          completionRate,
          priorityDistribution,
          statusDistribution,
          overdueTasks,
          dueTodayTasks,
          dueThisWeekTasks,
          avgCompletionTime,
          productivity: {
            thisWeek: thisWeekCompleted,
            lastWeek: lastWeekCompleted,
            trend,
          },
        }
      };
      
    } catch (error) {
      return { success: false, error: 'Failed to calculate task metrics' };
    }
  }
  
  /**
   * Update task details
   */
  static async updateTask(input: TaskUpdateInput): Promise<{ success: boolean; task?: Task; error?: string }> {
    try {
      // Validate input
      const validated = TaskUpdateSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Get current task
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', validated.taskId)
        .single();
      
      if (fetchError || !currentTask) {
        return { success: false, error: 'Task not found' };
      }
      
      // Prepare update data (only include changed fields)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (validated.title !== undefined) updateData.title = validated.title;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.priority !== undefined) updateData.priority = validated.priority;
      if (validated.due_date !== undefined) updateData.due_date = validated.due_date;
      if (validated.assigned_to !== undefined) updateData.assigned_to = validated.assigned_to;
      if (validated.client_id !== undefined) updateData.client_id = validated.client_id;
      if (validated.deal_id !== undefined) updateData.deal_id = validated.deal_id;
      
      // Update task
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', validated.taskId)
        .select()
        .single();
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Log activity
      await this.logTaskActivity(
        validated.taskId,
        'task_updated',
        `Task updated`,
        validated.userId
      );
      
      return { success: true, task: updatedTask };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to update task' };
    }
  }
  
  /**
   * Delete a task
   */
  static async deleteTask(taskId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Check if task exists
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', taskId)
        .single();
      
      if (fetchError || !task) {
        return { success: false, error: 'Task not found' };
      }
      
      // Delete task
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
      
      // Log activity
      await this.logTaskActivity(
        taskId,
        'task_deleted',
        `Task "${task.title}" deleted`,
        userId
      );
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: 'Failed to delete task' };
    }
  }
  
  /**
   * Validate if a status transition is allowed
   */
  private static validateStatusTransition(fromStatus: TaskStatus, toStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      'pending': ['in-progress', 'cancelled'],
      'in-progress': ['pending', 'completed', 'cancelled'],
      'completed': ['in-progress'], // Can be reopened
      'cancelled': ['pending'], // Can be reactivated
    };
    
    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }
  
  /**
   * Calculate task analytics
   */
  private static calculateTaskAnalytics(tasks: any[]): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
    priorityDistribution: Record<TaskPriority, number>;
    overdueTasks: number;
  } {
    const now = new Date();
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const priorityDistribution = tasks.reduce((acc, task) => {
      const priority = task.priority as TaskPriority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<TaskPriority, number>);
    
    const overdueTasks = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    ).length;
    
    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      priorityDistribution,
      overdueTasks,
    };
  }
  
  /**
   * Log task activity for audit trail
   */
  private static async logTaskActivity(
    taskId: string,
    activityType: string,
    description: string,
    userId: string
  ): Promise<void> {
    try {
      // Get server client
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
      console.error('Failed to log task activity:', error);
    }
  }
}

// Export task management functions for API routes
export const taskManagement = {
  createTask: TaskManagementSystem.createTask.bind(TaskManagementSystem),
  updateTask: TaskManagementSystem.updateTask.bind(TaskManagementSystem),
  updateTaskStatus: TaskManagementSystem.updateTaskStatus.bind(TaskManagementSystem),
  deleteTask: TaskManagementSystem.deleteTask.bind(TaskManagementSystem),
  getTasks: TaskManagementSystem.getTasks.bind(TaskManagementSystem),
  getTaskMetrics: TaskManagementSystem.getTaskMetrics.bind(TaskManagementSystem),
};
