-- Migration 141: Enterprise Governance, Compliance & Board Intelligence Engine
-- Required by Phase 89 - Enterprise Governance, Compliance & Board Intelligence Engine (EGCBI)
-- Governance, compliance tracking, and board-ready reporting

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS egcbi_governance_signals CASCADE;
DROP TABLE IF EXISTS egcbi_board_reports CASCADE;
DROP TABLE IF EXISTS egcbi_compliance_register CASCADE;

-- EGCBI compliance register table
CREATE TABLE egcbi_compliance_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL DEFAULT 'global',
  compliance_type TEXT NOT NULL,
  obligation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  severity TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Compliance type check
  CONSTRAINT egcbi_compliance_type_check CHECK (
    compliance_type IN ('gdpr', 'ccpa', 'hipaa', 'sox', 'pci', 'iso27001', 'internal', 'licensor')
  ),

  -- Status check
  CONSTRAINT egcbi_compliance_status_check CHECK (
    status IN ('pending', 'in_progress', 'compliant', 'non_compliant', 'remediation', 'exempt')
  ),

  -- Severity check
  CONSTRAINT egcbi_compliance_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Foreign keys
  CONSTRAINT egcbi_compliance_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_tenant ON egcbi_compliance_register(tenant_id);
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_region ON egcbi_compliance_register(region);
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_type ON egcbi_compliance_register(compliance_type);
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_status ON egcbi_compliance_register(status);
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_severity ON egcbi_compliance_register(severity);
CREATE INDEX IF NOT EXISTS idx_egcbi_compliance_due ON egcbi_compliance_register(due_date);

-- Enable RLS
ALTER TABLE egcbi_compliance_register ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY egcbi_compliance_select ON egcbi_compliance_register
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY egcbi_compliance_insert ON egcbi_compliance_register
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY egcbi_compliance_update ON egcbi_compliance_register
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE egcbi_compliance_register IS 'Compliance obligations by region and type (Phase 89)';

-- EGCBI board reports table (immutable)
CREATE TABLE egcbi_board_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  report_period TEXT NOT NULL,
  executive_summary TEXT,
  kpi_snapshot JSONB DEFAULT '{}'::jsonb,
  risk_snapshot JSONB DEFAULT '{}'::jsonb,
  compliance_snapshot JSONB DEFAULT '{}'::jsonb,
  strategic_alignment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Report period check (Q1-2025 or M01-2025 format)
  CONSTRAINT egcbi_board_reports_period_check CHECK (
    report_period ~ '^(Q[1-4]|M(0[1-9]|1[0-2]))-[0-9]{4}$'
  ),

  -- Foreign keys
  CONSTRAINT egcbi_board_reports_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_egcbi_board_reports_tenant ON egcbi_board_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_egcbi_board_reports_period ON egcbi_board_reports(report_period);
CREATE INDEX IF NOT EXISTS idx_egcbi_board_reports_created ON egcbi_board_reports(created_at DESC);

-- Enable RLS
ALTER TABLE egcbi_board_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only after creation for immutability)
CREATE POLICY egcbi_board_reports_select ON egcbi_board_reports
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY egcbi_board_reports_insert ON egcbi_board_reports
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- No UPDATE policy - reports are immutable

-- Comment
COMMENT ON TABLE egcbi_board_reports IS 'Immutable board-level reports (Phase 89)';

-- EGCBI governance signals table
CREATE TABLE egcbi_governance_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT egcbi_governance_source_check CHECK (
    source IN ('asrs', 'mcse', 'upewe', 'aire', 'ilcie', 'sorie', 'hsoe', 'manual')
  ),

  -- Signal type check
  CONSTRAINT egcbi_governance_signal_type_check CHECK (
    signal_type IN (
      'compliance_breach', 'risk_escalation', 'kpi_deviation', 'strategic_drift',
      'incident_pattern', 'safety_violation', 'approval_delay', 'ethics_concern'
    )
  ),

  -- Severity check
  CONSTRAINT egcbi_governance_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Foreign keys
  CONSTRAINT egcbi_governance_signals_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_egcbi_governance_signals_tenant ON egcbi_governance_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_egcbi_governance_signals_source ON egcbi_governance_signals(source);
CREATE INDEX IF NOT EXISTS idx_egcbi_governance_signals_type ON egcbi_governance_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_egcbi_governance_signals_severity ON egcbi_governance_signals(severity);
CREATE INDEX IF NOT EXISTS idx_egcbi_governance_signals_timestamp ON egcbi_governance_signals(timestamp DESC);

-- Enable RLS
ALTER TABLE egcbi_governance_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY egcbi_governance_signals_select ON egcbi_governance_signals
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY egcbi_governance_signals_insert ON egcbi_governance_signals
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE egcbi_governance_signals IS 'Cross-system governance signals (Phase 89)';
