-- Phase 11 Week 1-2: Strategy Graph Tables
-- Foundation for Autonomous Strategy Engine with graph modeling and objective planning

-- Strategy Nodes Table - Individual strategy elements
CREATE TABLE IF NOT EXISTS strategy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Node metadata
  name TEXT NOT NULL,
  description TEXT,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'OBJECTIVE',    -- High-level goal
    'TACTIC',       -- Specific approach
    'ACTION',       -- Concrete step
    'METRIC',       -- Measurement point
    'MILESTONE',    -- Progress checkpoint
    'CONSTRAINT'    -- Limiting factor
  )),

  -- Domain and priority
  domain TEXT NOT NULL, -- SEO, GEO, EMAIL, CONTENT, etc.
  priority INTEGER NOT NULL DEFAULT 50, -- 0-100
  risk_level TEXT NOT NULL DEFAULT 'MEDIUM_RISK' CHECK (risk_level IN ('LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK')),

  -- Status and progress
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'BLOCKED',
    'CANCELLED'
  )),
  progress DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 0-100%

  -- Timing
  estimated_duration_hours INTEGER,
  actual_duration_hours INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,

  -- Data and metadata
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  tags TEXT[],

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strategy Edges Table - Connections between nodes
CREATE TABLE IF NOT EXISTS strategy_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Edge endpoints
  source_node_id UUID NOT NULL REFERENCES strategy_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES strategy_nodes(id) ON DELETE CASCADE,

  -- Edge type
  edge_type TEXT NOT NULL CHECK (edge_type IN (
    'DEPENDS_ON',       -- Target must complete before source
    'ENABLES',          -- Source enables target
    'CONFLICTS_WITH',   -- Cannot run simultaneously
    'REINFORCES',       -- Source strengthens target
    'MEASURES',         -- Source measures target
    'BLOCKS',           -- Source blocks target
    'PARALLEL'          -- Can run simultaneously
  )),

  -- Edge properties
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00, -- 0-1 for weighted graphs
  is_critical BOOLEAN NOT NULL DEFAULT false,
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate edges
  UNIQUE(source_node_id, target_node_id, edge_type)
);

-- Strategy Objectives Table - High-level goals with KPIs
CREATE TABLE IF NOT EXISTS strategy_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Objective definition
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'GROWTH',
    'EFFICIENCY',
    'QUALITY',
    'ENGAGEMENT',
    'REVENUE',
    'COMPLIANCE',
    'INNOVATION'
  )),

  -- Target metrics
  kpi_name TEXT NOT NULL,
  kpi_current_value DECIMAL(15,4),
  kpi_target_value DECIMAL(15,4) NOT NULL,
  kpi_unit TEXT, -- %, count, $, etc.

  -- Timeline
  target_date TIMESTAMPTZ NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ACHIEVED', 'MISSED', 'CANCELLED')),
  progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  -- Strategy integration
  root_node_id UUID REFERENCES strategy_nodes(id),
  supporting_node_ids UUID[],

  -- Owner
  owner_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strategy Evaluations Table - Assessment of strategy effectiveness
CREATE TABLE IF NOT EXISTS strategy_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Evaluation target
  target_type TEXT NOT NULL CHECK (target_type IN ('NODE', 'OBJECTIVE', 'GRAPH', 'PATH')),
  target_id UUID NOT NULL,

  -- Evaluation metrics
  effectiveness_score DECIMAL(5,2), -- 0-100
  efficiency_score DECIMAL(5,2),    -- 0-100
  impact_score DECIMAL(5,2),        -- 0-100
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0-1

  -- Analysis
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  recommendations TEXT[],

  -- Source data
  data_sources JSONB DEFAULT '{}',
  metrics_snapshot JSONB DEFAULT '{}',

  -- Evaluation metadata
  evaluated_by UUID REFERENCES auth.users(id),
  evaluation_type TEXT NOT NULL DEFAULT 'MANUAL' CHECK (evaluation_type IN ('MANUAL', 'AUTOMATED', 'AI_ASSISTED')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strategy Proposals Table - Multi-step strategy proposals
CREATE TABLE IF NOT EXISTS strategy_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Proposal metadata
  title TEXT NOT NULL,
  description TEXT,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN (
    'NEW_STRATEGY',
    'OPTIMIZATION',
    'EXPANSION',
    'PIVOT',
    'RECOVERY'
  )),

  -- Source
  source_objective_id UUID REFERENCES strategy_objectives(id),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'AUDIT_SIGNAL',
    'METRIC_THRESHOLD',
    'OPERATOR_FEEDBACK',
    'SCHEDULED',
    'MANUAL'
  )),
  trigger_data JSONB DEFAULT '{}',

  -- Steps
  steps JSONB NOT NULL DEFAULT '[]', -- Array of step objects
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,

  -- Expected outcomes
  expected_outcomes JSONB DEFAULT '{}',
  risk_assessment JSONB DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
  )),

  -- Approval
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategy_nodes_org ON strategy_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_nodes_type ON strategy_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_strategy_nodes_domain ON strategy_nodes(domain);
CREATE INDEX IF NOT EXISTS idx_strategy_nodes_status ON strategy_nodes(status);
CREATE INDEX IF NOT EXISTS idx_strategy_nodes_priority ON strategy_nodes(priority DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_edges_org ON strategy_edges(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_edges_source ON strategy_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_strategy_edges_target ON strategy_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_strategy_edges_type ON strategy_edges(edge_type);

CREATE INDEX IF NOT EXISTS idx_strategy_objectives_org ON strategy_objectives(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_objectives_status ON strategy_objectives(status);
CREATE INDEX IF NOT EXISTS idx_strategy_objectives_category ON strategy_objectives(category);

CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_org ON strategy_evaluations(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_evaluations_target ON strategy_evaluations(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_strategy_proposals_org ON strategy_proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_proposals_status ON strategy_proposals(status);
CREATE INDEX IF NOT EXISTS idx_strategy_proposals_objective ON strategy_proposals(source_objective_id);

-- RLS Policies
ALTER TABLE strategy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_proposals ENABLE ROW LEVEL SECURITY;

-- Nodes: org members can access
CREATE POLICY nodes_select ON strategy_nodes
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY nodes_insert ON strategy_nodes
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY nodes_update ON strategy_nodes
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY nodes_delete ON strategy_nodes
  FOR DELETE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Edges: follow node permissions
CREATE POLICY edges_select ON strategy_edges
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY edges_insert ON strategy_edges
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY edges_update ON strategy_edges
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY edges_delete ON strategy_edges
  FOR DELETE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Objectives: org members
CREATE POLICY objectives_select ON strategy_objectives
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY objectives_insert ON strategy_objectives
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY objectives_update ON strategy_objectives
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Evaluations: org members
CREATE POLICY evaluations_select ON strategy_evaluations
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY evaluations_insert ON strategy_evaluations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Proposals: org members
CREATE POLICY proposals_select ON strategy_proposals
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY proposals_insert ON strategy_proposals
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY proposals_update ON strategy_proposals
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
