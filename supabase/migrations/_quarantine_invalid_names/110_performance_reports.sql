-- Phase 40: Performance Intelligence Layer
-- Quarterly and annual performance reports with real data only

-- Performance Reports table
CREATE TABLE IF NOT EXISTS performance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  visual_asset_ids UUID[] DEFAULT '{}',
  narrative TEXT,
  data_sources TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'approved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_reports_client ON performance_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_performance_reports_period ON performance_reports(period);
CREATE INDEX IF NOT EXISTS idx_performance_reports_status ON performance_reports(status);
CREATE INDEX IF NOT EXISTS idx_performance_reports_dates ON performance_reports(start_date, end_date);

-- Enable RLS
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "clients_view_own_reports" ON performance_reports
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_insert_own_reports" ON performance_reports
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "clients_update_own_reports" ON performance_reports
FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "service_role_all_reports" ON performance_reports
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON performance_reports TO authenticated;
