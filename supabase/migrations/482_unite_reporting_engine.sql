-- =====================================================================
-- Phase D54: External Reporting & Investor Pack Engine
-- =====================================================================
-- Tables: unite_report_templates, unite_report_sections, unite_reports,
--         unite_report_audiences
--
-- Purpose:
-- - Professional report templates for external audiences
-- - AI-powered narrative generation for reports
-- - Multi-audience support (investors, partners, stakeholders)
-- - Export to multiple formats (PDF, PowerPoint, etc.)
--
-- Key Concepts:
-- - Templates define report structure and sections
-- - Reports are instances generated from templates
-- - Audiences can have different views of the same report
-- - AI generates narratives based on data and context
-- - Uses RLS for tenant isolation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. ENUM Types
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_report_frequency') THEN
    CREATE TYPE unite_report_frequency AS ENUM (
      'one_time',
      'weekly',
      'monthly',
      'quarterly',
      'annual'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_section_type') THEN
    CREATE TYPE unite_section_type AS ENUM (
      'executive_summary',
      'metrics_overview',
      'financial_highlights',
      'growth_metrics',
      'operational_kpis',
      'market_analysis',
      'risk_assessment',
      'recommendations',
      'appendix',
      'custom'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_report_status') THEN
    CREATE TYPE unite_report_status AS ENUM (
      'draft',
      'generating',
      'review',
      'finalized',
      'sent',
      'archived'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_audience_type') THEN
    CREATE TYPE unite_audience_type AS ENUM (
      'investor',
      'board',
      'partner',
      'stakeholder',
      'internal',
      'public'
    );
  END IF;
END $$;

-- =====================================================================
-- 2. Report Templates Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Template identification
  name text NOT NULL,
  description text,
  category text, -- 'investor_update', 'board_deck', 'partner_report', etc.

  -- Template configuration
  frequency unite_report_frequency DEFAULT 'monthly',
  default_audience unite_audience_type DEFAULT 'investor',

  -- Template structure
  cover_config jsonb, -- Logo, title format, branding
  section_order text[], -- Array of section IDs in display order

  -- AI generation settings
  tone text, -- 'formal', 'conversational', 'technical'
  focus_areas text[], -- ['growth', 'profitability', 'market_share']

  -- Metadata
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 3. Report Sections Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES unite_report_templates(id) ON DELETE CASCADE,

  -- Section identification
  section_type unite_section_type NOT NULL,
  title text NOT NULL,
  section_order integer NOT NULL, -- 1, 2, 3, ...

  -- Section configuration
  data_sources jsonb, -- { "metrics": ["mrr", "churn"], "tables": ["customers"] }
  visualization_config jsonb, -- Chart types, colors, layouts
  ai_prompt_template text, -- Template for AI narrative generation

  -- Content constraints
  min_words integer,
  max_words integer,
  include_charts boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. Reports Table (Generated Instances)
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_id uuid REFERENCES unite_report_templates(id) ON DELETE SET NULL,

  -- Report identification
  title text NOT NULL,
  period_start date,
  period_end date,

  -- Report metadata
  status unite_report_status DEFAULT 'draft',
  audience_type unite_audience_type NOT NULL,

  -- Generated content
  sections jsonb, -- { "section_1": { "title": "...", "content": "...", "charts": [...] } }
  ai_generated_narrative jsonb, -- AI-generated insights and summaries
  data_snapshot jsonb, -- Captured metrics at generation time

  -- Export tracking
  exported_formats text[], -- ['pdf', 'pptx', 'html']
  export_urls jsonb, -- { "pdf": "url", "pptx": "url" }

  -- Audit
  generated_by uuid,
  generated_at timestamptz,
  finalized_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 5. Report Audiences Table (Access Control)
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_report_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  report_id uuid NOT NULL REFERENCES unite_reports(id) ON DELETE CASCADE,

  -- Audience details
  audience_name text NOT NULL, -- "Q4 2025 Investors", "Board Members"
  audience_type unite_audience_type NOT NULL,
  email_list text[], -- Array of recipient emails

  -- Access control
  access_granted_at timestamptz DEFAULT now(),
  access_expires_at timestamptz,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,

  -- Customization
  custom_message text, -- Personalized intro for this audience
  hidden_sections text[], -- Section IDs to hide for this audience

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 6. Indexes
-- =====================================================================

-- Report Templates
CREATE INDEX IF NOT EXISTS idx_unite_report_templates_tenant
  ON unite_report_templates(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_report_templates_active
  ON unite_report_templates(tenant_id, is_active);

-- Report Sections
CREATE INDEX IF NOT EXISTS idx_unite_report_sections_template
  ON unite_report_sections(template_id, section_order);

-- Reports
CREATE INDEX IF NOT EXISTS idx_unite_reports_tenant
  ON unite_reports(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_reports_status
  ON unite_reports(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_unite_reports_period
  ON unite_reports(tenant_id, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_unite_reports_template
  ON unite_reports(template_id);

-- Report Audiences
CREATE INDEX IF NOT EXISTS idx_unite_report_audiences_report
  ON unite_report_audiences(report_id);

CREATE INDEX IF NOT EXISTS idx_unite_report_audiences_tenant
  ON unite_report_audiences(tenant_id);

-- =====================================================================
-- 7. RLS Policies
-- =====================================================================

ALTER TABLE unite_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_report_audiences ENABLE ROW LEVEL SECURITY;

-- Report Templates
DROP POLICY IF EXISTS "tenant_isolation" ON unite_report_templates;
CREATE POLICY "tenant_isolation" ON unite_report_templates
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Reports
DROP POLICY IF EXISTS "tenant_isolation" ON unite_reports;
CREATE POLICY "tenant_isolation" ON unite_reports
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Report Audiences
DROP POLICY IF EXISTS "tenant_isolation" ON unite_report_audiences;
CREATE POLICY "tenant_isolation" ON unite_report_audiences
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 8. Helper Functions
-- =====================================================================

/**
 * Get report generation summary for a tenant
 */
CREATE OR REPLACE FUNCTION unite_get_report_summary(
  p_tenant_id uuid,
  p_months integer DEFAULT 12
) RETURNS TABLE(
  total_reports bigint,
  reports_by_status jsonb,
  reports_by_audience jsonb,
  avg_generation_time_minutes numeric,
  most_used_template_id uuid,
  most_used_template_name text
) AS $$
BEGIN
  RETURN QUERY
  WITH report_stats AS (
    SELECT
      COUNT(*)::bigint AS total,
      jsonb_object_agg(
        status,
        count
      ) AS by_status,
      jsonb_object_agg(
        audience_type,
        aud_count
      ) AS by_audience,
      AVG(
        EXTRACT(EPOCH FROM (finalized_at - generated_at)) / 60
      )::numeric AS avg_time
    FROM unite_reports
    WHERE tenant_id = p_tenant_id
      AND generated_at >= NOW() - (p_months || ' months')::interval
    GROUP BY status, audience_type
  ),
  popular_template AS (
    SELECT
      r.template_id,
      t.name AS template_name,
      COUNT(*) AS usage_count
    FROM unite_reports r
    LEFT JOIN unite_report_templates t ON r.template_id = t.id
    WHERE r.tenant_id = p_tenant_id
      AND r.generated_at >= NOW() - (p_months || ' months')::interval
    GROUP BY r.template_id, t.name
    ORDER BY usage_count DESC
    LIMIT 1
  )
  SELECT
    COALESCE(rs.total, 0) AS total_reports,
    COALESCE(rs.by_status, '{}'::jsonb) AS reports_by_status,
    COALESCE(rs.by_audience, '{}'::jsonb) AS reports_by_audience,
    COALESCE(rs.avg_time, 0) AS avg_generation_time_minutes,
    pt.template_id AS most_used_template_id,
    pt.template_name AS most_used_template_name
  FROM report_stats rs
  CROSS JOIN popular_template pt;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get report sections with template info
 */
CREATE OR REPLACE FUNCTION unite_get_report_sections_with_template(
  p_template_id uuid
) RETURNS TABLE(
  section_id uuid,
  section_type unite_section_type,
  section_title text,
  section_order integer,
  data_sources jsonb,
  ai_prompt_template text,
  template_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS section_id,
    s.section_type,
    s.title AS section_title,
    s.section_order,
    s.data_sources,
    s.ai_prompt_template,
    t.name AS template_name
  FROM unite_report_sections s
  JOIN unite_report_templates t ON s.template_id = t.id
  WHERE s.template_id = p_template_id
  ORDER BY s.section_order ASC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get audience engagement metrics for a report
 */
CREATE OR REPLACE FUNCTION unite_get_report_engagement(
  p_report_id uuid
) RETURNS TABLE(
  audience_name text,
  audience_type unite_audience_type,
  recipient_count integer,
  total_views bigint,
  last_viewed timestamptz,
  engagement_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.audience_name,
    a.audience_type,
    COALESCE(array_length(a.email_list, 1), 0) AS recipient_count,
    a.view_count::bigint AS total_views,
    a.last_viewed_at,
    CASE
      WHEN COALESCE(array_length(a.email_list, 1), 0) > 0
      THEN (a.view_count::numeric / array_length(a.email_list, 1)::numeric) * 100
      ELSE 0
    END AS engagement_rate
  FROM unite_report_audiences a
  WHERE a.report_id = p_report_id
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_report_summary IS 'Get report generation statistics for a tenant';
COMMENT ON FUNCTION unite_get_report_sections_with_template IS 'Get all sections for a template with template metadata';
COMMENT ON FUNCTION unite_get_report_engagement IS 'Get audience engagement metrics for a report';
