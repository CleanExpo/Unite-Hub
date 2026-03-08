-- Phase 44: Voice-First Navigation Layer
-- Event logging for voice navigation commands

-- Voice Navigation Events
CREATE TABLE IF NOT EXISTS voice_navigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('founder', 'staff', 'client')),
  command_text TEXT NOT NULL,
  recognized_intent TEXT,
  target_route TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_voice_nav_events_user ON voice_navigation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_nav_events_created ON voice_navigation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_nav_events_intent ON voice_navigation_events(recognized_intent);

-- RLS
ALTER TABLE voice_navigation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice events"
  ON voice_navigation_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice events"
  ON voice_navigation_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON voice_navigation_events TO authenticated;
