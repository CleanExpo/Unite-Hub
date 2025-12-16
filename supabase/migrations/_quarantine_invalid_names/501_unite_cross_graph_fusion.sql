/**
 * Phase D73: Unite Cross-System Graph Fusion
 *
 * Merge graph data from multiple sources with schema validation.
 * Track fusion operations and detect conflicts.
 */

-- ============================================================================
-- GRAPH SOURCES (data source configurations)
-- ============================================================================

DROP TABLE IF EXISTS unite_graph_sources CASCADE;

CREATE TABLE unite_graph_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  config jsonb,
  enabled boolean DEFAULT true,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_graph_sources_tenant_source ON unite_graph_sources(tenant_id, source);
CREATE INDEX idx_unite_graph_sources_enabled ON unite_graph_sources(enabled) WHERE enabled = true;

COMMENT ON TABLE unite_graph_sources IS 'External graph data sources for cross-system fusion';
COMMENT ON COLUMN unite_graph_sources.source IS 'Source identifier (e.g., "crm", "analytics", "external_api")';
COMMENT ON COLUMN unite_graph_sources.config IS 'Source configuration: {endpoint, auth, entity_mapping, sync_interval}';
COMMENT ON COLUMN unite_graph_sources.enabled IS 'Whether this source is active for fusion';

-- ============================================================================
-- GRAPH FUSION LOG (operation history)
-- ============================================================================

DROP TABLE IF EXISTS unite_graph_fusion_log CASCADE;

CREATE TABLE unite_graph_fusion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  operation text NOT NULL,
  diff jsonb,
  tenant_id uuid,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_graph_fusion_log_tenant ON unite_graph_fusion_log(tenant_id, executed_at DESC);
CREATE INDEX idx_unite_graph_fusion_log_source ON unite_graph_fusion_log(source, executed_at DESC);
CREATE INDEX idx_unite_graph_fusion_log_operation ON unite_graph_fusion_log(operation);

COMMENT ON TABLE unite_graph_fusion_log IS 'Audit log of all graph fusion operations';
COMMENT ON COLUMN unite_graph_fusion_log.source IS 'Source system that triggered the fusion';
COMMENT ON COLUMN unite_graph_fusion_log.operation IS 'Operation type: "merge", "conflict", "rollback", "validate"';
COMMENT ON COLUMN unite_graph_fusion_log.diff IS 'Operation details: {entities_added, relationships_added, conflicts: [], schema_changes: []}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_graph_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_graph_fusion_log ENABLE ROW LEVEL SECURITY;

-- Graph Sources
CREATE POLICY "Users can view graph sources for their tenant"
  ON unite_graph_sources FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage graph sources for their tenant"
  ON unite_graph_sources FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Graph Fusion Log
CREATE POLICY "Users can view fusion log for their tenant"
  ON unite_graph_fusion_log FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage fusion log for their tenant"
  ON unite_graph_fusion_log FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
