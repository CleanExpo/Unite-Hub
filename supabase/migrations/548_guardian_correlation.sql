-- Guardian Phase G46: Correlation Engine
-- Migration: 548
-- Purpose: Cluster related alerts and incidents for pattern detection
-- Tables: guardian_correlation_clusters, guardian_correlation_links

-- ============================================================================
-- TABLE: guardian_correlation_clusters
-- ============================================================================
-- Stores correlation clusters (groups of related alerts/incidents)
-- Clusters identified by key (severity + time bucket)
-- Used for detecting incident patterns and reducing alert fatigue
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_correlation_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'monitoring', 'resolved')) DEFAULT 'open',
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: guardian_correlation_links
-- ============================================================================
-- Links alerts and incidents to correlation clusters
-- Many-to-one: Many alerts/incidents can belong to one cluster
-- Cascade delete: Cluster deleted → links deleted
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_correlation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES guardian_correlation_clusters(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('alert', 'incident')),
  ref_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_correlation_clusters_tenant
  ON guardian_correlation_clusters (tenant_id, last_seen DESC);

CREATE INDEX idx_guardian_correlation_links_cluster
  ON guardian_correlation_links (cluster_id);

CREATE INDEX idx_guardian_correlation_links_ref
  ON guardian_correlation_links (kind, ref_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_correlation_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_correlation_links ENABLE ROW LEVEL SECURITY;

-- Clusters: Tenants can manage their own clusters
CREATE POLICY tenant_rw_guardian_correlation_clusters
  ON guardian_correlation_clusters
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Links: Tenants can only access links for their clusters
CREATE POLICY tenant_rw_guardian_correlation_links
  ON guardian_correlation_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM guardian_correlation_clusters c
      WHERE c.id = cluster_id AND c.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM guardian_correlation_clusters c
      WHERE c.id = cluster_id AND c.tenant_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_correlation_clusters IS 'Correlation clusters for related alerts and incidents';
COMMENT ON TABLE guardian_correlation_links IS 'Links between clusters and alerts/incidents';
COMMENT ON COLUMN guardian_correlation_clusters.key IS 'Correlation key (severity + time bucket)';
COMMENT ON COLUMN guardian_correlation_clusters.status IS 'Cluster status: open, monitoring, or resolved';
