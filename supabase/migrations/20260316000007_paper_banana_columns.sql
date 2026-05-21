-- PaperBanana dual-engine columns for campaign_assets
-- Adds visual type routing, image engine tracking, and quality scoring

ALTER TABLE campaign_assets
  ADD COLUMN visual_type TEXT NOT NULL DEFAULT 'photo'
    CHECK (visual_type IN ('photo','infographic','diagram','data_viz','process_flow')),
  ADD COLUMN image_engine TEXT NULL
    CHECK (image_engine IN ('gemini','paper_banana')),
  ADD COLUMN quality_score INTEGER NULL CHECK (quality_score BETWEEN 0 AND 100),
  ADD COLUMN quality_status TEXT NULL
    CHECK (quality_status IN ('approved','review','rejected'));

-- Expand status constraint to include 'review' for PaperBanana moderation
ALTER TABLE campaign_assets DROP CONSTRAINT campaign_assets_status_check;
ALTER TABLE campaign_assets ADD CONSTRAINT campaign_assets_status_check
  CHECK (status IN ('pending_image','generating_image','ready','review','published'));
