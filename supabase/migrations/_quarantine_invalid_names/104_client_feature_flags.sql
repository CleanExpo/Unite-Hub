-- Phase 34: Client Honest Experience Integration
-- Create table for client feature flags (onboarding state, etc.)

-- Client Feature Flags table
CREATE TABLE IF NOT EXISTS client_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag TEXT NOT NULL,
  value BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one flag per user
  UNIQUE(user_id, flag)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_user ON client_feature_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag ON client_feature_flags(flag);

-- Enable RLS
ALTER TABLE client_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own flags
CREATE POLICY "users_view_own_flags" ON client_feature_flags
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_flags" ON client_feature_flags
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_flags" ON client_feature_flags
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_flags" ON client_feature_flags
FOR DELETE USING (user_id = auth.uid());

-- Service role access
CREATE POLICY "service_role_all_flags" ON client_feature_flags
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON client_feature_flags TO authenticated;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_feature_flag_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_feature_flag_timestamp ON client_feature_flags;
CREATE TRIGGER set_feature_flag_timestamp
  BEFORE UPDATE ON client_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flag_timestamp();
