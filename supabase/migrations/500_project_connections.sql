-- Project Connections — Unite-Hub as Command Centre
-- Each external project (Synthex, DR, RestoreAssist, etc.) connects via API key
-- This schema stores their health data, events, and revenue in one place

-- Connected Projects registry
CREATE TABLE IF NOT EXISTS connected_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_key VARCHAR(50) UNIQUE NOT NULL, -- 'synthex', 'disaster-recovery', etc.
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  api_url VARCHAR(500), -- Base URL for outbound calls (e.g. https://synthex.vercel.app/api)
  vercel_url VARCHAR(500),
  github_repo VARCHAR(255),
  linear_project_id UUID,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'setup')),
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Events — everything that happens across all projects
CREATE TABLE IF NOT EXISTS project_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES connected_projects(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'user.signup', 'payment.received', 'deploy.success', etc.
  event_data JSONB DEFAULT '{}',
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Revenue — track income across all businesses
CREATE TABLE IF NOT EXISTS project_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES connected_projects(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mrr DECIMAL(12, 2) DEFAULT 0,
  arr DECIMAL(12, 2) DEFAULT 0,
  one_off_revenue DECIMAL(12, 2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churn_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Health History — track uptime and health over time
CREATE TABLE IF NOT EXISTS project_health_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES connected_projects(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  response_time_ms INTEGER,
  checks JSONB DEFAULT '{}', -- { db: 'ok', api: 'ok', deploy: 'ok' }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the 6 core businesses
INSERT INTO connected_projects (project_key, display_name, description, vercel_url, github_repo, status) VALUES
  ('synthex', 'Synthex', 'Social media management SaaS — $249/$449/$799 AUD/mo', 'https://synthex.vercel.app', 'CleanExpo/Synthex', 'setup'),
  ('disaster-recovery', 'Disaster Recovery', 'ANZ cleaning & restoration authority platform', 'https://disaster-recovery-seven.vercel.app', 'CleanExpo/Disaster-Recovery', 'active'),
  ('restore-assist', 'RestoreAssist', 'Training & certification platform for restoration professionals', 'https://restore-assist-backend.vercel.app', 'CleanExpo/RestoreAssist', 'active'),
  ('ccw', 'CCW', 'Carpet Cleaners Warehouse — ERP/CRM', NULL, 'CleanExpo/CCW-CRM', 'setup'),
  ('ato-ai', 'ATO AI', 'AI-powered tax compliance tool', NULL, 'CleanExpo/ATO', 'setup'),
  ('dr-nrpg', 'DR/NRPG', 'National Remediation & Property Group — operations', NULL, 'CleanExpo/DR-NRPG', 'active')
ON CONFLICT (project_key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_events_project ON project_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_events_type ON project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_project_revenue_project ON project_revenue(project_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_project_health_project ON project_health_log(project_id, created_at DESC);

-- RLS policies (founder-only access)
ALTER TABLE connected_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_health_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (founder) full access
CREATE POLICY "founder_full_access_projects" ON connected_projects FOR ALL USING (true);
CREATE POLICY "founder_full_access_events" ON project_events FOR ALL USING (true);
CREATE POLICY "founder_full_access_revenue" ON project_revenue FOR ALL USING (true);
CREATE POLICY "founder_full_access_health" ON project_health_log FOR ALL USING (true);
