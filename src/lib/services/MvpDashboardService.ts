/**
 * MvpDashboardService
 * MVP Dashboard & UX Integration Layer - Phase 15 Week 3-4
 *
 * Aggregates system health, service statuses, and user preferences.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SystemHealthData {
  score: number; // 0-100
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: { status: string; latency?: number };
    auth: { status: string };
    storage: { status: string };
    api: { status: string };
  };
  lastChecked: string;
}

export interface StrategyEngineStatus {
  status: 'active' | 'idle' | 'processing' | 'error';
  currentPlan?: string;
  activeTasks: number;
  completedToday: number;
  lastRun?: string;
}

export interface OperatorQueueSnapshot {
  queuedTasks: number;
  processingTasks: number;
  failedTasks: number;
  completedToday: number;
  averageWaitTime?: number; // seconds
  recentTasks: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
}

export interface IndexingHealthData {
  status: 'healthy' | 'indexing' | 'stale' | 'error';
  documentsIndexed: number;
  pendingDocuments: number;
  lastIndexed?: string;
  indexSize?: number; // bytes
}

export interface BillingStatusData {
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd?: string;
  usage: {
    contacts: { used: number; limit: number };
    emails: { used: number; limit: number };
    aiCredits: { used: number; limit: number };
  };
}

export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
}

export interface DashboardWidget {
  id: string;
  widget_key: string;
  name: string;
  description: string;
  component_name: string;
  default_order: number;
  default_size: string;
  min_role: string;
  config: Record<string, unknown>;
}

export interface UserPreferences {
  id?: string;
  widget_order: string[];
  hidden_widgets: string[];
  widget_sizes: Record<string, string>;
  widget_configs: Record<string, unknown>;
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  action_url?: string;
  action_label?: string;
  source: string;
  priority: number;
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  systemHealth: SystemHealthData;
  strategyEngine: StrategyEngineStatus;
  operatorQueue: OperatorQueueSnapshot;
  indexingHealth: IndexingHealthData;
  billingStatus: BillingStatusData;
  onboarding: OnboardingStatus;
  widgets: DashboardWidget[];
  preferences: UserPreferences;
  notifications: Notification[];
}

// ============================================================================
// SERVICE
// ============================================================================

export class MvpDashboardService {
  /**
   * Get complete dashboard data for a user
   */
  async getDashboardData(userId: string, workspaceId: string): Promise<DashboardData> {
    const [
      systemHealth,
      strategyEngine,
      operatorQueue,
      indexingHealth,
      billingStatus,
      onboarding,
      widgets,
      preferences,
      notifications,
    ] = await Promise.all([
      this.getSystemHealth(),
      this.getStrategyEngineStatus(workspaceId),
      this.getOperatorQueueSnapshot(workspaceId),
      this.getIndexingHealth(workspaceId),
      this.getBillingStatus(userId, workspaceId),
      this.getOnboardingStatus(userId, workspaceId),
      this.getWidgets(),
      this.getUserPreferences(userId, workspaceId),
      this.getNotifications(userId, workspaceId),
    ]);

    return {
      systemHealth,
      strategyEngine,
      operatorQueue,
      indexingHealth,
      billingStatus,
      onboarding,
      widgets,
      preferences,
      notifications,
    };
  }

  /**
   * Get system health score
   */
  async getSystemHealth(): Promise<SystemHealthData> {
    const supabase = await getSupabaseServer();
    const startTime = Date.now();

    // Test database connectivity
    const { error: dbError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    const dbLatency = Date.now() - startTime;
    const dbHealthy = !dbError;

    // Calculate health score
    let score = 100;
    if (!dbHealthy) score -= 40;
    if (dbLatency > 2000) score -= 20;
    else if (dbLatency > 1000) score -= 10;

    const status = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy';

    return {
      score,
      status,
      checks: {
        database: { status: dbHealthy ? 'healthy' : 'unhealthy', latency: dbLatency },
        auth: { status: 'healthy' },
        storage: { status: 'healthy' },
        api: { status: 'healthy' },
      },
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Get strategy engine status
   */
  async getStrategyEngineStatus(workspaceId: string): Promise<StrategyEngineStatus> {
    // TODO: Integrate with actual strategy engine when available
    return {
      status: 'idle',
      activeTasks: 0,
      completedToday: 0,
    };
  }

  /**
   * Get operator queue snapshot
   */
  async getOperatorQueueSnapshot(workspaceId: string): Promise<OperatorQueueSnapshot> {
    // TODO: Integrate with actual task queue when available
    return {
      queuedTasks: 0,
      processingTasks: 0,
      failedTasks: 0,
      completedToday: 0,
      recentTasks: [],
    };
  }

  /**
   * Get indexing health status
   */
  async getIndexingHealth(workspaceId: string): Promise<IndexingHealthData> {
    const supabase = await getSupabaseServer();

    // Count indexed contacts
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    return {
      status: 'healthy',
      documentsIndexed: contactCount || 0,
      pendingDocuments: 0,
      lastIndexed: new Date().toISOString(),
    };
  }

  /**
   * Get billing status
   */
  async getBillingStatus(userId: string, workspaceId: string): Promise<BillingStatusData> {
    const supabase = await getSupabaseServer();

    // Get contact count for usage
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Get email count
    const { count: emailCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    return {
      plan: 'Free',
      status: 'active',
      usage: {
        contacts: { used: contactCount || 0, limit: 500 },
        emails: { used: emailCount || 0, limit: 1000 },
        aiCredits: { used: 0, limit: 100 },
      },
    };
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: string, workspaceId: string): Promise<OnboardingStatus> {
    const supabase = await getSupabaseServer();

    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('status, current_step, completed_steps, skipped_steps')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!progress) {
      return {
        completed: false,
        currentStep: 0,
        totalSteps: 5,
        percentComplete: 0,
      };
    }

    const totalSteps = 5;
    const completedCount = (progress.completed_steps?.length || 0) + (progress.skipped_steps?.length || 0);

    return {
      completed: progress.status === 'completed',
      currentStep: progress.current_step || 1,
      totalSteps,
      percentComplete: Math.round((completedCount / totalSteps) * 100),
    };
  }

  /**
   * Get available widgets
   */
  async getWidgets(): Promise<DashboardWidget[]> {
    const supabase = await getSupabaseServer();

    const { data: widgets, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_active', true)
      .order('default_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch widgets: ${error.message}`);
    return widgets || [];
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string, workspaceId: string): Promise<UserPreferences> {
    const supabase = await getSupabaseServer();

    const { data: prefs } = await supabase
      .from('dashboard_user_prefs')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!prefs) {
      return {
        widget_order: [],
        hidden_widgets: [],
        widget_sizes: {},
        widget_configs: {},
        theme: 'system',
        sidebar_collapsed: false,
      };
    }

    return {
      id: prefs.id,
      widget_order: prefs.widget_order || [],
      hidden_widgets: prefs.hidden_widgets || [],
      widget_sizes: prefs.widget_sizes || {},
      widget_configs: prefs.widget_configs || {},
      theme: prefs.theme || 'system',
      sidebar_collapsed: prefs.sidebar_collapsed || false,
    };
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    workspaceId: string,
    updates: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const supabase = await getSupabaseServer();

    // Upsert preferences
    const { data: prefs, error } = await supabase
      .from('dashboard_user_prefs')
      .upsert(
        {
          user_id: userId,
          workspace_id: workspaceId,
          ...updates,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,workspace_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to update preferences: ${error.message}`);

    return {
      id: prefs.id,
      widget_order: prefs.widget_order || [],
      hidden_widgets: prefs.hidden_widgets || [],
      widget_sizes: prefs.widget_sizes || {},
      widget_configs: prefs.widget_configs || {},
      theme: prefs.theme || 'system',
      sidebar_collapsed: prefs.sidebar_collapsed || false,
    };
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string, workspaceId: string, limit = 10): Promise<Notification[]> {
    const supabase = await getSupabaseServer();

    const { data: notifications, error } = await supabase
      .from('dashboard_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
    return notifications || [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('dashboard_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to mark notification read: ${error.message}`);
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('dashboard_notifications')
      .update({ is_dismissed: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to dismiss notification: ${error.message}`);
  }

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    workspaceId: string,
    notification: {
      type: string;
      title: string;
      message?: string;
      source: string;
      actionUrl?: string;
      actionLabel?: string;
      priority?: number;
      expiresAt?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Notification> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('dashboard_notifications')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        source: notification.source,
        action_url: notification.actionUrl,
        action_label: notification.actionLabel,
        priority: notification.priority || 0,
        expires_at: notification.expiresAt,
        metadata: notification.metadata || {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create notification: ${error.message}`);
    return data;
  }
}

// Export singleton instance
export const mvpDashboardService = new MvpDashboardService();
