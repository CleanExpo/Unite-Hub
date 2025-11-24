-- Migration 143: Global Memory Compression Engine (GMCE)
-- Phase 100: Long-term truth-layer-safe compression system

CREATE TABLE IF NOT EXISTS memory_compressed_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('mesh', 'opportunities', 'navigator', 'performance', 'creative', 'scaling', 'convergence')),
  compressed_body JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  loss_notes TEXT NOT NULL,
  dropped_signals INTEGER NOT NULL DEFAULT 0,
  compression_ratio NUMERIC,
  tenant_scope UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_scope UUID REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_packets_source ON memory_compressed_packets(source_type);
CREATE INDEX IF NOT EXISTS idx_memory_packets_tenant ON memory_compressed_packets(tenant_scope);
CREATE INDEX IF NOT EXISTS idx_memory_packets_region ON memory_compressed_packets(region_scope);
CREATE INDEX IF NOT EXISTS idx_memory_packets_created ON memory_compressed_packets(created_at DESC);

ALTER TABLE memory_compressed_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memory packets" ON memory_compressed_packets FOR SELECT
  USING (tenant_scope IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_scope IS NULL);

CREATE POLICY "Users can insert memory packets" ON memory_compressed_packets FOR INSERT
  WITH CHECK (tenant_scope IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_scope IS NULL);

COMMENT ON TABLE memory_compressed_packets IS 'Phase 100: Compressed long-term memory with loss tracking';
