-- Migration 136: Global Compliance & Cultural Adaptation Engine
-- Phase 93: GCCAE - Region-aware compliance and cultural localisation

-- ============================================================================
-- Table 1: compliance_policies
-- Registry of region + platform specific policy rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope
  region_slug TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Policy details
  policy_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description_markdown TEXT NOT NULL,
  example_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_policies_region_platform
  ON compliance_policies(region_slug, platform);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_policy_code
  ON compliance_policies(policy_code);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_active
  ON compliance_policies(is_active) WHERE is_active = true;

-- ============================================================================
-- Table 2: locale_profiles
-- Cultural and localisation settings per region/locale
-- ============================================================================

CREATE TABLE IF NOT EXISTS locale_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  region_slug TEXT NOT NULL,
  locale_code TEXT NOT NULL,

  -- Spelling and tone
  spelling_variant TEXT NOT NULL,
  tone_guidelines JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Cultural context
  holiday_calendar JSONB NOT NULL DEFAULT '[]'::jsonb,
  sensitivity_flags JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Unique constraint
  UNIQUE(region_slug, locale_code)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_locale_profiles_region
  ON locale_profiles(region_slug);

-- ============================================================================
-- Table 3: compliance_incidents
-- Logs compliance warnings and blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Context
  platform TEXT NOT NULL,
  policy_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('warning', 'blocked', 'overridden')),

  -- Details
  content_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes_markdown TEXT NOT NULL,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_incidents_agency_created
  ON compliance_incidents(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_incidents_client
  ON compliance_incidents(client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_incidents_severity
  ON compliance_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_incidents_status
  ON compliance_incidents(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locale_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_incidents ENABLE ROW LEVEL SECURITY;

-- Compliance policies
CREATE POLICY "Authenticated users can read active policies" ON compliance_policies
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin manages all policies" ON compliance_policies
  FOR ALL USING (true);

-- Locale profiles
CREATE POLICY "Authenticated users can read locale profiles" ON locale_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manages locale profiles" ON locale_profiles
  FOR ALL USING (true);

-- Compliance incidents
CREATE POLICY "Agency members can view their incidents" ON compliance_incidents
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'member')
    )
  );

CREATE POLICY "Admin manages all incidents" ON compliance_incidents
  FOR ALL USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get active policies for region and platform
CREATE OR REPLACE FUNCTION get_active_policies(
  p_region_slug TEXT,
  p_platform TEXT
)
RETURNS TABLE (
  id UUID,
  policy_code TEXT,
  severity TEXT,
  description_markdown TEXT,
  example_patterns JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.policy_code,
    cp.severity,
    cp.description_markdown,
    cp.example_patterns
  FROM compliance_policies cp
  WHERE cp.region_slug = p_region_slug
    AND (cp.platform = p_platform OR cp.platform = 'generic')
    AND cp.is_active = true
  ORDER BY
    CASE cp.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Get locale profile
CREATE OR REPLACE FUNCTION get_locale_profile(
  p_region_slug TEXT,
  p_locale_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_profile locale_profiles%ROWTYPE;
BEGIN
  IF p_locale_code IS NOT NULL THEN
    SELECT * INTO v_profile
    FROM locale_profiles
    WHERE region_slug = p_region_slug AND locale_code = p_locale_code;
  ELSE
    -- Get default locale for region
    SELECT * INTO v_profile
    FROM locale_profiles
    WHERE region_slug = p_region_slug
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'region_slug', v_profile.region_slug,
    'locale_code', v_profile.locale_code,
    'spelling_variant', v_profile.spelling_variant,
    'tone_guidelines', v_profile.tone_guidelines,
    'holiday_calendar', v_profile.holiday_calendar,
    'sensitivity_flags', v_profile.sensitivity_flags
  );
END;
$$ LANGUAGE plpgsql;

-- Get incident summary for agency
CREATE OR REPLACE FUNCTION get_compliance_incident_summary(p_agency_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'by_severity', jsonb_build_object(
      'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
      'high', COUNT(*) FILTER (WHERE severity = 'high'),
      'medium', COUNT(*) FILTER (WHERE severity = 'medium'),
      'low', COUNT(*) FILTER (WHERE severity = 'low')
    ),
    'by_status', jsonb_build_object(
      'warning', COUNT(*) FILTER (WHERE status = 'warning'),
      'blocked', COUNT(*) FILTER (WHERE status = 'blocked'),
      'overridden', COUNT(*) FILTER (WHERE status = 'overridden')
    ),
    'unresolved', COUNT(*) FILTER (WHERE resolved_at IS NULL),
    'last_30_days', COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')
  ) INTO v_summary
  FROM compliance_incidents
  WHERE agency_id = p_agency_id;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Default Policies
-- ============================================================================

-- Australia policies
INSERT INTO compliance_policies (region_slug, platform, policy_code, severity, description_markdown, example_patterns) VALUES
('au', 'generic', 'HEALTH_CLAIMS', 'high',
  '## Health Claims\n\nAustralia has strict rules under the Therapeutic Goods Act. Avoid making therapeutic claims unless products are registered with the TGA.\n\n**This is not legal advice. Consult a qualified professional.**',
  '["cure", "treat", "heal", "prevent disease", "therapeutic", "clinical", "medical"]'::jsonb),
('au', 'generic', 'FINANCIAL_PROMISES', 'critical',
  '## Financial Promises\n\nASIC regulates financial promotions. Avoid guarantees of returns or income.\n\n**This is not legal advice. Consult a qualified professional.**',
  '["guaranteed returns", "risk-free", "get rich", "financial freedom guaranteed", "double your money"]'::jsonb),
('au', 'generic', 'TESTIMONIAL_ATYPICAL', 'medium',
  '## Testimonials\n\nACCC requires testimonials to be typical results. Disclose if results are not typical.\n\n**This is not legal advice.**',
  '["I made $X", "lost X kg", "results not typical", "individual results"]'::jsonb),
('au', 'facebook', 'META_PROHIBITED_CONTENT', 'high',
  '## Meta Prohibited Content\n\nMeta prohibits certain content types including discriminatory practices, weapons, and adult content.\n\n**Review Meta Advertising Policies.**',
  '["before/after weight loss", "personal attributes", "surveillance equipment"]'::jsonb)
ON CONFLICT DO NOTHING;

-- US policies
INSERT INTO compliance_policies (region_slug, platform, policy_code, severity, description_markdown, example_patterns) VALUES
('us', 'generic', 'FTC_ENDORSEMENTS', 'high',
  '## FTC Endorsement Guidelines\n\nMaterial connections must be disclosed. Use #ad or #sponsored clearly.\n\n**This is not legal advice.**',
  '["sponsored", "gifted", "partner", "affiliate", "paid promotion"]'::jsonb),
('us', 'generic', 'HEALTH_CLAIMS_FDA', 'critical',
  '## FDA Health Claims\n\nHealth claims require FDA approval. Structure/function claims have specific requirements.\n\n**This is not legal advice. Consult a qualified professional.**',
  '["cures", "treats", "prevents", "diagnoses", "FDA approved"]'::jsonb)
ON CONFLICT DO NOTHING;

-- UK policies
INSERT INTO compliance_policies (region_slug, platform, policy_code, severity, description_markdown, example_patterns) VALUES
('uk', 'generic', 'ASA_CAP_CODE', 'high',
  '## ASA CAP Code\n\nAll marketing must be legal, decent, honest and truthful under UK advertising codes.\n\n**This is not legal advice.**',
  '["free", "guarantee", "best", "number one", "proven"]'::jsonb),
('uk', 'generic', 'GDPR_CONSENT', 'critical',
  '## GDPR Consent\n\nExplicit consent required for personal data processing. Document all consent.\n\n**This is not legal advice.**',
  '["subscribe", "sign up", "newsletter", "email list", "personal data"]'::jsonb)
ON CONFLICT DO NOTHING;

-- EU policies
INSERT INTO compliance_policies (region_slug, platform, policy_code, severity, description_markdown, example_patterns) VALUES
('eu', 'generic', 'GDPR_COMPLIANCE', 'critical',
  '## GDPR Compliance\n\nStrict data protection rules apply. Ensure lawful basis for processing.\n\n**This is not legal advice.**',
  '["personal data", "tracking", "cookies", "profiling", "consent"]'::jsonb),
('eu', 'generic', 'GREEN_CLAIMS', 'high',
  '## Green Claims Directive\n\nEnvironmental claims must be substantiated and not misleading.\n\n**This is not legal advice.**',
  '["eco-friendly", "sustainable", "carbon neutral", "green", "environmentally friendly"]'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Seed Default Locale Profiles
-- ============================================================================

INSERT INTO locale_profiles (region_slug, locale_code, spelling_variant, tone_guidelines, holiday_calendar, sensitivity_flags) VALUES
('au', 'en-AU', 'australian',
  '{"formality": "casual-professional", "directness": "direct", "humor": "allowed-subtle", "notes": "Australians prefer straightforward communication without excessive formality. Avoid Americanisms."}'::jsonb,
  '[{"name": "Australia Day", "date": "01-26", "note": "Sensitive - consider Indigenous perspectives"}, {"name": "ANZAC Day", "date": "04-25", "note": "Respectful tone required"}, {"name": "Melbourne Cup", "date": "first-tuesday-november", "note": "Widely celebrated"}]'::jsonb,
  '["indigenous_issues", "gambling_promotion", "alcohol_promotion"]'::jsonb),
('us', 'en-US', 'american',
  '{"formality": "varies-by-industry", "directness": "very-direct", "humor": "allowed", "notes": "Americans appreciate enthusiasm and positivity. Use US spelling and date formats."}'::jsonb,
  '[{"name": "Independence Day", "date": "07-04"}, {"name": "Thanksgiving", "date": "fourth-thursday-november"}, {"name": "Memorial Day", "date": "last-monday-may"}]'::jsonb,
  '["political_content", "religious_content", "gun_related"]'::jsonb),
('uk', 'en-GB', 'british',
  '{"formality": "moderate", "directness": "polite-indirect", "humor": "dry-wit-appreciated", "notes": "British audiences prefer understatement. Avoid overselling."}'::jsonb,
  '[{"name": "Bank Holidays", "date": "varies"}, {"name": "Bonfire Night", "date": "11-05"}, {"name": "Boxing Day", "date": "12-26"}]'::jsonb,
  '["class_references", "political_content", "royal_family"]'::jsonb),
('nz', 'en-NZ', 'british',
  '{"formality": "casual", "directness": "direct-but-humble", "humor": "self-deprecating", "notes": "New Zealanders value humility and authenticity. Avoid tall poppy syndrome triggers."}'::jsonb,
  '[{"name": "Waitangi Day", "date": "02-06", "note": "Sensitive - Māori perspectives important"}, {"name": "ANZAC Day", "date": "04-25"}]'::jsonb,
  '["maori_culture", "indigenous_issues"]'::jsonb),
('ca', 'en-CA', 'canadian',
  '{"formality": "moderate-polite", "directness": "polite", "humor": "friendly", "notes": "Canadians appreciate politeness and inclusivity. Consider both English and French audiences."}'::jsonb,
  '[{"name": "Canada Day", "date": "07-01"}, {"name": "Thanksgiving", "date": "second-monday-october"}, {"name": "Victoria Day", "date": "monday-before-may-25"}]'::jsonb,
  '["french_canadian_content", "indigenous_reconciliation", "us_comparisons"]'::jsonb)
ON CONFLICT (region_slug, locale_code) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE compliance_policies IS 'Phase 93: Region + platform compliance policy rules';
COMMENT ON TABLE locale_profiles IS 'Phase 93: Cultural and localisation settings';
COMMENT ON TABLE compliance_incidents IS 'Phase 93: Compliance warnings and blocks log';

COMMENT ON COLUMN compliance_policies.severity IS 'low | medium | high | critical';
COMMENT ON COLUMN compliance_incidents.status IS 'warning | blocked | overridden';
COMMENT ON COLUMN locale_profiles.spelling_variant IS 'australian | american | british | canadian';
