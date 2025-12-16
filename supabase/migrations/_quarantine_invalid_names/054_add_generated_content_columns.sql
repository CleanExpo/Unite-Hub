-- Migration: Add missing columns to generated_content
-- Created: 2025-11-22
-- Description: Adds full_content and ai_prompt columns that were missing from initial table

-- Add missing columns to generated_content
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS full_content JSONB,
ADD COLUMN IF NOT EXISTS ai_prompt TEXT;

-- Add comments
COMMENT ON COLUMN generated_content.full_content IS 'JSONB storage for complete content data including variants';
COMMENT ON COLUMN generated_content.ai_prompt IS 'Original prompt used to generate the content';
