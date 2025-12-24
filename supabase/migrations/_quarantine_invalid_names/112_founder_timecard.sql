-- Phase 41.1: Founder Timecard System
-- Personal time tracking for the founder
-- FOUNDER-ONLY ACCESS - No client visibility

-- Founder Time Entries
CREATE TABLE IF NOT EXISTS founder_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  category TEXT NOT NULL CHECK (category IN (
    'admin', 'coding', 'meetings', 'strategy', 'finance',
    'ops', 'sales', 'marketing', 'research', 'learning', 'break'
  )),
  notes TEXT,
  is_running BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_time_entries_start ON founder_time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_founder_time_entries_category ON founder_time_entries(category);
CREATE INDEX IF NOT EXISTS idx_founder_time_entries_running ON founder_time_entries(is_running);

-- NO RLS - Founder-only table accessed via service role
-- Access controlled at application layer

-- Grant permissions
GRANT ALL ON founder_time_entries TO authenticated;
