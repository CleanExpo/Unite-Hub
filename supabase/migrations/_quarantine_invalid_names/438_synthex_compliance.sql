-- =====================================================
-- Migration 438: Synthex AI Compliance Validator
-- Phase D09: AI Compliance Validation
-- =====================================================
-- Validates marketing content against CAN-SPAM, GDPR,
-- ACMA (Australia), CCPA, and other regulatory frameworks.
-- =====================================================

-- =====================================================
-- Table: synthex_library_compliance_frameworks
-- Supported compliance frameworks and their rules
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_compliance_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Framework Identity
    code TEXT NOT NULL UNIQUE, -- e.g., 'can-spam', 'gdpr', 'acma'
    name TEXT NOT NULL, -- e.g., 'CAN-SPAM Act'
    description TEXT,
    jurisdiction TEXT, -- e.g., 'United States', 'European Union', 'Australia'

    -- Applicability
    content_types TEXT[] DEFAULT '{}', -- e.g., ['email', 'sms']
    applies_to_b2b BOOLEAN DEFAULT true,
    applies_to_b2c BOOLEAN DEFAULT true,

    -- Requirements (stored as JSON for flexibility)
    requirements JSONB NOT NULL DEFAULT '[]',
    -- Example: [
    --   { "code": "physical_address", "description": "Must include physical address", "severity": "required" },
    --   { "code": "unsubscribe", "description": "Must have clear unsubscribe option", "severity": "required" },
    --   { "code": "sender_id", "description": "Must identify sender", "severity": "required" }
    -- ]

    -- Penalties
    max_penalty TEXT, -- e.g., "$46,517 per violation"
    penalty_details TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    effective_date DATE,
    last_updated DATE,

    -- Metadata
    documentation_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_compliance_frameworks IS 'Compliance frameworks and their requirements';

-- Insert default frameworks
INSERT INTO synthex_library_compliance_frameworks (code, name, description, jurisdiction, content_types, requirements, max_penalty, documentation_url) VALUES
('can-spam', 'CAN-SPAM Act', 'Controlling the Assault of Non-Solicited Pornography And Marketing Act', 'United States', ARRAY['email'],
 '[
   {"code": "sender_identity", "description": "Clear identification of sender", "severity": "required"},
   {"code": "subject_accuracy", "description": "Subject line must not be deceptive", "severity": "required"},
   {"code": "ad_disclosure", "description": "Message must be identified as advertisement", "severity": "required"},
   {"code": "physical_address", "description": "Valid physical postal address required", "severity": "required"},
   {"code": "unsubscribe_option", "description": "Clear and conspicuous opt-out mechanism", "severity": "required"},
   {"code": "unsubscribe_honor", "description": "Honor opt-out within 10 business days", "severity": "required"},
   {"code": "no_harvested_emails", "description": "Cannot use harvested email addresses", "severity": "required"}
 ]'::jsonb,
 '$46,517 per violation',
 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business'
),
('gdpr', 'GDPR', 'General Data Protection Regulation', 'European Union', ARRAY['email', 'sms', 'push', 'social_post'],
 '[
   {"code": "consent", "description": "Valid consent before processing", "severity": "required"},
   {"code": "consent_proof", "description": "Ability to prove consent was given", "severity": "required"},
   {"code": "data_minimization", "description": "Only collect necessary data", "severity": "required"},
   {"code": "purpose_limitation", "description": "Data used only for stated purpose", "severity": "required"},
   {"code": "right_to_access", "description": "Data subjects can access their data", "severity": "required"},
   {"code": "right_to_erasure", "description": "Right to be forgotten", "severity": "required"},
   {"code": "privacy_notice", "description": "Clear privacy notice provided", "severity": "required"},
   {"code": "data_protection_officer", "description": "DPO contact if required", "severity": "conditional"}
 ]'::jsonb,
 '4% of annual global turnover or €20M',
 'https://gdpr.eu/'
),
('acma', 'Spam Act 2003', 'Australian Communications and Media Authority Spam Regulations', 'Australia', ARRAY['email', 'sms'],
 '[
   {"code": "consent", "description": "Recipient must have consented", "severity": "required"},
   {"code": "sender_identity", "description": "Clear sender identification", "severity": "required"},
   {"code": "contact_details", "description": "Valid contact information", "severity": "required"},
   {"code": "unsubscribe_functional", "description": "Functional unsubscribe facility", "severity": "required"},
   {"code": "unsubscribe_address", "description": "Unsubscribe address in message", "severity": "required"},
   {"code": "australian_link", "description": "Sender must have Australian link", "severity": "required"}
 ]'::jsonb,
 'AUD $2.22 million per day',
 'https://www.acma.gov.au/spam'
),
('ccpa', 'CCPA', 'California Consumer Privacy Act', 'California, USA', ARRAY['email', 'sms', 'push'],
 '[
   {"code": "privacy_notice", "description": "Notice at collection", "severity": "required"},
   {"code": "opt_out_sale", "description": "Do Not Sell My Personal Information link", "severity": "required"},
   {"code": "data_access", "description": "Right to know what data is collected", "severity": "required"},
   {"code": "data_deletion", "description": "Right to delete personal data", "severity": "required"},
   {"code": "non_discrimination", "description": "No discrimination for exercising rights", "severity": "required"}
 ]'::jsonb,
 '$7,500 per intentional violation',
 'https://oag.ca.gov/privacy/ccpa'
),
('casl', 'CASL', 'Canadian Anti-Spam Legislation', 'Canada', ARRAY['email', 'sms'],
 '[
   {"code": "express_consent", "description": "Express or implied consent required", "severity": "required"},
   {"code": "sender_identity", "description": "Identify who is sending", "severity": "required"},
   {"code": "contact_info", "description": "Provide contact information", "severity": "required"},
   {"code": "unsubscribe", "description": "Unsubscribe mechanism in every message", "severity": "required"},
   {"code": "unsubscribe_free", "description": "Unsubscribe must be free", "severity": "required"},
   {"code": "honor_10_days", "description": "Honor unsubscribe within 10 days", "severity": "required"}
 ]'::jsonb,
 'CAD $10 million per violation',
 'https://crtc.gc.ca/eng/internet/anti.htm'
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Table: synthex_library_compliance_checks
-- Individual compliance check results
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- What was checked
    content_type TEXT NOT NULL, -- 'template', 'email', 'sms', 'campaign'
    content_id UUID,
    content_preview TEXT, -- First 500 chars
    content_hash TEXT, -- For deduplication

    -- Frameworks checked
    frameworks_checked TEXT[] NOT NULL, -- e.g., ['can-spam', 'gdpr']
    target_jurisdictions TEXT[] DEFAULT '{}', -- e.g., ['US', 'EU', 'AU']

    -- Overall Result
    is_compliant BOOLEAN NOT NULL,
    compliance_score NUMERIC(3,2), -- 0.00 - 1.00
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

    -- Issues Found
    issues JSONB DEFAULT '[]',
    -- Example: [
    --   {
    --     "framework": "can-spam",
    --     "requirement": "physical_address",
    --     "severity": "required",
    --     "status": "missing",
    --     "description": "No physical address found in content",
    --     "suggestion": "Add your physical mailing address",
    --     "location": null
    --   }
    -- ]

    -- Passes
    passes JSONB DEFAULT '[]',
    -- Requirements that passed

    -- Warnings (not violations but recommendations)
    warnings JSONB DEFAULT '[]',

    -- AI Analysis
    ai_analysis TEXT, -- Full AI reasoning
    ai_model TEXT,
    confidence NUMERIC(3,2),

    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,

    -- Metadata
    checked_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ, -- When check becomes stale
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_compliance_checks IS 'Compliance check results for content';

-- =====================================================
-- Table: synthex_library_compliance_exemptions
-- Documented exemptions from compliance rules
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_compliance_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- What is exempted
    framework_code TEXT NOT NULL,
    requirement_code TEXT NOT NULL,

    -- Scope
    scope TEXT DEFAULT 'tenant' CHECK (scope IN (
        'tenant', 'content_type', 'specific_content'
    )),
    content_type TEXT,
    content_id UUID,

    -- Justification
    reason TEXT NOT NULL,
    legal_basis TEXT, -- e.g., 'B2B transactional exception'
    documentation_url TEXT,

    -- Approval
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    legal_review BOOLEAN DEFAULT false,
    legal_reviewer TEXT,

    -- Validity
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_compliance_exemptions IS 'Documented compliance exemptions';

-- =====================================================
-- Table: synthex_library_compliance_reports
-- Compliance audit reports
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Report Scope
    report_type TEXT NOT NULL CHECK (report_type IN (
        'snapshot', 'audit', 'monthly', 'quarterly', 'annual'
    )),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    frameworks TEXT[] NOT NULL,

    -- Summary Stats
    total_content_checked INTEGER DEFAULT 0,
    compliant_count INTEGER DEFAULT 0,
    non_compliant_count INTEGER DEFAULT 0,
    compliance_rate NUMERIC(5,2), -- Percentage

    -- Issue Breakdown
    issues_by_severity JSONB DEFAULT '{}', -- { "critical": 5, "high": 12, ... }
    issues_by_framework JSONB DEFAULT '{}', -- { "can-spam": 10, "gdpr": 5 }
    issues_by_requirement JSONB DEFAULT '{}', -- { "physical_address": 8, ... }
    most_common_issues JSONB DEFAULT '[]',

    -- Trends
    vs_previous_period JSONB DEFAULT '{}', -- Comparison data
    trend_direction TEXT, -- 'improving', 'declining', 'stable'

    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    priority_actions JSONB DEFAULT '[]',

    -- Report Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'generated', 'reviewed', 'published'
    )),
    generated_at TIMESTAMPTZ,
    generated_by TEXT, -- 'system' or user_id

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE synthex_library_compliance_reports IS 'Compliance audit reports';

-- =====================================================
-- Table: synthex_library_compliance_settings
-- Tenant compliance configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_compliance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Active Frameworks
    enabled_frameworks TEXT[] DEFAULT ARRAY['can-spam', 'gdpr'],
    default_jurisdictions TEXT[] DEFAULT ARRAY['US', 'EU'],

    -- Auto-check Settings
    auto_check_templates BOOLEAN DEFAULT true,
    auto_check_campaigns BOOLEAN DEFAULT true,
    block_non_compliant BOOLEAN DEFAULT false, -- Prevent sending non-compliant content

    -- Strictness
    strictness_level TEXT DEFAULT 'standard' CHECK (strictness_level IN (
        'lenient', 'standard', 'strict'
    )),

    -- Business Context
    business_type TEXT, -- 'b2b', 'b2c', 'both'
    physical_address TEXT, -- Default address for compliance
    company_name TEXT,
    contact_email TEXT,
    unsubscribe_url TEXT, -- Default unsubscribe URL

    -- Notifications
    notify_on_violations BOOLEAN DEFAULT true,
    notify_email TEXT,
    notify_slack_webhook TEXT,

    -- Reports
    auto_generate_monthly_report BOOLEAN DEFAULT true,
    report_recipients TEXT[] DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_compliance_settings IS 'Tenant compliance configuration';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_compliance_checks_tenant
    ON synthex_library_compliance_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_content
    ON synthex_library_compliance_checks(content_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_compliant
    ON synthex_library_compliance_checks(is_compliant);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_risk
    ON synthex_library_compliance_checks(risk_level);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_date
    ON synthex_library_compliance_checks(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_exemptions_tenant
    ON synthex_library_compliance_exemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_exemptions_framework
    ON synthex_library_compliance_exemptions(framework_code);
CREATE INDEX IF NOT EXISTS idx_compliance_exemptions_active
    ON synthex_library_compliance_exemptions(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_tenant
    ON synthex_library_compliance_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type
    ON synthex_library_compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_date
    ON synthex_library_compliance_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_settings_tenant
    ON synthex_library_compliance_settings(tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_compliance_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_compliance_settings ENABLE ROW LEVEL SECURITY;

-- Compliance Checks RLS
DROP POLICY IF EXISTS compliance_checks_tenant_policy ON synthex_library_compliance_checks;
CREATE POLICY compliance_checks_tenant_policy ON synthex_library_compliance_checks
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Exemptions RLS
DROP POLICY IF EXISTS compliance_exemptions_tenant_policy ON synthex_library_compliance_exemptions;
CREATE POLICY compliance_exemptions_tenant_policy ON synthex_library_compliance_exemptions
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Reports RLS
DROP POLICY IF EXISTS compliance_reports_tenant_policy ON synthex_library_compliance_reports;
CREATE POLICY compliance_reports_tenant_policy ON synthex_library_compliance_reports
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Settings RLS
DROP POLICY IF EXISTS compliance_settings_tenant_policy ON synthex_library_compliance_settings;
CREATE POLICY compliance_settings_tenant_policy ON synthex_library_compliance_settings
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trigger_compliance_settings_updated ON synthex_library_compliance_settings;
CREATE TRIGGER trigger_compliance_settings_updated
    BEFORE UPDATE ON synthex_library_compliance_settings
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

-- =====================================================
-- Function: Calculate compliance risk level
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_compliance_risk(issues JSONB)
RETURNS TEXT AS $$
DECLARE
    critical_count INTEGER;
    high_count INTEGER;
    medium_count INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE i->>'severity' = 'required' AND i->>'status' = 'missing'),
        COUNT(*) FILTER (WHERE i->>'severity' = 'required' AND i->>'status' = 'partial'),
        COUNT(*) FILTER (WHERE i->>'severity' = 'recommended' AND i->>'status' = 'missing')
    INTO critical_count, high_count, medium_count
    FROM jsonb_array_elements(issues) AS i;

    IF critical_count > 0 THEN
        RETURN 'critical';
    ELSIF high_count > 0 THEN
        RETURN 'high';
    ELSIF medium_count > 2 THEN
        RETURN 'medium';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Function: Get active exemptions for content
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_exemptions(
    p_tenant_id UUID,
    p_framework_code TEXT,
    p_content_type TEXT DEFAULT NULL,
    p_content_id UUID DEFAULT NULL
)
RETURNS TABLE (requirement_code TEXT, reason TEXT, legal_basis TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.requirement_code,
        e.reason,
        e.legal_basis
    FROM synthex_library_compliance_exemptions e
    WHERE e.tenant_id = p_tenant_id
      AND e.framework_code = p_framework_code
      AND e.is_active = true
      AND (e.valid_until IS NULL OR e.valid_until > now())
      AND (
          e.scope = 'tenant'
          OR (e.scope = 'content_type' AND e.content_type = p_content_type)
          OR (e.scope = 'specific_content' AND e.content_id = p_content_id)
      );
END;
$$ LANGUAGE plpgsql;
