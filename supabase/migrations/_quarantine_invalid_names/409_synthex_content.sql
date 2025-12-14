-- Migration: 409_synthex_content
-- Description: Create table for AI-generated content library
-- Created: 2025-12-06
-- Phase: B3 - Synthex Content Library

-- ============================================================================
-- Table: synthex_content
-- ============================================================================
-- Stores all AI-generated content for Synthex clients.
-- Supports multiple content types with approval workflow.

CREATE TABLE IF NOT EXISTS synthex_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant scope
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES synthex_brands(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Content metadata
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'blog', 'social', 'image', 'landing_page', 'ad_copy', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived')),

  -- Content body
  content_markdown TEXT NULL,
  content_html TEXT NULL,
  content_plain TEXT NULL,

  -- Organization
  tags TEXT[] NULL,
  category TEXT NULL,

  -- AI generation metadata
  prompt_used TEXT NULL,
  model_version TEXT NULL,
  generation_params JSONB NULL,

  -- Approval workflow
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  review_notes TEXT NULL,

  -- Publishing
  published_at TIMESTAMPTZ NULL,
  publish_url TEXT NULL,

  -- Flexible metadata
  meta JSONB NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_generation_params CHECK (generation_params IS NULL OR jsonb_typeof(generation_params) = 'object'),
  CONSTRAINT valid_meta CHECK (meta IS NULL OR jsonb_typeof(meta) = 'object')
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary query: list content by tenant ordered by date
DROP INDEX IF EXISTS idx_content_tenant_created;
CREATE INDEX IF NOT EXISTS idx_content_tenant_created
  ON synthex_content(tenant_id, created_at DESC);

-- Filter by status for workflow
DROP INDEX IF EXISTS idx_content_tenant_status;
CREATE INDEX IF NOT EXISTS idx_content_tenant_status
  ON synthex_content(tenant_id, status, created_at DESC);

-- Filter by type
DROP INDEX IF EXISTS idx_content_tenant_type;
CREATE INDEX IF NOT EXISTS idx_content_tenant_type
  ON synthex_content(tenant_id, type, created_at DESC);

-- Filter by brand
DROP INDEX IF EXISTS idx_content_tenant_brand;
CREATE INDEX IF NOT EXISTS idx_content_tenant_brand
  ON synthex_content(tenant_id, brand_id, created_at DESC)
  WHERE brand_id IS NOT NULL;

-- Tag search using GIN
DROP INDEX IF EXISTS idx_content_tags;
CREATE INDEX IF NOT EXISTS idx_content_tags
  ON synthex_content USING GIN (tags);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE synthex_content ENABLE ROW LEVEL SECURITY;

-- Tenant owners can view all content for their tenant
DROP POLICY IF EXISTS "Tenant owners can view content" ON synthex_content;
CREATE POLICY "Tenant owners can view content"
  ON synthex_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_content.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can insert content
DROP POLICY IF EXISTS "Tenant owners can insert content" ON synthex_content;
CREATE POLICY "Tenant owners can insert content"
  ON synthex_content
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_content.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can update content
DROP POLICY IF EXISTS "Tenant owners can update content" ON synthex_content;
CREATE POLICY "Tenant owners can update content"
  ON synthex_content
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_content.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can delete content
DROP POLICY IF EXISTS "Tenant owners can delete content" ON synthex_content;
CREATE POLICY "Tenant owners can delete content"
  ON synthex_content
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_content.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_synthex_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_synthex_content_updated_at ON synthex_content;
CREATE TRIGGER trigger_synthex_content_updated_at
  BEFORE UPDATE ON synthex_content
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_content_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE synthex_content IS 'AI-generated content library for Synthex clients';
COMMENT ON COLUMN synthex_content.tenant_id IS 'Synthex tenant this content belongs to';
COMMENT ON COLUMN synthex_content.brand_id IS 'Optional brand context for the content';
COMMENT ON COLUMN synthex_content.type IS 'Content type: email, blog, social, image, landing_page, ad_copy, other';
COMMENT ON COLUMN synthex_content.status IS 'Workflow status: draft, pending_review, approved, rejected, published, archived';
COMMENT ON COLUMN synthex_content.content_markdown IS 'Content in Markdown format';
COMMENT ON COLUMN synthex_content.content_html IS 'Content rendered as HTML';
COMMENT ON COLUMN synthex_content.prompt_used IS 'AI prompt that generated this content';
COMMENT ON COLUMN synthex_content.model_version IS 'AI model used for generation';
COMMENT ON COLUMN synthex_content.reviewed_by IS 'User who approved/rejected the content';
COMMENT ON COLUMN synthex_content.meta IS 'Flexible metadata (seo_data, social_handles, etc.)';
