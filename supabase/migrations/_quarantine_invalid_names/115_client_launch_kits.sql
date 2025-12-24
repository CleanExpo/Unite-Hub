-- Migration 115: Client Launch Kits
-- Phase 47: Complete onboarding experience for new clients

-- Client Launch Kits table
CREATE TABLE IF NOT EXISTS client_launch_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Kit status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'viewed', 'completed')),
  generated_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Welcome pack content
  welcome_pack_markdown TEXT,
  brand_positioning_report TEXT,
  intro_video_script TEXT,
  visual_inspiration_urls JSONB DEFAULT '[]'::jsonb,

  -- SEO/GEO snapshot
  initial_seo_snapshot JSONB,
  initial_geo_data JSONB,

  -- Business details collected
  business_name TEXT,
  business_url TEXT,
  business_industry TEXT,
  target_audience TEXT,
  brand_colors JSONB,

  -- Generation metadata
  ai_models_used JSONB DEFAULT '[]'::jsonb,
  generation_cost DECIMAL(10,4) DEFAULT 0,
  generation_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client onboarding tasks table
CREATE TABLE IF NOT EXISTS client_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_kit_id UUID NOT NULL REFERENCES client_launch_kits(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task details
  task_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('setup', 'branding', 'content', 'seo', 'social', 'review')),

  -- Task state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,

  -- Task metadata
  priority INTEGER DEFAULT 1,
  estimated_minutes INTEGER DEFAULT 5,
  icon TEXT,
  action_url TEXT,
  requires_approval BOOLEAN DEFAULT false,

  -- Voice completion
  voice_completable BOOLEAN DEFAULT false,
  voice_prompt TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(launch_kit_id, task_key)
);

-- Client lifecycle events table
CREATE TABLE IF NOT EXISTS client_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  launch_kit_id UUID REFERENCES client_launch_kits(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup', 'first_login', 'day_1', 'day_7', 'day_30',
    'task_completed', 'kit_viewed', 'kit_completed',
    'email_sent', 'email_opened', 'email_clicked'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Email tracking
  email_template TEXT,
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_launch_kits_client_id ON client_launch_kits(client_id);
CREATE INDEX IF NOT EXISTS idx_client_launch_kits_org_id ON client_launch_kits(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_launch_kits_status ON client_launch_kits(status);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_tasks_kit ON client_onboarding_tasks(launch_kit_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_tasks_client ON client_onboarding_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_tasks_status ON client_onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_events_client ON client_lifecycle_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_lifecycle_events_type ON client_lifecycle_events(event_type);

-- RLS Policies
ALTER TABLE client_launch_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- Clients can view their own launch kits
CREATE POLICY "clients_view_own_launch_kits" ON client_launch_kits
  FOR SELECT USING (auth.uid() = client_id);

-- Staff can view all launch kits in their org
CREATE POLICY "staff_view_org_launch_kits" ON client_launch_kits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = client_launch_kits.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Clients can view their own tasks
CREATE POLICY "clients_view_own_tasks" ON client_onboarding_tasks
  FOR SELECT USING (auth.uid() = client_id);

-- Clients can update their own tasks
CREATE POLICY "clients_update_own_tasks" ON client_onboarding_tasks
  FOR UPDATE USING (auth.uid() = client_id);

-- Clients can view their own lifecycle events
CREATE POLICY "clients_view_own_events" ON client_lifecycle_events
  FOR SELECT USING (auth.uid() = client_id);

-- Service role can do everything
CREATE POLICY "service_role_launch_kits" ON client_launch_kits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_tasks" ON client_onboarding_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_events" ON client_lifecycle_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_launch_kit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_launch_kits_timestamp
  BEFORE UPDATE ON client_launch_kits
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

CREATE TRIGGER update_client_onboarding_tasks_timestamp
  BEFORE UPDATE ON client_onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

COMMENT ON TABLE client_launch_kits IS 'Stores client welcome packs and launch materials';
COMMENT ON TABLE client_onboarding_tasks IS 'Tracks client onboarding task completion';
COMMENT ON TABLE client_lifecycle_events IS 'Tracks client lifecycle events for email sequences';
