-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
  category TEXT, -- 'project', 'consultation', 'payment', 'system', etc.
  related_id TEXT, -- ID of related entity (project_id, consultation_id, etc.)
  related_type TEXT, -- Type of related entity
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT, -- URL to navigate to when clicked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity timeline table
CREATE TABLE IF NOT EXISTS activity_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'project_created', 'consultation_booked', 'payment_received', etc.
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon name for the activity
  color TEXT, -- Color code for the activity
  metadata JSONB DEFAULT '{}', -- Additional data about the activity
  related_id TEXT,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick actions table
CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'link', 'function', 'modal'
  action_target TEXT NOT NULL, -- URL or function name
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table for personalized recommendations
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  dashboard_layout JSONB DEFAULT '{}', -- Layout preferences
  notification_settings JSONB DEFAULT '{}', -- Notification preferences
  recommended_services TEXT[], -- Array of recommended service types
  interests TEXT[], -- User interests for personalization
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project milestones table for enhanced project tracking
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delayed'
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_activity_timeline_user_id ON activity_timeline(user_id);
CREATE INDEX idx_activity_timeline_created_at ON activity_timeline(created_at DESC);
CREATE INDEX idx_quick_actions_user_id ON quick_actions(user_id);
CREATE INDEX idx_quick_actions_is_active ON quick_actions(is_active);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_project_milestones_status ON project_milestones(status);

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = user_uuid AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = notification_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function to get recent activities
CREATE OR REPLACE FUNCTION get_recent_activities(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.id,
    at.activity_type,
    at.title,
    at.description,
    at.icon,
    at.color,
    at.metadata,
    at.created_at
  FROM activity_timeline at
  WHERE at.user_id = user_uuid
  ORDER BY at.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get personalized recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(user_uuid UUID)
RETURNS TABLE (
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  action_url TEXT,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      up.recommended_services,
      up.interests,
      COUNT(DISTINCT c.id) as consultation_count,
      COUNT(DISTINCT p.id) as project_count
    FROM user_preferences up
    LEFT JOIN consultations c ON c.user_id = user_uuid
    LEFT JOIN projects p ON p.created_by = user_uuid
    WHERE up.user_id = user_uuid
    GROUP BY up.recommended_services, up.interests
  )
  SELECT 
    'service' as recommendation_type,
    'Book a Consultation' as title,
    'Start your journey with a personalized consultation' as description,
    '/book-consultation' as action_url,
    1 as priority
  WHERE NOT EXISTS (SELECT 1 FROM consultations WHERE user_id = user_uuid)
  
  UNION ALL
  
  SELECT
    'resource' as recommendation_type,
    'Download Our Guide' as title,
    'Get our free guide on digital transformation' as description,
    '/resources' as action_url,
    2 as priority
  WHERE EXISTS (SELECT 1 FROM user_data WHERE project_count > 0)
  
  UNION ALL
  
  SELECT
    'blog' as recommendation_type,
    'Read Latest Insights' as title,
    'Stay updated with our latest blog posts' as description,
    '/blog' as action_url,
    3 as priority
  
  ORDER BY priority
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user_preferences updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample quick actions for new users
CREATE OR REPLACE FUNCTION create_default_quick_actions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO quick_actions (user_id, action_name, action_type, action_target, icon, color, order_index)
  VALUES
    (NEW.id, 'Book Consultation', 'link', '/book-consultation', 'Calendar', 'teal', 1),
    (NEW.id, 'View Projects', 'link', '/projects', 'Briefcase', 'blue', 2),
    (NEW.id, 'Resources', 'link', '/resources', 'BookOpen', 'purple', 3),
    (NEW.id, 'Contact Support', 'link', '/contact', 'MessageCircle', 'green', 4);
  
  -- Also create default user preferences
  INSERT INTO user_preferences (user_id, dashboard_layout, notification_settings)
  VALUES (
    NEW.id,
    '{"widgets": ["stats", "activities", "projects", "notifications"]}',
    '{"email": true, "push": false, "projects": true, "consultations": true}'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set up defaults for new users
CREATE TRIGGER create_user_defaults
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_quick_actions();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quick_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_milestones TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated;
