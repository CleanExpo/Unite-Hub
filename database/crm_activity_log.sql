-- Create activity log table for CRM actions
CREATE TABLE IF NOT EXISTS crm_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON crm_activity_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Super admins can view all activity logs
CREATE POLICY "Super admins can view all activity logs" ON crm_activity_log
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
