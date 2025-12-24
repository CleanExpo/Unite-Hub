-- Migration 172: Global Evolution Mesh
-- Phase 129: Dynamic graph linking engines, regions, tasks, trends, and signals

-- Evolution mesh nodes table
CREATE TABLE IF NOT EXISTS evolution_mesh_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('engine', 'region', 'task', 'trend', 'signal', 'metric')),
  node_label TEXT NOT NULL,
  node_data JSONB NOT NULL DEFAULT '{}',
  influence_weight NUMERIC NOT NULL CHECK (influence_weight >= 0 AND influence_weight <= 1) DEFAULT 0.5,
  temporal_decay_factor NUMERIC DEFAULT 0.1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evolution mesh edges table
CREATE TABLE IF NOT EXISTS evolution_mesh_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES evolution_mesh_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES evolution_mesh_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('influences', 'depends_on', 'triggers', 'correlates', 'feedback')),
  weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 1) DEFAULT 0.5,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  is_feedback_loop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evolution mesh snapshots table
CREATE TABLE IF NOT EXISTS evolution_mesh_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  node_count INTEGER NOT NULL,
  edge_count INTEGER NOT NULL,
  feedback_loops_detected INTEGER DEFAULT 0,
  mesh_health_score NUMERIC CHECK (mesh_health_score >= 0 AND mesh_health_score <= 100),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_nodes_tenant ON evolution_mesh_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_nodes_type ON evolution_mesh_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_edges_tenant ON evolution_mesh_edges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_edges_source ON evolution_mesh_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_edges_target ON evolution_mesh_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_evolution_mesh_snapshots_tenant ON evolution_mesh_snapshots(tenant_id);

-- RLS
ALTER TABLE evolution_mesh_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_mesh_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_mesh_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view mesh nodes" ON evolution_mesh_nodes;
CREATE POLICY "Users can view mesh nodes" ON evolution_mesh_nodes
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert mesh nodes" ON evolution_mesh_nodes;
CREATE POLICY "Users can insert mesh nodes" ON evolution_mesh_nodes
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view mesh edges" ON evolution_mesh_edges;
CREATE POLICY "Users can view mesh edges" ON evolution_mesh_edges
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert mesh edges" ON evolution_mesh_edges;
CREATE POLICY "Users can insert mesh edges" ON evolution_mesh_edges
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view mesh snapshots" ON evolution_mesh_snapshots;
CREATE POLICY "Users can view mesh snapshots" ON evolution_mesh_snapshots
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert mesh snapshots" ON evolution_mesh_snapshots;
CREATE POLICY "Users can insert mesh snapshots" ON evolution_mesh_snapshots
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
