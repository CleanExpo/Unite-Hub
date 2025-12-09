/**
 * Phase D76: Unite Model Governance Engine
 *
 * Model versioning, schema definition, and change audit trail.
 * CRITICAL: Support version diffs and rollback.
 */

-- ============================================================================
-- MODELS (versioned schema definitions)
-- ============================================================================

DROP TABLE IF EXISTS unite_models CASCADE;

CREATE TABLE unite_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  schema_def jsonb NOT NULL,
  constraints jsonb,
  tenant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, version, tenant_id)
);

CREATE INDEX idx_unite_models_tenant_name_version ON unite_models(tenant_id, name, version);
CREATE INDEX idx_unite_models_name ON unite_models(name, updated_at DESC);

COMMENT ON TABLE unite_models IS 'Versioned model schema definitions with governance';
COMMENT ON COLUMN unite_models.name IS 'Model identifier (e.g., "Contact", "Campaign")';
COMMENT ON COLUMN unite_models.version IS 'Semantic version (e.g., "1.0.0", "2.1.3")';
COMMENT ON COLUMN unite_models.schema_def IS 'JSON Schema definition: {properties, required, types}';
COMMENT ON COLUMN unite_models.constraints IS 'Validation rules: {validations, relationships, indexes}';

-- ============================================================================
-- MODEL AUDITS (change tracking with AI interpretation)
-- ============================================================================

DROP TABLE IF EXISTS unite_model_audits CASCADE;

CREATE TABLE unite_model_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES unite_models(id) ON DELETE CASCADE,
  change_set jsonb NOT NULL,
  ai_interpretation jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_model_audits_model ON unite_model_audits(model_id, created_at DESC);
CREATE INDEX idx_unite_model_audits_tenant ON unite_model_audits(tenant_id, created_at DESC);

COMMENT ON TABLE unite_model_audits IS 'Model change audit trail with AI analysis';
COMMENT ON COLUMN unite_model_audits.change_set IS 'Schema changes: {added, removed, modified, breaking}';
COMMENT ON COLUMN unite_model_audits.ai_interpretation IS 'AI analysis: {impact, risk_score, rollback_safe, recommendations}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_model_audits ENABLE ROW LEVEL SECURITY;

-- Models
CREATE POLICY "Users can view models for their tenant"
  ON unite_models FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage models for their tenant"
  ON unite_models FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Model Audits
CREATE POLICY "Users can view model audits for their tenant"
  ON unite_model_audits FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage model audits for their tenant"
  ON unite_model_audits FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
