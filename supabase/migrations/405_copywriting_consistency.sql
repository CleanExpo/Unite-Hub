-- Migration 405: Copywriting & Business Consistency Tables
-- Date: 2025-12-03
-- Purpose: Support VOC research, competitor analysis, conversion copywriting, and NAP consistency
-- Note: client_id columns are UUIDs without FK constraint for flexibility
--       (client_profiles table may be created in a different migration)

-- ============================================
-- 1. VOC Research - Customer quotes and insights
-- ============================================
CREATE TABLE IF NOT EXISTS voc_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID, -- References client_profiles if exists

  -- Source information
  source_type TEXT NOT NULL CHECK (source_type IN ('forum', 'review_site', 'social', 'interview', 'survey', 'support_ticket')),
  source_url TEXT,
  source_name TEXT, -- 'Reddit', 'ProductHunt', 'TrustPilot', 'Google Reviews'

  -- Quote data
  raw_quote TEXT NOT NULL,
  quote_author TEXT,
  quote_date DATE,

  -- Categorization (per Prompt 1 methodology)
  category TEXT NOT NULL CHECK (category IN ('pain_point', 'symptom', 'dream_outcome', 'failed_solution', 'buying_decision')),
  sub_category TEXT,

  -- Analysis
  sentiment_score INTEGER CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
  frequency_count INTEGER DEFAULT 1, -- How many times similar quote found
  keywords TEXT[],
  is_gold BOOLEAN DEFAULT FALSE, -- Repeated pattern = gold for messaging

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voc_research_workspace ON voc_research(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voc_research_client ON voc_research(client_id);
CREATE INDEX IF NOT EXISTS idx_voc_research_category ON voc_research(category);
CREATE INDEX IF NOT EXISTS idx_voc_research_gold ON voc_research(is_gold) WHERE is_gold = TRUE;

-- ============================================
-- 2. Competitor Analysis - Website structures
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID, -- References client_profiles if exists

  -- Competitor info
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  competitor_rank TEXT CHECK (competitor_rank IN ('national_leader', 'regional_top', 'local_competitor', 'emerging')),

  -- Analysis data (per Prompt 2 methodology)
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  page_structures JSONB, -- {homepage: [{section, order, content_summary}], about: [...], services: [...]}
  unique_features TEXT[], -- Features we might want to add
  messaging_patterns JSONB, -- {headlines: [], ctas: [], value_props: []}
  trust_signals TEXT[], -- Reviews, certifications, badges found

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_workspace ON competitor_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_client ON competitor_analysis(client_id);

-- ============================================
-- 3. Page Copy Templates - Conversion structures
-- ============================================
CREATE TABLE IF NOT EXISTS page_copy_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL for global templates

  -- Template definition
  page_type TEXT NOT NULL CHECK (page_type IN ('homepage', 'about', 'services', 'contact', 'landing', 'pricing', 'case_study', 'faq')),
  section_order JSONB NOT NULL, -- ['hero', 'problem', 'value_props', 'proof', 'process', 'pricing', 'faq', 'cta']
  section_guidelines JSONB, -- Per-section writing rules and examples

  -- Style settings
  tone_voice TEXT CHECK (tone_voice IN ('conversational', 'professional', 'friendly', 'authoritative', 'playful')),
  industry TEXT, -- 'trades', 'professional_services', 'healthcare', 'saas', 'ecommerce'

  -- Flags
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_copy_templates_workspace ON page_copy_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_page_copy_templates_type ON page_copy_templates(page_type);
CREATE INDEX IF NOT EXISTS idx_page_copy_templates_industry ON page_copy_templates(industry);

-- ============================================
-- 4. Generated Page Copy - Actual copy outputs
-- ============================================
CREATE TABLE IF NOT EXISTS generated_page_copy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID, -- References client_profiles if exists

  -- Copy content
  page_type TEXT NOT NULL,
  template_id UUID REFERENCES page_copy_templates(id) ON DELETE SET NULL,
  sections JSONB NOT NULL, -- {hero: {headline, subhead, cta}, problem: {copy}, value_props: [...], ...}

  -- Source tracking
  voc_quotes_used UUID[], -- References to voc_research quotes integrated
  competitor_insights_used UUID[], -- References to competitor_analysis used

  -- Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'revision_requested', 'approved', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  revision_notes TEXT,

  -- Authorship
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_page_copy_workspace ON generated_page_copy(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_page_copy_client ON generated_page_copy(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_page_copy_status ON generated_page_copy(status);

-- ============================================
-- 5. Business Consistency Master - Single source of truth
-- ============================================
CREATE TABLE IF NOT EXISTS business_consistency_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID, -- References client_profiles if exists

  -- Tier 1: Critical NAP (MUST be identical everywhere)
  legal_business_name TEXT NOT NULL,
  trading_name TEXT,
  street_address TEXT NOT NULL,
  address_line_2 TEXT,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'Australia',
  primary_phone TEXT NOT NULL,
  phone_format TEXT, -- Standard format to use: '(07) 3XXX XXXX'

  -- Tier 2: Essential
  website_url TEXT NOT NULL,
  email_address TEXT NOT NULL,
  business_hours JSONB, -- {monday: {open: '07:00', close: '17:00'}, ...}
  primary_category TEXT NOT NULL,
  secondary_categories TEXT[],

  -- Tier 3: Important
  short_description TEXT, -- 50 words for limited platforms
  medium_description TEXT, -- 100 words
  long_description TEXT, -- 250 words for platforms that allow it
  service_areas TEXT[],
  payment_methods TEXT[],

  -- Tier 4: Australia-specific
  abn TEXT, -- Format: XX XXX XXX XXX
  acn TEXT, -- Format: XXX XXX XXX
  license_numbers JSONB, -- {qbcc: '12345', electrical: '67890'}

  -- Social & Geo
  social_profiles JSONB, -- {facebook: 'url', instagram: 'url', linkedin: 'url', ...}
  geo_coordinates JSONB, -- {latitude: -27.4698, longitude: 153.0251}

  -- Auto-generated Schema Markup
  schema_local_business JSONB, -- Full JSON-LD for LocalBusiness
  schema_organization JSONB, -- Full JSON-LD for Organization

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One master document per workspace/client
  UNIQUE(workspace_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_business_consistency_workspace ON business_consistency_master(workspace_id);
CREATE INDEX IF NOT EXISTS idx_business_consistency_client ON business_consistency_master(client_id);

-- ============================================
-- 6. Citation Listings - Track platform consistency
-- ============================================
CREATE TABLE IF NOT EXISTS citation_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consistency_master_id UUID NOT NULL REFERENCES business_consistency_master(id) ON DELETE CASCADE,

  -- Platform info (per Business Consistency Framework)
  platform_name TEXT NOT NULL, -- 'google_business_profile', 'bing_places', 'apple_maps', 'facebook', etc.
  platform_tier INTEGER NOT NULL CHECK (platform_tier >= 1 AND platform_tier <= 5),
  platform_url TEXT, -- URL to platform listing
  listing_url TEXT, -- Direct URL to our business listing

  -- Status
  listing_status TEXT DEFAULT 'not_claimed' CHECK (listing_status IN ('not_claimed', 'claimed', 'pending_verification', 'verified', 'needs_update', 'suspended')),

  -- Consistency data
  current_nap JSONB, -- What's currently on the platform {name, address, phone}
  is_consistent BOOLEAN,
  inconsistencies TEXT[], -- List of what doesn't match master

  -- Tracking
  last_checked TIMESTAMPTZ,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citation_listings_master ON citation_listings(consistency_master_id);
CREATE INDEX IF NOT EXISTS idx_citation_listings_platform ON citation_listings(platform_name);
CREATE INDEX IF NOT EXISTS idx_citation_listings_tier ON citation_listings(platform_tier);
CREATE INDEX IF NOT EXISTS idx_citation_listings_consistent ON citation_listings(is_consistent);

-- ============================================
-- 7. Consistency Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS consistency_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consistency_master_id UUID NOT NULL REFERENCES business_consistency_master(id) ON DELETE CASCADE,

  -- Audit info
  audit_type TEXT NOT NULL CHECK (audit_type IN ('full_audit', 'spot_check', 'auto_sync', 'manual_update')),
  platforms_checked TEXT[],

  -- Results
  issues_found INTEGER DEFAULT 0,
  issues_resolved INTEGER DEFAULT 0,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Detailed report
  audit_report JSONB, -- {tier1_score, tier2_score, platform_results: [...], recommendations: [...]}

  -- Metadata
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consistency_audit_master ON consistency_audit_log(consistency_master_id);
CREATE INDEX IF NOT EXISTS idx_consistency_audit_date ON consistency_audit_log(created_at DESC);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE voc_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_copy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_page_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_consistency_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_audit_log ENABLE ROW LEVEL SECURITY;

-- VOC Research policies
CREATE POLICY "voc_research_workspace_select" ON voc_research
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.is_active = true
    )
  );

CREATE POLICY "voc_research_workspace_insert" ON voc_research
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.is_active = true
    )
  );

CREATE POLICY "voc_research_workspace_update" ON voc_research
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.is_active = true
    )
  );

CREATE POLICY "voc_research_workspace_delete" ON voc_research
  FOR DELETE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin') AND uo.is_active = true
    )
  );

-- Similar policies for other tables (abbreviated for brevity)
CREATE POLICY "competitor_analysis_select" ON competitor_analysis FOR SELECT USING (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "competitor_analysis_insert" ON competitor_analysis FOR INSERT WITH CHECK (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);

CREATE POLICY "page_copy_templates_select" ON page_copy_templates FOR SELECT USING (
  workspace_id IS NULL OR workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "page_copy_templates_insert" ON page_copy_templates FOR INSERT WITH CHECK (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin') AND uo.is_active = true)
);

CREATE POLICY "generated_page_copy_select" ON generated_page_copy FOR SELECT USING (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "generated_page_copy_insert" ON generated_page_copy FOR INSERT WITH CHECK (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "generated_page_copy_update" ON generated_page_copy FOR UPDATE USING (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);

CREATE POLICY "business_consistency_master_select" ON business_consistency_master FOR SELECT USING (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "business_consistency_master_insert" ON business_consistency_master FOR INSERT WITH CHECK (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);
CREATE POLICY "business_consistency_master_update" ON business_consistency_master FOR UPDATE USING (
  workspace_id IN (SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true)
);

CREATE POLICY "citation_listings_select" ON citation_listings FOR SELECT USING (
  consistency_master_id IN (SELECT id FROM business_consistency_master WHERE workspace_id IN (
    SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true
  ))
);
CREATE POLICY "citation_listings_insert" ON citation_listings FOR INSERT WITH CHECK (
  consistency_master_id IN (SELECT id FROM business_consistency_master WHERE workspace_id IN (
    SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true
  ))
);
CREATE POLICY "citation_listings_update" ON citation_listings FOR UPDATE USING (
  consistency_master_id IN (SELECT id FROM business_consistency_master WHERE workspace_id IN (
    SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true
  ))
);

CREATE POLICY "consistency_audit_log_select" ON consistency_audit_log FOR SELECT USING (
  consistency_master_id IN (SELECT id FROM business_consistency_master WHERE workspace_id IN (
    SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true
  ))
);
CREATE POLICY "consistency_audit_log_insert" ON consistency_audit_log FOR INSERT WITH CHECK (
  consistency_master_id IN (SELECT id FROM business_consistency_master WHERE workspace_id IN (
    SELECT w.id FROM workspaces w JOIN user_organizations uo ON uo.org_id = w.org_id WHERE uo.user_id = auth.uid() AND uo.is_active = true
  ))
);

-- ============================================
-- Seed Default Page Copy Templates
-- ============================================
INSERT INTO page_copy_templates (page_type, section_order, section_guidelines, tone_voice, industry, is_default) VALUES
(
  'homepage',
  '["hero", "problem", "value_props", "proof", "process", "faq", "cta"]',
  '{
    "hero": {"purpose": "Grab attention with customer-centric headline", "length": "15-25 words for headline, 30-50 for subhead"},
    "problem": {"purpose": "Address their pain using VOC language", "length": "50-100 words"},
    "value_props": {"purpose": "3-4 key benefits", "length": "15-25 words each"},
    "proof": {"purpose": "Testimonials, stats, case studies", "count": "2-3 items"},
    "process": {"purpose": "How it works in 3-5 steps", "length": "10-20 words per step"},
    "faq": {"purpose": "Common questions", "count": "4-6 items"},
    "cta": {"purpose": "Final push to action", "length": "10-15 words"}
  }',
  'conversational',
  NULL,
  true
),
(
  'about',
  '["hero", "story", "team", "values", "credentials", "cta"]',
  '{
    "hero": {"purpose": "Who we are in one sentence"},
    "story": {"purpose": "Origin story, why we started", "length": "100-150 words"},
    "team": {"purpose": "Key people with photos"},
    "values": {"purpose": "3-5 core values"},
    "credentials": {"purpose": "Licenses, certifications, awards"},
    "cta": {"purpose": "Connect with us"}
  }',
  'friendly',
  NULL,
  true
),
(
  'services',
  '["hero", "services_overview", "service_details", "process", "pricing_teaser", "proof", "cta"]',
  '{
    "hero": {"purpose": "What we do best"},
    "services_overview": {"purpose": "Brief list of all services"},
    "service_details": {"purpose": "Detailed breakdown of each service"},
    "process": {"purpose": "How we work together"},
    "pricing_teaser": {"purpose": "Starting from or get a quote"},
    "proof": {"purpose": "Relevant testimonials"},
    "cta": {"purpose": "Get started or request quote"}
  }',
  'professional',
  NULL,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE voc_research IS 'Voice of Customer research - stores exact customer quotes from forums, reviews, etc.';
COMMENT ON TABLE competitor_analysis IS 'Competitor website analysis - page structures and messaging patterns';
COMMENT ON TABLE page_copy_templates IS 'Conversion-optimized page structure templates';
COMMENT ON TABLE generated_page_copy IS 'AI-generated page copy with approval workflow';
COMMENT ON TABLE business_consistency_master IS 'Single source of truth for NAP data across all platforms';
COMMENT ON TABLE citation_listings IS 'Tracks NAP consistency across citation platforms';
COMMENT ON TABLE consistency_audit_log IS 'History of NAP consistency audits';
