import { supabase } from '@/lib/supabase/client';
import type { 
  Notification, 
  ActivityTimeline, 
  QuickAction, 
  UserPreferences, 
  ProjectMilestone,
  Recommendation
} from '@/types/dashboard';

export class DashboardService {
  /**
   * Get user notifications
   */
  static async getNotifications(userId: string, onlyUnread = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { user_uuid: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('mark_notification_read', { notification_uuid: notificationId });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  /**
   * Get activity timeline
   */
  static async getActivityTimeline(userId: string, limit = 10): Promise<ActivityTimeline[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_recent_activities', { 
          user_uuid: userId,
          limit_count: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  /**
   * Create activity entry
   */
  static async createActivity(activity: Omit<ActivityTimeline, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_timeline')
        .insert(activity);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create activity:', error);
    }
  }

  /**
   * Get quick actions
   */
  static async getQuickActions(userId: string): Promise<QuickAction[]> {
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get quick actions:', error);
      return [];
    }
  }

  /**
   * Update quick action
   */
  static async updateQuickAction(actionId: string, updates: Partial<QuickAction>): Promise<void> {
    try {
      const { error } = await supabase
        .from('quick_actions')
        .update(updates)
        .eq('id', actionId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update quick action:', error);
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string, 
    updates: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_personalized_recommendations', { user_uuid: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get project milestones
   */
  static async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get milestones:', error);
      return [];
    }
  }

  /**
   * Update project milestone
   */
  static async updateMilestone(
    milestoneId: string, 
    updates: Partial<ProjectMilestone>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  }

  /**
   * Create project milestone
   */
  static async createMilestone(
    milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .insert(milestone);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create milestone:', error);
    }
  }

  /**
   * Subscribe to notifications
   */
  static subscribeToNotifications(
    userId: string, 
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to activity updates
   */
  static subscribeToActivities(
    userId: string,
    callback: (activity: ActivityTimeline) => void
  ) {
    return supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_timeline',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as ActivityTimeline);
        }
      )
      .subscribe();
  }
}
