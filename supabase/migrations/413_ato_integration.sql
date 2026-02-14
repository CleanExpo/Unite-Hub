/**
 * Migration 413: ATO Integration Tables
 *
 * Australian Tax Office (ATO) integration infrastructure for:
 * - OAuth2 credentials and token management
 * - ABN lookup caching
 * - BAS (Business Activity Statement) lodgements
 * - Tax obligation tracking
 *
 * Related to: UNI-176 [ATO] ATO API Integration — Authentication & Setup
 */

-- ============================================================================
-- ATO Credentials & OAuth Tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS ato_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- ATO OAuth2 Client
  client_id text,
  client_secret text, -- Encrypted via CredentialVault

  -- OAuth Tokens
  access_token text, -- Encrypted
  refresh_token text, -- Encrypted
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  scope text,

  -- Environment
  sandbox_mode boolean DEFAULT true,
  api_url text,

  -- Status
  is_active boolean DEFAULT true,
  last_auth_at timestamptz,
  last_error text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id),

  CONSTRAINT ato_credentials_workspace_unique UNIQUE (workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_ato_credentials_workspace ON ato_credentials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ato_credentials_active ON ato_credentials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ato_credentials_expires ON ato_credentials(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE ato_credentials IS 'ATO OAuth2 credentials and token storage per workspace';
COMMENT ON COLUMN ato_credentials.sandbox_mode IS 'true = ATO sandbox environment, false = production';
COMMENT ON COLUMN ato_credentials.expires_at IS 'Access token expiration timestamp';

-- ============================================================================
-- ABN Lookup Cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS abn_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ABN Details
  abn text NOT NULL,
  entity_name text,
  entity_type text,

  -- Status
  status text, -- 'active', 'inactive', 'cancelled'
  gst_registered boolean,
  registered_date date,
  status_effective_from date,

  -- Verification
  last_verified_at timestamptz DEFAULT now(),
  verified_source text DEFAULT 'ABR_API',
  verification_response jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT abn_lookups_abn_unique UNIQUE (abn)
);

CREATE INDEX IF NOT EXISTS idx_abn_lookups_abn ON abn_lookups(abn);
CREATE INDEX IF NOT EXISTS idx_abn_lookups_status ON abn_lookups(status);
CREATE INDEX IF NOT EXISTS idx_abn_lookups_gst ON abn_lookups(gst_registered);
CREATE INDEX IF NOT EXISTS idx_abn_lookups_verified ON abn_lookups(last_verified_at);

COMMENT ON TABLE abn_lookups IS 'Cached ABN lookup results from ABR/ATO API';
COMMENT ON COLUMN abn_lookups.verification_response IS 'Full JSON response from ABR API for audit trail';

-- ============================================================================
-- BAS Lodgements
-- ============================================================================

CREATE TABLE IF NOT EXISTS bas_lodgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Business Details
  abn text NOT NULL,
  business_name text,

  -- BAS Period
  period_year integer NOT NULL,
  period_quarter integer, -- 1-4 for quarterly, NULL for monthly
  period_month integer, -- 1-12 for monthly, NULL for quarterly
  period_start_date date NOT NULL,
  period_end_date date NOT NULL,

  -- GST Amounts (in cents for precision)
  gst_on_sales bigint DEFAULT 0, -- G1
  gst_on_purchases bigint DEFAULT 0, -- G11
  net_gst bigint DEFAULT 0, -- 1A = G1 - G11

  -- PAYG Withholding
  payg_withheld bigint DEFAULT 0, -- W1
  payg_installment bigint DEFAULT 0, -- W2

  -- Total Amount
  total_amount bigint DEFAULT 0, -- Net GST + PAYG

  -- Lodgement Status
  status text DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged', 'assessed', 'failed'
  submission_reference text,
  lodged_at timestamptz,
  acknowledged_at timestamptz,
  due_date date NOT NULL,

  -- ATO Response
  ato_response jsonb,
  ato_receipt_id text,

  -- Error Handling
  error_message text,
  retry_count integer DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id),

  CONSTRAINT bas_lodgements_workspace_period UNIQUE (workspace_id, period_year, period_quarter, period_month)
);

CREATE INDEX IF NOT EXISTS idx_bas_lodgements_workspace ON bas_lodgements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_abn ON bas_lodgements(abn);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_status ON bas_lodgements(status);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_period ON bas_lodgements(period_year, period_quarter, period_month);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_due_date ON bas_lodgements(due_date);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_lodged ON bas_lodgements(lodged_at) WHERE lodged_at IS NOT NULL;

COMMENT ON TABLE bas_lodgements IS 'Business Activity Statement (BAS) lodgements to ATO';
COMMENT ON COLUMN bas_lodgements.net_gst IS 'Net GST amount (G1 - G11), stored in cents';
COMMENT ON COLUMN bas_lodgements.submission_reference IS 'ATO submission reference number';
COMMENT ON COLUMN bas_lodgements.ato_response IS 'Full JSON response from ATO API';

-- ============================================================================
-- Tax Obligations
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Business Details
  abn text NOT NULL,

  -- Obligation Details
  obligation_type text NOT NULL, -- 'BAS', 'PAYG', 'STP', 'INCOME_TAX', 'FBT'
  obligation_description text,

  -- Period
  period_year integer NOT NULL,
  period_quarter integer,
  period_month integer,
  period_start_date date,
  period_end_date date,

  -- Dates
  due_date date NOT NULL,
  lodged_date date,

  -- Status
  status text DEFAULT 'due', -- 'due', 'due_soon', 'overdue', 'lodged', 'not_required'
  compliance_status text, -- 'compliant', 'pending', 'overdue', 'failed'

  -- Amount
  estimated_amount bigint,
  actual_amount bigint,

  -- Linked Records
  bas_lodgement_id uuid REFERENCES bas_lodgements(id),

  -- ATO Sync
  ato_obligation_id text,
  last_synced_at timestamptz DEFAULT now(),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT tax_obligations_workspace_type_period UNIQUE (workspace_id, obligation_type, period_year, period_quarter, period_month)
);

CREATE INDEX IF NOT EXISTS idx_tax_obligations_workspace ON tax_obligations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_abn ON tax_obligations(abn);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_type ON tax_obligations(obligation_type);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_status ON tax_obligations(status);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_due ON tax_obligations(due_date);
CREATE INDEX IF NOT EXISTS idx_tax_obligations_overdue ON tax_obligations(due_date) WHERE status = 'overdue';
CREATE INDEX IF NOT EXISTS idx_tax_obligations_synced ON tax_obligations(last_synced_at);

COMMENT ON TABLE tax_obligations IS 'Tax obligation tracking and compliance monitoring';
COMMENT ON COLUMN tax_obligations.status IS 'Current status: due (>7 days), due_soon (≤7 days), overdue, lodged, not_required';
COMMENT ON COLUMN tax_obligations.compliance_status IS 'Overall compliance status for the obligation';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE ato_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE abn_lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bas_lodgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_obligations ENABLE ROW LEVEL SECURITY;

-- ATO Credentials Policies
CREATE POLICY "Users can view their workspace ATO credentials"
  ON ato_credentials FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage ATO credentials"
  ON ato_credentials FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ABN Lookups Policies (public read for cached lookups)
CREATE POLICY "Anyone can read ABN lookups"
  ON abn_lookups FOR SELECT
  USING (true);

CREATE POLICY "System can insert ABN lookups"
  ON abn_lookups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update ABN lookups"
  ON abn_lookups FOR UPDATE
  USING (true);

-- BAS Lodgements Policies
CREATE POLICY "Users can view their workspace BAS lodgements"
  ON bas_lodgements FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create BAS lodgements"
  ON bas_lodgements FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can update BAS lodgements"
  ON bas_lodgements FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Tax Obligations Policies
CREATE POLICY "Users can view their workspace tax obligations"
  ON tax_obligations FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage tax obligations"
  ON tax_obligations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ato_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ato_credentials_updated_at
  BEFORE UPDATE ON ato_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_ato_updated_at();

CREATE TRIGGER update_abn_lookups_updated_at
  BEFORE UPDATE ON abn_lookups
  FOR EACH ROW
  EXECUTE FUNCTION update_ato_updated_at();

CREATE TRIGGER update_bas_lodgements_updated_at
  BEFORE UPDATE ON bas_lodgements
  FOR EACH ROW
  EXECUTE FUNCTION update_ato_updated_at();

CREATE TRIGGER update_tax_obligations_updated_at
  BEFORE UPDATE ON tax_obligations
  FOR EACH ROW
  EXECUTE FUNCTION update_ato_updated_at();
