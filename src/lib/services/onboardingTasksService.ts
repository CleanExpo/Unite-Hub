/**
 * Onboarding Tasks Service
 * Phase 47: Manages client onboarding tasks and progress tracking
 */

import { supabaseAdmin } from '@/lib/supabase';

export interface OnboardingTask {
  id: string;
  launch_kit_id: string;
  client_id: string;
  task_key: string;
  title: string;
  description: string | null;
  category: 'setup' | 'branding' | 'content' | 'seo' | 'social' | 'review';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completed_at: string | null;
  priority: number;
  estimated_minutes: number;
  icon: string | null;
  action_url: string | null;
  voice_completable: boolean;
  voice_prompt: string | null;
  created_at: string;
}

// Default onboarding tasks for new clients
const DEFAULT_ONBOARDING_TASKS = [
  {
    task_key: 'connect_website',
    title: 'Connect Website URL',
    description: 'Add your website URL so we can analyze your current online presence',
    category: 'setup' as const,
    priority: 1,
    estimated_minutes: 2,
    icon: 'Globe',
    action_url: '/client/settings/website',
    voice_completable: true,
    voice_prompt: 'What is your website URL?',
  },
  {
    task_key: 'add_business_details',
    title: 'Add Business Details',
    description: 'Tell us about your business, industry, and target audience',
    category: 'setup' as const,
    priority: 2,
    estimated_minutes: 5,
    icon: 'Building',
    action_url: '/client/settings/business',
    voice_completable: true,
    voice_prompt: 'Tell me about your business',
  },
  {
    task_key: 'upload_brand_pack',
    title: 'Upload Logo & Brand Pack',
    description: 'Upload your logo, brand colors, and any existing brand assets',
    category: 'branding' as const,
    priority: 3,
    estimated_minutes: 10,
    icon: 'Palette',
    action_url: '/client/vault',
    voice_completable: false,
    voice_prompt: null,
  },
  {
    task_key: 'connect_social',
    title: 'Connect Social Accounts',
    description: 'Link your social media profiles for cross-platform optimization',
    category: 'social' as const,
    priority: 4,
    estimated_minutes: 5,
    icon: 'Share2',
    action_url: '/client/settings/social',
    voice_completable: false,
    voice_prompt: null,
  },
  {
    task_key: 'run_website_audit',
    title: 'Run First Website Audit',
    description: 'Get an initial analysis of your website performance and SEO',
    category: 'seo' as const,
    priority: 5,
    estimated_minutes: 3,
    icon: 'Search',
    action_url: '/client/seo',
    voice_completable: true,
    voice_prompt: 'Run my website audit',
  },
  {
    task_key: 'review_visual_pack',
    title: 'Review Visual Inspiration Pack',
    description: 'Browse curated visual inspiration for your brand and content',
    category: 'content' as const,
    priority: 6,
    estimated_minutes: 5,
    icon: 'Image',
    action_url: '/client/dashboard/welcome-pack#visuals',
    voice_completable: false,
    voice_prompt: null,
  },
  {
    task_key: 'complete_checklist',
    title: 'Complete Onboarding Checklist',
    description: 'Mark all tasks complete to unlock your full dashboard',
    category: 'review' as const,
    priority: 7,
    estimated_minutes: 2,
    icon: 'CheckCircle',
    action_url: '/client/dashboard/welcome-pack',
    voice_completable: false,
    voice_prompt: null,
  },
];

/**
 * Create default onboarding tasks for a launch kit
 */
export async function createOnboardingTasks(
  launchKitId: string,
  clientId: string
): Promise<{ success: boolean; tasks?: OnboardingTask[]; error?: string }> {
  try {
    const tasksToInsert = DEFAULT_ONBOARDING_TASKS.map((task) => ({
      ...task,
      launch_kit_id: launchKitId,
      client_id: clientId,
    }));

    const { data: tasks, error } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .insert(tasksToInsert)
      .select();

    if (error) throw error;

    return { success: true, tasks };
  } catch (error) {
    console.error('Error creating onboarding tasks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create tasks' };
  }
}

/**
 * Get all onboarding tasks for a client
 */
export async function getClientTasks(
  clientId: string
): Promise<{ success: boolean; tasks?: OnboardingTask[]; error?: string }> {
  try {
    const { data: tasks, error } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('priority', { ascending: true });

    if (error) throw error;

    return { success: true, tasks: tasks || [] };
  } catch (error) {
    console.error('Error fetching client tasks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  clientId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'skipped') {
      updateData.skipped_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('client_id', clientId);

    if (error) throw error;

    // Create lifecycle event
    await supabaseAdmin.from('client_lifecycle_events').insert({
      client_id: clientId,
      event_type: 'task_completed',
      event_data: { taskId, status },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update task' };
  }
}

/**
 * Get task progress summary
 */
export async function getTaskProgress(
  clientId: string
): Promise<{
  success: boolean;
  progress?: { completed: number; total: number; percentage: number };
  error?: string;
}> {
  try {
    const { data: tasks, error } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .select('status')
      .eq('client_id', clientId);

    if (error) throw error;

    const total = tasks?.length || 0;
    const completed = tasks?.filter((t) => t.status === 'completed' || t.status === 'skipped').length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { success: true, progress: { completed, total, percentage } };
  } catch (error) {
    console.error('Error calculating task progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get progress' };
  }
}

/**
 * Get next pending task
 */
export async function getNextTask(
  clientId: string
): Promise<{ success: boolean; task?: OnboardingTask; error?: string }> {
  try {
    const { data: task, error } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, task: task || undefined };
  } catch (error) {
    console.error('Error fetching next task:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch task' };
  }
}

/**
 * Complete task via voice command
 */
export async function completeTaskByVoice(
  clientId: string,
  taskKey: string,
  voiceData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the task
    const { data: task, error: findError } = await supabaseAdmin
      .from('client_onboarding_tasks')
      .select('*')
      .eq('client_id', clientId)
      .eq('task_key', taskKey)
      .eq('voice_completable', true)
      .single();

    if (findError || !task) {
      return { success: false, error: 'Task not found or not voice-completable' };
    }

    // Update task status
    const result = await updateTaskStatus(task.id, clientId, 'completed');

    if (!result.success) return result;

    // Store voice data in lifecycle event
    await supabaseAdmin.from('client_lifecycle_events').insert({
      client_id: clientId,
      event_type: 'task_completed',
      event_data: { taskId: task.id, taskKey, completedVia: 'voice', voiceData },
    });

    return { success: true };
  } catch (error) {
    console.error('Error completing task by voice:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete task' };
  }
}
