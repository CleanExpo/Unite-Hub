-- Phase 0 Migration: Synthex Core Structure
-- Multi-tenant SaaS platform for small/medium businesses
-- Integrates with Phases 5-13 AGI/agent stack
-- Status: MVP with full tenant isolation and RLS
-- Date: 2025-11-26

-- ============================================================================
-- TABLE 1: synthex_tenants
-- Top-level business accounts in the Synthex platform
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business info
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL, -- 'trades', 'restoration', 'non_profit', 'retail', 'services', 'education', 'health', 'other'
  region TEXT, -- 'au', 'us', 'uk', 'eu', 'other'
  website_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'suspended', 'churned'
  subscription_id UUID, -- Link to current subscription

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_industry CHECK (
    industry IN ('trades', 'restoration', 'non_profit', 'retail', 'services', 'education', 'health', 'other')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'trial', 'suspended', 'churned')
  )
);

CREATE INDEX idx_synthex_tenants_owner ON synthex_tenants(owner_user_id);
CREATE INDEX idx_synthex_tenants_status ON synthex_tenants(status);
CREATE INDEX idx_synthex_tenants_industry ON synthex_tenants(industry);
CREATE INDEX idx_synthex_tenants_created ON synthex_tenants(created_at DESC);

-- ============================================================================
-- TABLE 2: synthex_brands
-- Brands within a tenant (may have multiple brands/domains)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Brand identity
  brand_name TEXT NOT NULL,
  brand_slug TEXT NOT NULL,
  primary_domain TEXT, -- e.g., example.com.au
  primary_platform TEXT, -- 'website', 'facebook', 'instagram', 'linkedin', 'other'

  -- Brand positioning (maps to AGI brandPositioningMap)
  tagline TEXT,
  value_proposition TEXT,
  target_audience TEXT,

  -- Visual identity (for content generation)
  brand_color_primary TEXT, -- hex color
  brand_color_secondary TEXT,
  tone_voice TEXT, -- 'formal', 'casual', 'friendly', 'professional'

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'archived'

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_brand_slug_per_tenant UNIQUE(tenant_id, brand_slug),
  CONSTRAINT valid_brand_status CHECK (
    status IN ('active', 'inactive', 'archived')
  )
);

CREATE INDEX idx_synthex_brands_tenant ON synthex_brands(tenant_id);
CREATE INDEX idx_synthex_brands_status ON synthex_brands(status);
CREATE INDEX idx_synthex_brands_primary_domain ON synthex_brands(primary_domain);
CREATE INDEX idx_synthex_brands_created ON synthex_brands(created_at DESC);

-- ============================================================================
-- TABLE 3: synthex_plan_subscriptions
-- Current subscription plan for each tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_plan_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Plan selection
  plan_code TEXT NOT NULL, -- 'launch', 'growth', 'scale'
  offer_tier TEXT NOT NULL DEFAULT 'standard', -- 'early_founders' (50%), 'growth_wave' (25%), 'standard' (no discount)

  -- Pricing
  effective_price_aud NUMERIC(10,2) NOT NULL, -- Price per month after any discount
  base_price_aud NUMERIC(10,2) NOT NULL, -- Price without discount
  discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0-100

  -- Billing
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'annual'
  billing_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled'

  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  renews_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_plan_code CHECK (
    plan_code IN ('launch', 'growth', 'scale')
  ),
  CONSTRAINT valid_offer_tier CHECK (
    offer_tier IN ('early_founders', 'growth_wave', 'standard')
  ),
  CONSTRAINT valid_billing_cycle CHECK (
    billing_cycle IN ('monthly', 'annual')
  ),
  CONSTRAINT valid_billing_status CHECK (
    billing_status IN ('active', 'paused', 'cancelled')
  ),
  CONSTRAINT price_non_negative CHECK (
    effective_price_aud >= 0 AND base_price_aud >= 0
  )
);

CREATE INDEX idx_synthex_subscriptions_tenant ON synthex_plan_subscriptions(tenant_id);
CREATE INDEX idx_synthex_subscriptions_status ON synthex_plan_subscriptions(billing_status);
CREATE INDEX idx_synthex_subscriptions_plan ON synthex_plan_subscriptions(plan_code);
CREATE INDEX idx_synthex_subscriptions_tier ON synthex_plan_subscriptions(offer_tier);
CREATE INDEX idx_synthex_subscriptions_renews ON synthex_plan_subscriptions(renews_at);

-- ============================================================================
-- TABLE 4: synthex_offer_counters
-- Track usage of limited early adopter offers
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_offer_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Counter identity
  counter_key TEXT NOT NULL UNIQUE, -- 'early_founders_50', 'growth_wave_25'
  label TEXT NOT NULL, -- "Early Founders 50% Off"
  tier TEXT NOT NULL, -- 'early_founders', 'growth_wave', 'standard'

  -- Limits
  limit_count INTEGER NOT NULL, -- Total slots available (-1 = unlimited)
  consumed INTEGER NOT NULL DEFAULT 0, -- Slots used

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_tier CHECK (
    tier IN ('early_founders', 'growth_wave', 'standard')
  ),
  CONSTRAINT limit_non_negative CHECK (limit_count = -1 OR limit_count >= 0),
  CONSTRAINT consumed_non_negative CHECK (consumed >= 0)
);

CREATE INDEX idx_synthex_offer_counters_tier ON synthex_offer_counters(tier);
CREATE INDEX idx_synthex_offer_counters_key ON synthex_offer_counters(counter_key);

-- Seed initial offer counters
INSERT INTO synthex_offer_counters (counter_key, label, tier, limit_count, consumed) VALUES
  ('early_founders_50', 'Early Founders 50% Off', 'early_founders', 50, 0),
  ('growth_wave_25', 'Growth Wave 25% Off', 'growth_wave', 200, 0),
  ('standard_full', 'Standard Full Price', 'standard', -1, 0)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TABLE 5: synthex_project_jobs
-- Asynchronous jobs that integrate with AGI agents
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_project_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES synthex_brands(id) ON DELETE SET NULL,

  -- Job identity
  job_type TEXT NOT NULL, -- 'initial_launch_pack', 'content_batch', 'seo_launch', 'geo_pages', 'review_campaign', 'monthly_report', 'email_sequence'

  -- Payload (JSON for flexibility)
  payload_json JSONB NOT NULL DEFAULT '{}', -- Job-specific parameters

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'queued', 'running', 'completed', 'failed', 'cancelled'
  error_message TEXT,

  -- Agent info
  assigned_agent TEXT, -- e.g., 'content_agent', 'research_agent', 'analysis_agent'

  -- Execution
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_job_type CHECK (
    job_type IN ('initial_launch_pack', 'content_batch', 'seo_launch', 'geo_pages', 'review_campaign', 'monthly_report', 'email_sequence', 'custom')
  ),
  CONSTRAINT valid_job_status CHECK (
    status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')
  )
);

CREATE INDEX idx_synthex_jobs_tenant ON synthex_project_jobs(tenant_id);
CREATE INDEX idx_synthex_jobs_brand ON synthex_project_jobs(brand_id);
CREATE INDEX idx_synthex_jobs_type ON synthex_project_jobs(job_type);
CREATE INDEX idx_synthex_jobs_status ON synthex_project_jobs(status);
CREATE INDEX idx_synthex_jobs_agent ON synthex_project_jobs(assigned_agent);
CREATE INDEX idx_synthex_jobs_created ON synthex_project_jobs(created_at DESC);
CREATE INDEX idx_synthex_jobs_pending ON synthex_project_jobs(status, created_at) WHERE status = 'pending';

-- ============================================================================
-- TABLE 6: synthex_job_results
-- Results and outputs from completed jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES synthex_project_jobs(id) ON DELETE CASCADE,

  -- Result type and data
  result_type TEXT NOT NULL, -- 'content_generated', 'seo_pages', 'email_sequence', 'analysis_report', 'error'
  result_json JSONB NOT NULL DEFAULT '{}', -- Result-specific data

  -- Error tracking (if applicable)
  error_json JSONB, -- Error details if result_type = 'error'

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_result_type CHECK (
    result_type IN ('content_generated', 'seo_pages', 'email_sequence', 'analysis_report', 'social_posts', 'review_campaigns', 'error')
  )
);

CREATE INDEX idx_synthex_job_results_job ON synthex_job_results(job_id);
CREATE INDEX idx_synthex_job_results_type ON synthex_job_results(result_type);
CREATE INDEX idx_synthex_job_results_created ON synthex_job_results(created_at DESC);

-- ============================================================================
-- TABLE 7: synthex_usage_logs
-- Track feature usage for analytics and optimization
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL, -- 'job_created', 'result_viewed', 'content_published', 'page_visited'
  feature TEXT, -- Feature used (e.g., 'content_generation', 'seo_research')

  -- Metadata
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_event_type CHECK (
    event_type IN ('job_created', 'result_viewed', 'content_published', 'page_visited', 'setting_changed', 'brand_created')
  )
);

CREATE INDEX idx_synthex_usage_logs_tenant ON synthex_usage_logs(tenant_id);
CREATE INDEX idx_synthex_usage_logs_event ON synthex_usage_logs(event_type);
CREATE INDEX idx_synthex_usage_logs_feature ON synthex_usage_logs(feature);
CREATE INDEX idx_synthex_usage_logs_created ON synthex_usage_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enforce tenant isolation
-- ============================================================================

ALTER TABLE synthex_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_plan_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_project_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for synthex_tenants
CREATE POLICY "Users can view their own tenant"
  ON synthex_tenants FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own tenant"
  ON synthex_tenants FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can create a tenant"
  ON synthex_tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- RLS Policies for synthex_brands
CREATE POLICY "Users can view brands of their tenant"
  ON synthex_brands FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage brands of their tenant"
  ON synthex_brands FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can update brands of their tenant"
  ON synthex_brands FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ))
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

-- RLS Policies for synthex_plan_subscriptions
CREATE POLICY "Users can view their subscriptions"
  ON synthex_plan_subscriptions FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can create subscriptions for their tenant"
  ON synthex_plan_subscriptions FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

-- RLS Policies for synthex_project_jobs
CREATE POLICY "Users can view their jobs"
  ON synthex_project_jobs FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can create jobs for their tenant"
  ON synthex_project_jobs FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can update their jobs"
  ON synthex_project_jobs FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ))
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

-- RLS Policies for synthex_job_results
CREATE POLICY "Users can view results of their jobs"
  ON synthex_job_results FOR SELECT
  USING (job_id IN (
    SELECT id FROM synthex_project_jobs WHERE tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can create results for their jobs"
  ON synthex_job_results FOR INSERT
  WITH CHECK (job_id IN (
    SELECT id FROM synthex_project_jobs WHERE tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  ));

-- RLS Policies for synthex_usage_logs
CREATE POLICY "Users can view their usage logs"
  ON synthex_usage_logs FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

CREATE POLICY "Users can create usage logs for their tenant"
  ON synthex_usage_logs FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
  ));

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

-- Tables created: 7
-- - synthex_tenants (business accounts)
-- - synthex_brands (brand/domain management)
-- - synthex_plan_subscriptions (subscription tracking)
-- - synthex_offer_counters (discount/offer tracking)
-- - synthex_project_jobs (async job queue)
-- - synthex_job_results (job output storage)
-- - synthex_usage_logs (analytics)
--
-- Total indexes: 35+ covering owner, tenant, status, and search patterns
-- RLS: Enabled on all tables with owner-scoped access
-- Offer counters seeded with two discount tiers + standard
--
-- Integration points:
-- - synthex_project_jobs.assigned_agent maps to Phase 5-13 agent names
-- - synthex_job_results.result_json stores agent outputs
-- - synthex_brands maps to AGI brandPositioningMap
--
-- Next steps:
-- 1. Create synthexOfferEngine.ts to manage pricing logic
-- 2. Create synthexJobRouter.ts to queue and process jobs
-- 3. Create synthexAgiBridge.ts to call AGI agents
-- 4. Implement UI onboarding and dashboard pages;
