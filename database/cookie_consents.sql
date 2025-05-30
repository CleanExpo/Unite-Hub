-- Cookie Consent Compliance Table
-- Stores user cookie consent preferences for GDPR compliance

CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  analytics BOOLEAN DEFAULT false,
  marketing BOOLEAN DEFAULT false,
  functional BOOLEAN DEFAULT true,
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

-- Create trigger for updated_at column
CREATE TRIGGER update_cookie_consents_updated_at
BEFORE UPDATE ON cookie_consents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Create policies for cookie consents
CREATE POLICY "Users can view their own cookie consents" ON cookie_consents
  FOR SELECT USING (
    auth.uid() = user_id OR
    session_id IN (
      SELECT unnest(string_to_array(current_setting('app.current_session_id', true), ','))
    )
  );

CREATE POLICY "Users can insert their own cookie consents" ON cookie_consents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL
  );

CREATE POLICY "Users can update their own cookie consents" ON cookie_consents
  FOR UPDATE USING (
    auth.uid() = user_id OR
    session_id IN (
      SELECT unnest(string_to_array(current_setting('app.current_session_id', true), ','))
    )
  );

-- Admin policy to view all cookie consents for compliance reporting
CREATE POLICY "Admins can view all cookie consents" ON cookie_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to get cookie consent by session or user
CREATE OR REPLACE FUNCTION get_cookie_consent(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  user_id UUID,
  preferences JSONB,
  analytics BOOLEAN,
  marketing BOOLEAN,
  functional BOOLEAN,
  consent_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.session_id,
    cc.user_id,
    cc.preferences,
    cc.analytics,
    cc.marketing,
    cc.functional,
    cc.consent_timestamp
  FROM cookie_consents cc
  WHERE cc.session_id = p_session_id
    OR (p_user_id IS NOT NULL AND cc.user_id = p_user_id)
  ORDER BY cc.consent_timestamp DESC
  LIMIT 1;
END;
$$;

-- Create function to record cookie consent
CREATE OR REPLACE FUNCTION record_cookie_consent(
  p_session_id TEXT,
  p_preferences JSONB,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consent_id UUID;
  analytics_pref BOOLEAN := COALESCE((p_preferences->>'analytics')::boolean, false);
  marketing_pref BOOLEAN := COALESCE((p_preferences->>'marketing')::boolean, false);
  functional_pref BOOLEAN := COALESCE((p_preferences->>'functional')::boolean, true);
BEGIN
  -- Insert new cookie consent record
  INSERT INTO cookie_consents (
    session_id,
    user_id,
    preferences,
    analytics,
    marketing,
    functional,
    ip_address,
    user_agent,
    consent_timestamp
  ) VALUES (
    p_session_id,
    p_user_id,
    p_preferences,
    analytics_pref,
    marketing_pref,
    functional_pref,
    p_ip_address,
    p_user_agent,
    NOW()
  )
  RETURNING id INTO consent_id;
  
  RETURN consent_id;
END;
$$;
