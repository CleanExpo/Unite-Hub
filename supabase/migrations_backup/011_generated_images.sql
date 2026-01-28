-- Migration 011: Generated Images Table
-- Created: 2025-11-16
-- Purpose: Support AI-generated images (DALL-E, etc.) for contacts and calendar posts

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  calendar_post_id UUID,  -- Will reference calendar_posts when that table is created

  -- Image data
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Generation metadata
  provider TEXT DEFAULT 'dall-e',  -- dall-e, midjourney, stable-diffusion, etc.
  model TEXT,  -- dall-e-3, dall-e-2, etc.
  size TEXT,  -- 1024x1024, 1792x1024, etc.
  quality TEXT,  -- standard, hd
  style TEXT,  -- vivid, natural

  -- Brand colors and customization
  brand_colors TEXT[],
  additional_params JSONB DEFAULT '{}',

  -- Usage tracking
  generation_cost NUMERIC(10, 4) DEFAULT 0,  -- Cost in USD
  revision_number INTEGER DEFAULT 1,
  parent_image_id UUID REFERENCES generated_images(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_images_workspace_id ON generated_images(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_contact_id ON generated_images(contact_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_calendar_post_id ON generated_images(calendar_post_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_parent_image_id ON generated_images(parent_image_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_generated_images_updated_at ON generated_images;
CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE ON generated_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view generated images" ON generated_images;
CREATE POLICY "Users can view generated images" ON generated_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage generated images" ON generated_images;
CREATE POLICY "Service role can manage generated images" ON generated_images
  FOR ALL USING (true);

-- Comments
COMMENT ON TABLE generated_images IS 'AI-generated images for contacts and calendar posts';
COMMENT ON COLUMN generated_images.prompt IS 'The prompt used to generate the image';
COMMENT ON COLUMN generated_images.provider IS 'AI image generation provider (dall-e, midjourney, etc.)';
COMMENT ON COLUMN generated_images.generation_cost IS 'Cost in USD for this image generation';
COMMENT ON COLUMN generated_images.revision_number IS 'Version number if image was regenerated';
COMMENT ON COLUMN generated_images.parent_image_id IS 'Reference to original image if this is a regeneration';
