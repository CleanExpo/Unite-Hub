/**
 * Synthex Memory Service
 *
 * Manages persistent agent memory and context for Synthex AI features.
 * Enables context-aware responses across sessions.
 *
 * Phase: B4 - Synthex Agent Automation
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export type MemoryType = 'general' | 'preference' | 'context' | 'goal' | 'task' | 'feedback';

export interface AgentMemory {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  key: string;
  value: unknown;
  memory_type: MemoryType;
  expires_at: string | null;
  access_count: number;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskType = 'content_generation' | 'campaign_creation' | 'seo_analysis' | 'email_draft' | 'custom';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  task_type: TaskType;
  description: string;
  parameters: Record<string, unknown> | null;
  status: TaskStatus;
  priority: number;
  result: unknown | null;
  error_message: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get a specific memory value by key
 */
export async function getMemory(
  tenantId: string,
  userId: string,
  key: string
): Promise<AgentMemory | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_agent_memory')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get memory: ${error.message}`);
  }

  // Update access count if found
  if (data) {
    await supabaseAdmin
      .from('synthex_agent_memory')
      .update({
        access_count: (data.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', data.id);
  }

  return data;
}

/**
 * Get all memories for a user
 */
export async function getAllMemories(
  tenantId: string,
  userId: string,
  options?: {
    memoryType?: MemoryType;
    limit?: number;
  }
): Promise<AgentMemory[]> {
  let query = supabaseAdmin
    .from('synthex_agent_memory')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (options?.memoryType) {
    query = query.eq('memory_type', options.memoryType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get memories: ${error.message}`);
  }

  return data || [];
}

/**
 * Set or update a memory value
 */
export async function setMemory(params: {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  key: string;
  value: unknown;
  memoryType?: MemoryType;
  expiresAt?: string | null;
}): Promise<AgentMemory> {
  const { tenantId, brandId, userId, key, value, memoryType = 'general', expiresAt } = params;

  const { data, error } = await supabaseAdmin
    .from('synthex_agent_memory')
    .upsert(
      {
        tenant_id: tenantId,
        brand_id: brandId || null,
        user_id: userId,
        key,
        value,
        memory_type: memoryType,
        expires_at: expiresAt || null,
      },
      {
        onConflict: 'tenant_id,user_id,key',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set memory: ${error.message}`);
  }

  return data;
}

/**
 * Delete a memory by key
 */
export async function deleteMemory(
  tenantId: string,
  userId: string,
  key: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_agent_memory')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('key', key);

  if (error) {
    throw new Error(`Failed to delete memory: ${error.message}`);
  }
}

/**
 * Clear all memories for a user (optionally by type)
 */
export async function clearMemories(
  tenantId: string,
  userId: string,
  memoryType?: MemoryType
): Promise<number> {
  let query = supabaseAdmin
    .from('synthex_agent_memory')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (memoryType) {
    query = query.eq('memory_type', memoryType);
  }

  const { data, error } = await query.select();

  if (error) {
    throw new Error(`Failed to clear memories: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Build context string from memories for AI prompts
 */
export async function buildContextFromMemory(
  tenantId: string,
  userId: string
): Promise<string> {
  const memories = await getAllMemories(tenantId, userId, { limit: 20 });

  if (memories.length === 0) {
    return '';
  }

  const contextParts: string[] = [];

  // Group by type
  const byType = memories.reduce((acc, mem) => {
    if (!acc[mem.memory_type]) {
      acc[mem.memory_type] = [];
    }
    acc[mem.memory_type].push(mem);
    return acc;
  }, {} as Record<string, AgentMemory[]>);

  if (byType.preference?.length) {
    contextParts.push('User Preferences:');
    byType.preference.forEach((m) => {
      contextParts.push(`- ${m.key}: ${JSON.stringify(m.value)}`);
    });
  }

  if (byType.goal?.length) {
    contextParts.push('\nUser Goals:');
    byType.goal.forEach((m) => {
      contextParts.push(`- ${m.key}: ${JSON.stringify(m.value)}`);
    });
  }

  if (byType.context?.length) {
    contextParts.push('\nRecent Context:');
    byType.context.forEach((m) => {
      contextParts.push(`- ${m.key}: ${JSON.stringify(m.value)}`);
    });
  }

  return contextParts.join('\n');
}

// ==================== Task Management ====================

/**
 * Create a new agent task
 */
export async function createTask(params: {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  taskType: TaskType;
  description: string;
  parameters?: Record<string, unknown>;
  priority?: number;
  scheduledAt?: string;
}): Promise<AgentTask> {
  const { tenantId, brandId, userId, taskType, description, parameters, priority = 5, scheduledAt } = params;

  const { data, error } = await supabaseAdmin
    .from('synthex_agent_tasks')
    .insert({
      tenant_id: tenantId,
      brand_id: brandId || null,
      user_id: userId,
      task_type: taskType,
      description,
      parameters: parameters || null,
      priority,
      scheduled_at: scheduledAt || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
}

/**
 * Get pending tasks for a tenant
 */
export async function getPendingTasks(
  tenantId: string,
  options?: {
    userId?: string;
    limit?: number;
  }
): Promise<AgentTask[]> {
  let query = supabaseAdmin
    .from('synthex_agent_tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get pending tasks: ${error.message}`);
  }

  return data || [];
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  result?: unknown,
  errorMessage?: string
): Promise<AgentTask> {
  const updates: Partial<AgentTask> = { status };

  if (status === 'running') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (result !== undefined) {
    updates.result = result;
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_agent_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data;
}

/**
 * Get task by ID
 */
export async function getTaskById(taskId: string): Promise<AgentTask | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_agent_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return data;
}

/**
 * Get recent tasks for a user
 */
export async function getRecentTasks(
  tenantId: string,
  userId: string,
  limit: number = 10
): Promise<AgentTask[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_agent_tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent tasks: ${error.message}`);
  }

  return data || [];
}
