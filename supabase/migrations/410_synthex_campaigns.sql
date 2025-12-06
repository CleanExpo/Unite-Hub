-- Migration: 410_synthex_campaigns
-- Description: Create table for email/drip campaigns
-- Created: 2025-12-06
-- Phase: B3 - Synthex Campaigns

-- ============================================================================
-- Table: synthex_campaigns
-- ============================================================================
-- Stores campaign definitions including email sequences and drip campaigns.
-- Supports both one-time sends and automated sequences.

CREATE TABLE IF NOT EXISTS synthex_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant scope
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES synthex_brands(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Campaign metadata
  name TEXT NOT NULL,
  description TEXT NULL,
  type TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'drip', 'automation', 'sequence')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),

  -- Campaign steps (JSON array of step definitions)
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Scheduling
  scheduled_at TIMESTAMPTZ NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,

  -- Targeting
  target_audience JSONB NULL, -- Filter criteria for recipients
  recipient_count INTEGER NULL,

  -- Performance metrics (denormalized for quick access)
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  emails_unsubscribed INTEGER NOT NULL DEFAULT 0,

  -- Settings
  settings JSONB NULL,

  -- Flexible metadata
  meta JSONB NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_steps CHECK (jsonb_typeof(steps) = 'array'),
  CONSTRAINT valid_target_audience CHECK (target_audience IS NULL OR jsonb_typeof(target_audience) = 'object'),
  CONSTRAINT valid_settings CHECK (settings IS NULL OR jsonb_typeof(settings) = 'object'),
  CONSTRAINT valid_meta CHECK (meta IS NULL OR jsonb_typeof(meta) = 'object')
);

-- ============================================================================
-- Table: synthex_campaign_enrollments
-- ============================================================================
-- Tracks individual contacts enrolled in campaigns

CREATE TABLE IF NOT EXISTS synthex_campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL REFERENCES synthex_campaigns(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT NULL,

  -- Progress tracking
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unsubscribed', 'bounced', 'paused')),

  -- Step completion tracking
  steps_completed JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_step_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,

  -- Unique enrollment per contact per campaign
  CONSTRAINT unique_campaign_contact UNIQUE (campaign_id, contact_email)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary query: list campaigns by tenant
DROP INDEX IF EXISTS idx_campaigns_tenant_created;
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_created
  ON synthex_campaigns(tenant_id, created_at DESC);

-- Filter by status
DROP INDEX IF EXISTS idx_campaigns_tenant_status;
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_status
  ON synthex_campaigns(tenant_id, status, created_at DESC);

-- Filter by type
DROP INDEX IF EXISTS idx_campaigns_tenant_type;
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_type
  ON synthex_campaigns(tenant_id, type, created_at DESC);

-- Filter by brand
DROP INDEX IF EXISTS idx_campaigns_tenant_brand;
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_brand
  ON synthex_campaigns(tenant_id, brand_id, created_at DESC)
  WHERE brand_id IS NOT NULL;

-- Active campaigns for processing
DROP INDEX IF EXISTS idx_campaigns_active;
CREATE INDEX IF NOT EXISTS idx_campaigns_active
  ON synthex_campaigns(status, scheduled_at)
  WHERE status IN ('scheduled', 'active');

-- Enrollments lookup
DROP INDEX IF EXISTS idx_enrollments_campaign;
CREATE INDEX IF NOT EXISTS idx_enrollments_campaign
  ON synthex_campaign_enrollments(campaign_id, status);

DROP INDEX IF EXISTS idx_enrollments_contact;
CREATE INDEX IF NOT EXISTS idx_enrollments_contact
  ON synthex_campaign_enrollments(contact_email, campaign_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE synthex_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_campaign_enrollments ENABLE ROW LEVEL SECURITY;

-- Tenant owners can view campaigns
DROP POLICY IF EXISTS "Tenant owners can view campaigns" ON synthex_campaigns;
CREATE POLICY "Tenant owners can view campaigns"
  ON synthex_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_campaigns.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can create campaigns
DROP POLICY IF EXISTS "Tenant owners can insert campaigns" ON synthex_campaigns;
CREATE POLICY "Tenant owners can insert campaigns"
  ON synthex_campaigns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_campaigns.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can update campaigns
DROP POLICY IF EXISTS "Tenant owners can update campaigns" ON synthex_campaigns;
CREATE POLICY "Tenant owners can update campaigns"
  ON synthex_campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_campaigns.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Tenant owners can delete campaigns
DROP POLICY IF EXISTS "Tenant owners can delete campaigns" ON synthex_campaigns;
CREATE POLICY "Tenant owners can delete campaigns"
  ON synthex_campaigns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM synthex_tenants
      WHERE synthex_tenants.id = synthex_campaigns.tenant_id
      AND synthex_tenants.owner_user_id = auth.uid()
    )
  );

-- Enrollments follow campaign ownership
DROP POLICY IF EXISTS "Campaign owners can view enrollments" ON synthex_campaign_enrollments;
CREATE POLICY "Campaign owners can view enrollments"
  ON synthex_campaign_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM synthex_campaigns c
      JOIN synthex_tenants t ON t.id = c.tenant_id
      WHERE c.id = synthex_campaign_enrollments.campaign_id
      AND t.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Campaign owners can manage enrollments" ON synthex_campaign_enrollments;
CREATE POLICY "Campaign owners can manage enrollments"
  ON synthex_campaign_enrollments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM synthex_campaigns c
      JOIN synthex_tenants t ON t.id = c.tenant_id
      WHERE c.id = synthex_campaign_enrollments.campaign_id
      AND t.owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_synthex_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_synthex_campaigns_updated_at ON synthex_campaigns;
CREATE TRIGGER trigger_synthex_campaigns_updated_at
  BEFORE UPDATE ON synthex_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_campaigns_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE synthex_campaigns IS 'Email and drip campaigns for Synthex clients';
COMMENT ON COLUMN synthex_campaigns.type IS 'Campaign type: email (one-time), drip (sequence), automation, sequence';
COMMENT ON COLUMN synthex_campaigns.status IS 'Campaign status: draft, scheduled, active, paused, completed, archived';
COMMENT ON COLUMN synthex_campaigns.steps IS 'JSON array of campaign steps (emails, delays, conditions)';
COMMENT ON COLUMN synthex_campaigns.target_audience IS 'Filter criteria for selecting recipients';
COMMENT ON COLUMN synthex_campaigns.settings IS 'Campaign settings (send times, tracking, etc.)';

COMMENT ON TABLE synthex_campaign_enrollments IS 'Tracks contacts enrolled in campaigns';
COMMENT ON COLUMN synthex_campaign_enrollments.current_step IS 'Current step index in the campaign';
COMMENT ON COLUMN synthex_campaign_enrollments.steps_completed IS 'JSON array of completed step IDs with timestamps';
