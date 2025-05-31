-- Complete Database Setup for Unite Group SaaS
-- Run this script in Supabase SQL Editor

-- =============================================================================
-- 1. COOKIE CONSENT COMPLIANCE TABLE
-- =============================================================================

-- Create cookie consents table
CREATE TABLE IF NOT EXISTS cookie_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    necessary BOOLEAN DEFAULT true,
    preferences BOOLEAN DEFAULT false,
    analytics BOOLEAN DEFAULT false,
    marketing BOOLEAN DEFAULT false,
    ip_address TEXT,
    user_agent TEXT,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cookie_consents_session_id_idx ON cookie_consents(session_id);
CREATE INDEX IF NOT EXISTS cookie_consents_user_id_idx ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS cookie_consents_timestamp_idx ON cookie_consents(consent_timestamp);

-- Enable Row Level Security
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for cookie_consents
CREATE POLICY IF NOT EXISTS "Users can manage their own cookie consents"
  ON cookie_consents FOR ALL
  USING (user_id = auth.uid() OR user_id IS NULL);

-- =============================================================================
-- 2. USER CONSENT TYPES AND TABLE
-- =============================================================================

-- Create consent type enum
CREATE TYPE IF NOT EXISTS consent_type AS ENUM (
  'privacy_policy',
  'terms_of_service',
  'marketing',
  'cookies',
  'data_processing'
);

-- Create user consents table
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type consent_type NOT NULL,
    consented BOOLEAN NOT NULL,
    consent_version TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_consents_user_id_idx ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS user_consents_type_idx ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS user_consents_created_idx ON user_consents(created_at);

-- Enable RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY IF NOT EXISTS "Users can manage their own consents"
  ON user_consents FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- 3. COMPLIANCE AUDIT LOG
-- =============================================================================

-- Create compliance audit log table
CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    action_details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS compliance_audit_log_user_id_idx ON compliance_audit_log(user_id);
CREATE INDEX IF NOT EXISTS compliance_audit_log_action_type_idx ON compliance_audit_log(action_type);
CREATE INDEX IF NOT EXISTS compliance_audit_log_created_idx ON compliance_audit_log(created_at);

-- Enable RLS
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only authenticated users can read their own audit logs
CREATE POLICY IF NOT EXISTS "Users can view their own audit logs"
  ON compliance_audit_log FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- 4. PROFILES TABLE (for user management)
-- =============================================================================

-- Create profiles table for extended user data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 5. PROJECTS TABLE (for SaaS project management)
-- =============================================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_idx ON projects(created_at);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY IF NOT EXISTS "Users can manage their own projects"
  ON projects FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- 6. TRIGGER FUNCTIONS FOR UPDATED_AT
-- =============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_cookie_consents_updated_at
    BEFORE UPDATE ON cookie_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. SEED DATA (Optional)
-- =============================================================================

-- Insert default consent types and settings if needed
-- (This section can be customized based on your requirements)

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify the setup
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM cookie_consents LIMIT 1;
-- SELECT * FROM user_consents LIMIT 1;
-- SELECT * FROM compliance_audit_log LIMIT 1;
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM projects LIMIT 1;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- If you see this message, the setup completed successfully!
SELECT 'Database setup completed successfully! All tables created.' AS setup_status;
