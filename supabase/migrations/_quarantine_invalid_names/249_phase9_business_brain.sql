-- Phase 9: Business Brain & Personal AGI Advisor
-- Comprehensive tables for goals, context, financial insights, personal metrics, and briefings

CREATE TABLE IF NOT EXISTS agi_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  owner TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  frequency TEXT NOT NULL,
  deadline DATE NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  parent_goal_id UUID,
  key_results JSONB
);

CREATE TABLE IF NOT EXISTS agi_context_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality TEXT,
  stress_level TEXT,
  energy_level TEXT,
  cognitive_state TEXT,
  calendar_load_percent INTEGER,
  hrv INTEGER,
  heart_rate INTEGER,
  steps INTEGER,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS agi_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL,
  owner TEXT NOT NULL,
  mrr NUMERIC,
  runway_days INTEGER,
  gross_margin_percent NUMERIC,
  customer_acquisition_cost NUMERIC,
  burn_rate NUMERIC,
  cash_position NUMERIC,
  monthly_growth_percent NUMERIC,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS agi_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  owner TEXT NOT NULL,
  business_status JSONB NOT NULL,
  personal_state JSONB NOT NULL,
  briefing_content JSONB NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  summary TEXT,
  estimated_read_time INTEGER,
  estimated_action_time INTEGER
);

CREATE TABLE IF NOT EXISTS agi_personal_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS agi_voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  glasses_hardware TEXT NOT NULL,
  transcript TEXT NOT NULL,
  confidence NUMERIC,
  intent TEXT NOT NULL,
  parameters JSONB,
  session_id UUID
);

CREATE TABLE IF NOT EXISTS agi_glasses_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  owner TEXT NOT NULL,
  hardware TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  battery_percent INTEGER,
  signal_strength INTEGER,
  metadata JSONB
);

-- Indexes for common queries
CREATE INDEX idx_agi_goals_owner_domain ON agi_goals(owner, domain);
CREATE INDEX idx_agi_goals_status ON agi_goals(status);
CREATE INDEX idx_agi_goals_deadline ON agi_goals(deadline);
CREATE INDEX idx_agi_context_owner_date ON agi_context_logs(owner, created_at);
CREATE INDEX idx_agi_financial_date ON agi_financial_snapshots(date);
CREATE INDEX idx_agi_briefings_owner_date ON agi_briefings(owner, date);
CREATE INDEX idx_agi_briefings_type ON agi_briefings(type);
CREATE INDEX idx_agi_personal_metrics_owner ON agi_personal_metrics(owner, created_at);
CREATE INDEX idx_agi_voice_commands_owner ON agi_voice_commands(owner, created_at);
CREATE INDEX idx_agi_glasses_sessions_owner ON agi_glasses_sessions(owner, is_active);

-- Row-Level Security
ALTER TABLE agi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_context_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_personal_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_glasses_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated read policies
CREATE POLICY "Allow authenticated read goals" ON agi_goals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read context" ON agi_context_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read financial" ON agi_financial_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read briefings" ON agi_briefings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read metrics" ON agi_personal_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read voice" ON agi_voice_commands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read glasses" ON agi_glasses_sessions FOR SELECT USING (auth.role() = 'authenticated');
