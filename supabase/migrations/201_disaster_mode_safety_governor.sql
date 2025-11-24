-- Migration 201: Disaster Mode Safety Governor (DMSG)
-- Phase 168: Global emergency downgrade mode

-- Disaster mode activations table
CREATE TABLE IF NOT EXISTS disaster_mode_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activated_by UUID NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'region', 'tenant')),
  scope_identifier TEXT,
  reason TEXT NOT NULL,
  restrictions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID
);

-- Disaster mode operation logs table
CREATE TABLE IF NOT EXISTS disaster_mode_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id UUID REFERENCES disaster_mode_activations(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  was_restricted BOOLEAN NOT NULL,
  restriction_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disaster_mode_active ON disaster_mode_activations(is_active);
CREATE INDEX IF NOT EXISTS idx_disaster_mode_scope ON disaster_mode_activations(scope);
CREATE INDEX IF NOT EXISTS idx_disaster_operations_activation ON disaster_mode_operations(activation_id);

-- RLS
ALTER TABLE disaster_mode_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_mode_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view disaster mode" ON disaster_mode_activations;
CREATE POLICY "Authenticated users can view disaster mode" ON disaster_mode_activations
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view disaster operations" ON disaster_mode_operations;
CREATE POLICY "Authenticated users can view disaster operations" ON disaster_mode_operations
  FOR SELECT USING (auth.uid() IS NOT NULL);
