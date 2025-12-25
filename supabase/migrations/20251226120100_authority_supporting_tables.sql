-- =====================================================================
-- AI Authority Supporting Tables
-- Migration: 20251226120100_authority_supporting_tables.sql
-- Purpose: Supporting tables for Scout, Auditor, Reflector agents and workers
-- Dependencies: client_jobs table, workspaces table
-- =====================================================================

-- =====================================================================
-- Table: information_vacuums
-- Stores discovered market gaps from Scout Agent
-- =====================================================================
CREATE TABLE IF NOT EXISTS information_vacuums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Vacuum classification
  vacuum_type TEXT NOT NULL CHECK (vacuum_type IN ('geographic', 'content')),
  pathway TEXT NOT NULL CHECK (pathway IN ('geographic', 'content', 'hybrid')),

  -- Geographic vacuum data
  target_suburb TEXT,
  target_state TEXT CHECK (target_state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  target_keyword TEXT NOT NULL,

  -- Gap analysis
  gap_severity NUMERIC(5, 2) CHECK (gap_severity >= 0 AND gap_severity <= 100), -- 0-100 scale
  competitor_density TEXT CHECK (competitor_density IN ('none', 'low', 'medium', 'high')),
  search_volume_estimate TEXT CHECK (search_volume_estimate IN ('low', 'medium', 'high', 'very_high')),

  -- Scout findings
  scout_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
  Expected structure:
  {
    "top_competitors": ["Business A", "Business B"],
    "serp_density": 3,
    "local_pack_present": false,
    "content_gaps": ["no_testimonials", "no_photos", "no_pricing"],
    "opportunity_description": "No local businesses ranking for 'glass balustrades Ipswich'",
    "recommended_actions": ["Create service page", "Add local schema markup"]
  }
  */

  -- Audit status
  visual_audit_requested BOOLEAN DEFAULT false,
  visual_audit_id UUID, -- FK added after synthex_visual_audits table creation
  visual_audit_completed_at TIMESTAMPTZ,

  -- Prioritization
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'auditing', 'audited', 'actioned', 'dismissed')),

  -- Metadata
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discovered_by TEXT, -- 'scout_agent' or 'manual'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_information_vacuums_workspace
  ON information_vacuums(workspace_id);

CREATE INDEX IF NOT EXISTS idx_information_vacuums_client
  ON information_vacuums(client_id);

CREATE INDEX IF NOT EXISTS idx_information_vacuums_type_status
  ON information_vacuums(workspace_id, vacuum_type, status);

CREATE INDEX IF NOT EXISTS idx_information_vacuums_priority
  ON information_vacuums(workspace_id, priority DESC, discovered_at DESC)
  WHERE status = 'discovered';

CREATE INDEX IF NOT EXISTS idx_information_vacuums_suburb
  ON information_vacuums(workspace_id, target_suburb, target_state)
  WHERE vacuum_type = 'geographic';

-- RLS Policies
ALTER TABLE information_vacuums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON information_vacuums;
CREATE POLICY "tenant_isolation_select" ON information_vacuums
  FOR SELECT
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_insert" ON information_vacuums;
CREATE POLICY "tenant_isolation_insert" ON information_vacuums
  FOR INSERT
  WITH CHECK (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_update" ON information_vacuums;
CREATE POLICY "tenant_isolation_update" ON information_vacuums
  FOR UPDATE
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_delete" ON information_vacuums;
CREATE POLICY "tenant_isolation_delete" ON information_vacuums
  FOR DELETE
  USING (workspace_id = get_current_workspace_id());

-- =====================================================================
-- Table: synthex_visual_audits
-- Stores visual gap recordings from Auditor Agent
-- =====================================================================
CREATE TABLE IF NOT EXISTS synthex_visual_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  information_vacuum_id UUID REFERENCES information_vacuums(id) ON DELETE SET NULL,

  -- Target identification
  keyword TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),

  -- Output artifacts (dual format per user requirement)
  video_url TEXT, -- Loom-style walkthrough (Supabase Storage or S3)
  static_page_url TEXT, -- Next.js generated page (/suburbs/[state]/[suburb]/[keyword])

  -- Visual evidence
  search_gap_screenshots TEXT[], -- Array of screenshot URLs
  overlaid_proof_screenshots TEXT[], -- Screenshots with client proof overlays
  browser_session_metadata JSONB DEFAULT '{}'::jsonb,
  /*
  Expected structure:
  {
    "recording_duration_ms": 30000,
    "competitor_count": 3,
    "local_pack_present": false,
    "client_proof_photos_used": ["photo1.jpg", "photo2.jpg"],
    "narration_script": "Notice no ABC Plumbing appearing for...",
    "gemini_computer_use_actions": ["scroll", "click_more_results"]
  }
  */

  -- Generation metadata
  generated_by TEXT DEFAULT 'auditor_agent',
  generation_model TEXT, -- e.g., "gemini-2.5-pro-computer-use-preview-10-2025"
  generation_cost_usd NUMERIC(10, 6),

  -- Status & tracking
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'expired')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days') -- Auto-expire old audits
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_visual_audits_workspace
  ON synthex_visual_audits(workspace_id);

CREATE INDEX IF NOT EXISTS idx_synthex_visual_audits_client
  ON synthex_visual_audits(client_id);

CREATE INDEX IF NOT EXISTS idx_synthex_visual_audits_vacuum
  ON synthex_visual_audits(information_vacuum_id);

CREATE INDEX IF NOT EXISTS idx_synthex_visual_audits_suburb
  ON synthex_visual_audits(workspace_id, suburb, state);

CREATE INDEX IF NOT EXISTS idx_synthex_visual_audits_status
  ON synthex_visual_audits(workspace_id, status, created_at DESC);

-- RLS Policies
ALTER TABLE synthex_visual_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON synthex_visual_audits;
CREATE POLICY "tenant_isolation_select" ON synthex_visual_audits
  FOR SELECT
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_insert" ON synthex_visual_audits;
CREATE POLICY "tenant_isolation_insert" ON synthex_visual_audits
  FOR INSERT
  WITH CHECK (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_update" ON synthex_visual_audits;
CREATE POLICY "tenant_isolation_update" ON synthex_visual_audits
  FOR UPDATE
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_delete" ON synthex_visual_audits;
CREATE POLICY "tenant_isolation_delete" ON synthex_visual_audits
  FOR DELETE
  USING (workspace_id = get_current_workspace_id());

-- =====================================================================
-- Table: synthex_suburb_mapping
-- Stores pre-analyzed suburb data from mapping worker (15K+ AU suburbs)
-- =====================================================================
CREATE TABLE IF NOT EXISTS synthex_suburb_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Geographic identification
  suburb TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  postcode TEXT NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),

  -- Service category (allows multi-service analysis)
  service_category TEXT NOT NULL, -- e.g., "plumber", "electrician", "glass_balustrades"

  -- Market analysis (from Gemini)
  search_volume TEXT CHECK (search_volume IN ('low', 'medium', 'high', 'very_high')),
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  top_businesses JSONB DEFAULT '[]'::jsonb, -- Array of {name, url, ranking}
  gap_opportunities TEXT[], -- Array of opportunity descriptions
  local_keywords TEXT[], -- Suburb-specific keyword variations

  -- Full analysis (raw Gemini output)
  analysis JSONB DEFAULT '{}'::jsonb,

  -- Analysis metadata
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_by TEXT DEFAULT 'suburb_mapping_worker',
  model_used TEXT, -- e.g., "gemini-2.0-flash"
  analysis_cost_usd NUMERIC(10, 6),

  -- Constraints
  UNIQUE(suburb, state, service_category)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_suburb_mapping_suburb_state
  ON synthex_suburb_mapping(suburb, state, service_category);

CREATE INDEX IF NOT EXISTS idx_synthex_suburb_mapping_competition
  ON synthex_suburb_mapping(state, service_category, competition)
  WHERE competition IN ('low', 'medium');

CREATE INDEX IF NOT EXISTS idx_synthex_suburb_mapping_analyzed_at
  ON synthex_suburb_mapping(analyzed_at DESC);

-- =====================================================================
-- Table: synthex_compliance_violations
-- Stores AU regulatory compliance issues detected by Reflector Agent
-- =====================================================================
CREATE TABLE IF NOT EXISTS synthex_compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('landing_page', 'email', 'ad_copy', 'proposal', 'blog_post', 'social_post')),
  content_id UUID, -- Reference to source (e.g., visual_audit_id, campaign_id)

  -- Violations detected
  violations JSONB NOT NULL DEFAULT '[]'::jsonb,
  /*
  Expected structure:
  [
    {
      "type": "GST" | "FairWork" | "ACL" | "Location" | "Language",
      "severity": "high" | "medium" | "low",
      "issue": "Price shown without GST disclosure",
      "fix": "Change '$495/month' to '$495/month inc GST'",
      "regulation_reference": "A New Tax System (Goods and Services Tax) Act 1999"
    }
  ]
  */

  -- Content versions
  original_content TEXT NOT NULL,
  fixed_content TEXT, -- Auto-fixed by Reflector
  human_reviewed BOOLEAN DEFAULT false,
  human_approved BOOLEAN,

  -- Compliance status
  compliant BOOLEAN NOT NULL,
  auto_fixed BOOLEAN DEFAULT false,
  requires_manual_review BOOLEAN DEFAULT false,

  -- Metadata
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_by TEXT DEFAULT 'reflector_agent',
  model_used TEXT, -- e.g., "claude-sonnet-4-5-20250929"
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_compliance_workspace
  ON synthex_compliance_violations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_synthex_compliance_client
  ON synthex_compliance_violations(client_id);

CREATE INDEX IF NOT EXISTS idx_synthex_compliance_status
  ON synthex_compliance_violations(workspace_id, compliant, requires_manual_review);

CREATE INDEX IF NOT EXISTS idx_synthex_compliance_checked_at
  ON synthex_compliance_violations(workspace_id, checked_at DESC);

-- RLS Policies
ALTER TABLE synthex_compliance_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON synthex_compliance_violations;
CREATE POLICY "tenant_isolation_select" ON synthex_compliance_violations
  FOR SELECT
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_insert" ON synthex_compliance_violations;
CREATE POLICY "tenant_isolation_insert" ON synthex_compliance_violations
  FOR INSERT
  WITH CHECK (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_update" ON synthex_compliance_violations;
CREATE POLICY "tenant_isolation_update" ON synthex_compliance_violations
  FOR UPDATE
  USING (workspace_id = get_current_workspace_id());

-- =====================================================================
-- Table: synthex_gbp_outreach
-- Tracks automated GBP direct message outreach to prospects
-- =====================================================================
CREATE TABLE IF NOT EXISTS synthex_gbp_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  information_vacuum_id UUID REFERENCES information_vacuums(id) ON DELETE SET NULL,

  -- Prospect identification
  prospect_name TEXT NOT NULL,
  prospect_gbp_id TEXT, -- Google Business Profile location ID
  prospect_phone TEXT,
  prospect_website TEXT,

  -- Outreach context
  keyword TEXT NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL,
  gap_detected TEXT, -- Human-readable gap description

  -- Message details
  message_sent TEXT NOT NULL,
  message_template TEXT, -- Template used (for tracking effectiveness)

  -- Response tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'replied', 'bounced', 'failed')),
  replied_at TIMESTAMPTZ,
  reply_content TEXT,

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC(12, 2),

  -- Compliance
  user_approved BOOLEAN DEFAULT false, -- If governance mode enabled
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_workspace
  ON synthex_gbp_outreach(workspace_id);

CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_client
  ON synthex_gbp_outreach(client_id);

CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_vacuum
  ON synthex_gbp_outreach(information_vacuum_id);

CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_prospect
  ON synthex_gbp_outreach(prospect_gbp_id, sent_at DESC)
  WHERE prospect_gbp_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_status
  ON synthex_gbp_outreach(workspace_id, status, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_gbp_outreach_conversion
  ON synthex_gbp_outreach(workspace_id, converted, converted_at DESC)
  WHERE converted = true;

-- RLS Policies
ALTER TABLE synthex_gbp_outreach ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON synthex_gbp_outreach;
CREATE POLICY "tenant_isolation_select" ON synthex_gbp_outreach
  FOR SELECT
  USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_insert" ON synthex_gbp_outreach;
CREATE POLICY "tenant_isolation_insert" ON synthex_gbp_outreach
  FOR INSERT
  WITH CHECK (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_update" ON synthex_gbp_outreach;
CREATE POLICY "tenant_isolation_update" ON synthex_gbp_outreach
  FOR UPDATE
  USING (workspace_id = get_current_workspace_id());

-- =====================================================================
-- Triggers for updated_at Timestamps
-- =====================================================================

DROP TRIGGER IF EXISTS update_information_vacuums_updated_at ON information_vacuums;
CREATE TRIGGER update_information_vacuums_updated_at
  BEFORE UPDATE ON information_vacuums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_synthex_gbp_outreach_updated_at ON synthex_gbp_outreach;
CREATE TRIGGER update_synthex_gbp_outreach_updated_at
  BEFORE UPDATE ON synthex_gbp_outreach
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- Comments & Documentation
-- =====================================================================

COMMENT ON TABLE information_vacuums IS 'Market gaps discovered by Scout Agent. Geographic vacuums: suburbs with low competitor density. Content vacuums: missing proof points, testimonials, service pages. Priority 1-10 determines Scout processing order.';

COMMENT ON TABLE synthex_visual_audits IS 'Visual gap recordings from Auditor Agent using Gemini Computer Use. Dual output format: video_url (Loom-style MP4) + static_page_url (Next.js). Client chooses preferred format for prospect outreach.';

COMMENT ON TABLE synthex_suburb_mapping IS 'Pre-analyzed suburb market data from overnight mapping worker. Covers 15,000+ Australian suburbs with service-specific competition analysis. Updated daily via Gemini 2.0 Flash batch processing.';

COMMENT ON TABLE synthex_compliance_violations IS 'AU regulatory compliance issues detected by Reflector Agent. Validates GST disclosure, Fair Work compliance, ACL adherence, location accuracy. Auto-fixes when possible, flags for manual review when uncertain.';

COMMENT ON TABLE synthex_gbp_outreach IS 'Automated GBP direct message outreach to prospects identified via gap analysis. Tracks message delivery, responses, and conversion to paying clients. Requires user_approved=true if governance mode enabled.';

-- =====================================================================
-- Add Foreign Key Constraints (After All Tables Created)
-- =====================================================================

-- Add FK from information_vacuums to synthex_visual_audits (now that it exists)
ALTER TABLE information_vacuums
ADD CONSTRAINT fk_information_vacuums_visual_audit
FOREIGN KEY (visual_audit_id)
REFERENCES synthex_visual_audits(id)
ON DELETE SET NULL;
