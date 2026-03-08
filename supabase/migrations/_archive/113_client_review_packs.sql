-- Phase 43: Client Agency Review Pack Generator
-- Quarterly and annual review packs for clients

-- Client Review Packs table
CREATE TABLE IF NOT EXISTS client_review_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  performance_report_id UUID REFERENCES performance_reports(id),
  visual_asset_ids UUID[] DEFAULT '{}',
  narrative TEXT,
  data_sources TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready_for_review', 'approved', 'sent')),
  delivery_channel TEXT CHECK (delivery_channel IN ('dashboard', 'pdf_export', 'email')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_packs_client ON client_review_packs(client_id);
CREATE INDEX IF NOT EXISTS idx_review_packs_status ON client_review_packs(status);
CREATE INDEX IF NOT EXISTS idx_review_packs_period ON client_review_packs(period_type);
CREATE INDEX IF NOT EXISTS idx_review_packs_dates ON client_review_packs(start_date, end_date);

-- Enable RLS
ALTER TABLE client_review_packs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "clients_view_own_packs" ON client_review_packs
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND client_id = auth.uid());

CREATE POLICY "clients_insert_own_packs" ON client_review_packs
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "clients_update_own_packs" ON client_review_packs
FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND client_id = auth.uid());

CREATE POLICY "service_role_all_packs" ON client_review_packs
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON client_review_packs TO authenticated;
