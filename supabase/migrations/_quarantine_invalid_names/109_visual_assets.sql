-- Phase 38: Visual Orchestration Layer
-- Visual assets and variants for AI-generated visuals

-- Visual Assets table
CREATE TABLE IF NOT EXISTS visual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'graph')),
  model_used TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'approved', 'rejected')),
  label TEXT,
  description TEXT,
  asset_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Visual Asset Variants table
CREATE TABLE IF NOT EXISTS visual_asset_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_asset_id UUID NOT NULL REFERENCES visual_assets(id) ON DELETE CASCADE,
  variant_label TEXT,
  model_used TEXT NOT NULL,
  asset_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visual_assets_client ON visual_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_visual_assets_context ON visual_assets(context);
CREATE INDEX IF NOT EXISTS idx_visual_assets_type ON visual_assets(type);
CREATE INDEX IF NOT EXISTS idx_visual_assets_status ON visual_assets(status);
CREATE INDEX IF NOT EXISTS idx_visual_asset_variants_asset ON visual_asset_variants(visual_asset_id);

-- Enable RLS
ALTER TABLE visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_asset_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for visual_assets
CREATE POLICY "clients_view_own_visual_assets" ON visual_assets
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_insert_own_visual_assets" ON visual_assets
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "clients_update_own_visual_assets" ON visual_assets
FOR UPDATE USING (client_id = auth.uid());

CREATE POLICY "service_role_all_visual_assets" ON visual_assets
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policies for visual_asset_variants
CREATE POLICY "clients_view_own_variants" ON visual_asset_variants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM visual_assets
    WHERE visual_assets.id = visual_asset_variants.visual_asset_id
    AND visual_assets.client_id = auth.uid()
  )
);

CREATE POLICY "service_role_all_variants" ON visual_asset_variants
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON visual_assets TO authenticated;
GRANT ALL ON visual_asset_variants TO authenticated;
