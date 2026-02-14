-- Migration 110: Autonomous R&D Engine
-- Required by Phase 58 - Autonomous R&D Engine (ARDE)
-- Research and development with prototype generation

-- R&D research reports table
CREATE TABLE IF NOT EXISTS rd_research_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  source TEXT NOT NULL,
  analysis JSONB NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  confidence INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT rd_research_reports_confidence_check CHECK (
    confidence >= 1 AND confidence <= 100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rd_research_reports_topic ON rd_research_reports(topic);
CREATE INDEX IF NOT EXISTS idx_rd_research_reports_source ON rd_research_reports(source);
CREATE INDEX IF NOT EXISTS idx_rd_research_reports_confidence ON rd_research_reports(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_rd_research_reports_created ON rd_research_reports(created_at DESC);

-- Enable RLS
ALTER TABLE rd_research_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (system-wide, admin access)
CREATE POLICY rd_research_reports_select ON rd_research_reports
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY rd_research_reports_insert ON rd_research_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE rd_research_reports IS 'Autonomous R&D research reports (Phase 58)';

-- R&D prototypes table
CREATE TABLE IF NOT EXISTS rd_prototypes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID,
  prototype_type TEXT NOT NULL,
  output JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prototype type check
  CONSTRAINT rd_prototypes_type_check CHECK (
    prototype_type IN (
      'api_mock', 'ui_mock', 'agent_workflow',
      'data_pipeline', 'integration_adapter'
    )
  ),

  -- Status check
  CONSTRAINT rd_prototypes_status_check CHECK (
    status IN ('draft', 'testing', 'validated', 'archived')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rd_prototypes_proposal ON rd_prototypes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_rd_prototypes_type ON rd_prototypes(prototype_type);
CREATE INDEX IF NOT EXISTS idx_rd_prototypes_status ON rd_prototypes(status);
CREATE INDEX IF NOT EXISTS idx_rd_prototypes_created ON rd_prototypes(created_at DESC);

-- Enable RLS
ALTER TABLE rd_prototypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY rd_prototypes_select ON rd_prototypes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY rd_prototypes_insert ON rd_prototypes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY rd_prototypes_update ON rd_prototypes
  FOR UPDATE TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE rd_prototypes IS 'R&D prototype outputs (Phase 58)';
