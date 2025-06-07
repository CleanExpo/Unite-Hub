export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'project' | 'consultation' | 'payment' | 'system' | string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export interface ActivityTimeline {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
  related_id?: string;
  related_type?: string;
  created_at: string;
}

export interface QuickAction {
  id: string;
  user_id: string;
  action_name: string;
  action_type: 'link' | 'function' | 'modal';
  action_target: string;
  icon?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  dashboard_layout: {
    widgets?: string[];
    theme?: 'light' | 'dark';
    compact?: boolean;
  };
  notification_settings: {
    email?: boolean;
    push?: boolean;
    projects?: boolean;
    consultations?: boolean;
    payments?: boolean;
  };
  recommended_services?: string[];
  interests?: string[];
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  due_date?: string;
  completed_at?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  recommendation_type: 'service' | 'resource' | 'blog' | string;
  title: string;
  description: string;
  action_url: string;
  priority: number;
}

export interface DashboardStats {
  activeProjects: number;
  completedProjects: number;
  upcomingConsultations: number;
  totalRevenue: number;
  trends: {
    projects: number;
    consultations: number;
    revenue: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'activities' | 'projects' | 'notifications' | 'recommendations' | 'quick-actions';
  title: string;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  isVisible: boolean;
}
