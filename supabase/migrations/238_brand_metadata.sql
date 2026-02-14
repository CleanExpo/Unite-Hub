-- Phase V1.1 Subphase v1_1_02: Brand Metadata Schema
-- Stores brand definitions, positioning, and cross-linking rules
-- Enables database persistence of brand matrix and founder curation

CREATE TABLE IF NOT EXISTS brand_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL UNIQUE,
  brand_slug TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  mission TEXT NOT NULL,
  promise TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT[] NOT NULL DEFAULT '{}',
  strengths TEXT[] NOT NULL DEFAULT '{}',
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'draft')),
  CONSTRAINT valid_brand_id CHECK (brand_id ~ '^[a-z_]+$')
);

-- Brand cross-linking rules table
CREATE TABLE IF NOT EXISTS brand_cross_linking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_brand_id TEXT NOT NULL,
  to_brand_id TEXT NOT NULL,
  context TEXT NOT NULL,
  rule TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'occasional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_frequency CHECK (frequency IN ('common', 'occasional', 'rare')),
  CONSTRAINT unique_cross_link UNIQUE (from_brand_id, to_brand_id),
  CONSTRAINT valid_from_brand FOREIGN KEY (from_brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_to_brand FOREIGN KEY (to_brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT
);

-- Enable RLS on brand_metadata
ALTER TABLE brand_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_metadata (read-only for authenticated users)
CREATE POLICY brand_metadata_authenticated_read ON brand_metadata
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

-- Enable RLS on brand_cross_linking_rules
ALTER TABLE brand_cross_linking_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_cross_linking_rules (read-only for authenticated users)
CREATE POLICY brand_cross_linking_rules_authenticated_read ON brand_cross_linking_rules
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_brand_metadata_brand_id ON brand_metadata(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_metadata_status ON brand_metadata(status);
CREATE INDEX IF NOT EXISTS idx_brand_cross_linking_from ON brand_cross_linking_rules(from_brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_cross_linking_to ON brand_cross_linking_rules(to_brand_id);

-- Comments for documentation
COMMENT ON TABLE brand_metadata IS 'Stores brand definitions, positioning, and metadata. Synced from TypeScript brandRegistry.ts and brandPositioningMap.ts. Used by Founder Ops Hub and content builder for brand consistency.';
COMMENT ON COLUMN brand_metadata.brand_id IS 'Unique identifier (e.g., unite_hub, disaster_recovery_au). Matches TypeScript BrandId type.';
COMMENT ON COLUMN brand_metadata.mission IS 'Brand mission statement. Used for content generation and founder transparency.';
COMMENT ON COLUMN brand_metadata.promise IS 'Brand value promise to customers. Used for brand consistency validation.';
COMMENT ON COLUMN brand_metadata.risk_flags IS 'Array of messaging risks to avoid (e.g., "Avoid guarantees about insurance outcomes"). Used by truth layer enforcement.';

COMMENT ON TABLE brand_cross_linking_rules IS 'Defines when and how brands can cross-reference each other. Enables founder to maintain brand independence while leveraging synergies.';
COMMENT ON COLUMN brand_cross_linking_rules.frequency IS 'How often this cross-link should appear (common, occasional, rare). Used for content builder guidance.';
