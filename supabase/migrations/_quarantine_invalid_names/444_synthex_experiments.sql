-- =====================================================
-- Migration 444: Synthex Experimentation & A/B Testing
-- Phase B41: Experimentation & A/B Testing Engine
-- =====================================================
-- Full-featured experimentation engine for A/B and
-- multivariate tests across emails, subject lines,
-- CTAs, content, and send-times
-- =====================================================

-- =====================================================
-- Table: synthex_experiments
-- Main experiment configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    -- What we're testing
    object_type TEXT NOT NULL CHECK (object_type IN ('subject_line', 'email_body', 'cta', 'content_block', 'send_time', 'landing_page', 'form')),
    object_ref TEXT NOT NULL,
    -- Metrics and hypothesis
    primary_metric TEXT NOT NULL,
    secondary_metrics TEXT[],
    hypothesis TEXT,
    -- Targeting
    segment_id UUID,
    traffic_percentage INT DEFAULT 100 CHECK (traffic_percentage >= 1 AND traffic_percentage <= 100),
    -- Timeline
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    -- Winner
    winning_variant_id UUID,
    decided_at TIMESTAMPTZ,
    decision_reason TEXT,
    -- Metadata
    created_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_experiments IS 'A/B and multivariate experiments';
COMMENT ON COLUMN synthex_experiments.object_type IS 'Type of object being tested';
COMMENT ON COLUMN synthex_experiments.object_ref IS 'Reference to the object (campaign_id, template_id, etc.)';
COMMENT ON COLUMN synthex_experiments.primary_metric IS 'Primary success metric (open_rate, click_rate, conversion_rate, etc.)';

-- =====================================================
-- Table: synthex_experiment_variants
-- Variants within an experiment
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_experiment_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_control BOOLEAN DEFAULT false,
    weight NUMERIC DEFAULT 1 CHECK (weight > 0),
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_experiment_variants IS 'Variants (treatments) within an experiment';
COMMENT ON COLUMN synthex_experiment_variants.is_control IS 'True if this is the control/baseline variant';
COMMENT ON COLUMN synthex_experiment_variants.weight IS 'Traffic weight for this variant (relative to others)';
COMMENT ON COLUMN synthex_experiment_variants.config IS 'Variant-specific configuration (subject line text, CTA text, etc.)';

-- =====================================================
-- Table: synthex_experiment_assignments
-- Contact-to-variant assignments for consistency
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_experiments(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL,
    variant_id UUID NOT NULL REFERENCES synthex_experiment_variants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (experiment_id, contact_id)
);

COMMENT ON TABLE synthex_experiment_assignments IS 'Tracks which variant each contact sees for experiment consistency';

-- =====================================================
-- Table: synthex_experiment_metrics
-- Aggregated metrics per variant per day
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_experiment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES synthex_experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES synthex_experiment_variants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    count BIGINT DEFAULT 0,
    value_sum NUMERIC DEFAULT 0,
    last_event_at TIMESTAMPTZ,
    period DATE NOT NULL,
    UNIQUE (experiment_id, variant_id, event_type, period)
);

COMMENT ON TABLE synthex_experiment_metrics IS 'Aggregated experiment metrics by variant and day';
COMMENT ON COLUMN synthex_experiment_metrics.event_type IS 'Type of event (impression, open, click, conversion, etc.)';
COMMENT ON COLUMN synthex_experiment_metrics.value_sum IS 'Sum of values for value-based metrics (revenue, etc.)';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_experiments_tenant ON synthex_experiments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_experiments_status ON synthex_experiments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_experiments_object ON synthex_experiments(object_type, object_ref);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_variants_experiment ON synthex_experiment_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_assignments_experiment ON synthex_experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_assignments_contact ON synthex_experiment_assignments(experiment_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_metrics_experiment ON synthex_experiment_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_metrics_variant ON synthex_experiment_metrics(experiment_id, variant_id, period DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_experiment_metrics_period ON synthex_experiment_metrics(experiment_id, event_type, period);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_experiment_metrics ENABLE ROW LEVEL SECURITY;

-- Experiments scoped to tenant
CREATE POLICY "Experiments scoped to tenant"
    ON synthex_experiments FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Variants follow experiment access
CREATE POLICY "Variants follow experiment access"
    ON synthex_experiment_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Assignments follow experiment access
CREATE POLICY "Assignments follow experiment access"
    ON synthex_experiment_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Metrics follow experiment access
CREATE POLICY "Metrics follow experiment access"
    ON synthex_experiment_metrics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_experiments e
            WHERE e.id = experiment_id
            AND e.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- =====================================================
-- Function: Get experiment summary with stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_experiment_summary(p_experiment_id UUID)
RETURNS TABLE (
    variant_id UUID,
    variant_name TEXT,
    is_control BOOLEAN,
    impressions BIGINT,
    opens BIGINT,
    clicks BIGINT,
    conversions BIGINT,
    open_rate NUMERIC,
    click_rate NUMERIC,
    conversion_rate NUMERIC,
    lift_vs_control NUMERIC
) AS $$
DECLARE
    v_control_conversion_rate NUMERIC;
BEGIN
    -- Get control conversion rate first
    SELECT
        CASE WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
            THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::NUMERIC /
                  COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1))
            ELSE 0
        END INTO v_control_conversion_rate
    FROM synthex_experiment_variants v
    LEFT JOIN synthex_experiment_metrics m ON m.variant_id = v.id
    WHERE v.experiment_id = p_experiment_id
      AND v.is_control = true
    GROUP BY v.id;

    RETURN QUERY
    SELECT
        v.id AS variant_id,
        v.name AS variant_name,
        v.is_control,
        COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0)::BIGINT AS impressions,
        COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'open'), 0)::BIGINT AS opens,
        COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 0)::BIGINT AS clicks,
        COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::BIGINT AS conversions,
        CASE WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
            THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'open'), 0)::NUMERIC /
                  COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1) * 100)
            ELSE 0
        END::NUMERIC AS open_rate,
        CASE WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'open'), 0) > 0
            THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'click'), 0)::NUMERIC /
                  COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'open'), 1) * 100)
            ELSE 0
        END::NUMERIC AS click_rate,
        CASE WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
            THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::NUMERIC /
                  COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1) * 100)
            ELSE 0
        END::NUMERIC AS conversion_rate,
        CASE WHEN v_control_conversion_rate > 0 AND NOT v.is_control
            THEN ((CASE WHEN COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 0) > 0
                       THEN (COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'conversion'), 0)::NUMERIC /
                             COALESCE(SUM(m.count) FILTER (WHERE m.event_type = 'impression'), 1))
                       ELSE 0 END) - v_control_conversion_rate) / v_control_conversion_rate * 100
            ELSE 0
        END::NUMERIC AS lift_vs_control
    FROM synthex_experiment_variants v
    LEFT JOIN synthex_experiment_metrics m ON m.variant_id = v.id
    WHERE v.experiment_id = p_experiment_id
    GROUP BY v.id, v.name, v.is_control
    ORDER BY v.is_control DESC, conversions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_experiment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_experiments_updated ON synthex_experiments;
CREATE TRIGGER trg_synthex_experiments_updated
    BEFORE UPDATE ON synthex_experiments
    FOR EACH ROW EXECUTE FUNCTION update_experiment_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_experiments TO authenticated;
GRANT ALL ON synthex_experiment_variants TO authenticated;
GRANT ALL ON synthex_experiment_assignments TO authenticated;
GRANT ALL ON synthex_experiment_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_experiment_summary(UUID) TO authenticated;
