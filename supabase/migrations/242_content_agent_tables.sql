-- Phase 5 Agent 3: Content Agent Tables
-- Stores content generation requests, outputs, and governance decisions

CREATE TABLE IF NOT EXISTS content_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  topic TEXT NOT NULL,
  audience TEXT,
  content TEXT NOT NULL,
  summary TEXT NOT NULL,
  thinking_process TEXT,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  tone_aligned BOOLEAN NOT NULL DEFAULT FALSE,
  tone_issues TEXT[],
  matched_tones TEXT[],
  approval_status TEXT NOT NULL DEFAULT 'pending_review',
  requires_founder_review BOOLEAN NOT NULL DEFAULT FALSE,
  founder_reviewed_at TIMESTAMP WITH TIME ZONE,
  founder_decision TEXT,
  founder_notes TEXT,
  ready_to_use BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  research_integrated JSONB,
  metadata JSONB,
  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_intent CHECK (intent IN ('email', 'post', 'script', 'article', 'ad', 'training', 'website')),
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (approval_status IN ('auto_approved', 'pending_review', 'pending_approval', 'rejected'))
);

-- Content variants for A/B testing
CREATE TABLE IF NOT EXISTS content_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  output_id UUID NOT NULL REFERENCES content_outputs(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL,
  content TEXT NOT NULL,
  tone_shift TEXT,
  length_adjustment TEXT,
  personalization_level TEXT,
  performance_metrics JSONB,
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT valid_variant_type CHECK (variant_type IN ('tone_adjusted', 'length_optimized', 'personalized', 'simplified', 'detailed'))
);

-- Research integration log
CREATE TABLE IF NOT EXISTS content_research_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  content_id UUID NOT NULL REFERENCES content_outputs(id) ON DELETE CASCADE,
  research_id UUID NOT NULL REFERENCES research_insights(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  citation_needed BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT valid_integration_type CHECK (integration_type IN ('supports_claim', 'provides_context', 'strengthens_narrative', 'illustrates_point'))
);

-- Content performance tracking
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  content_id UUID NOT NULL REFERENCES content_outputs(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  performance_event TEXT NOT NULL,
  event_data JSONB NOT NULL,
  metric_value DECIMAL(10, 2),
  CONSTRAINT valid_performance_event CHECK (performance_event IN ('sent', 'viewed', 'engaged', 'clicked', 'converted', 'bounced', 'unsubscribed'))
);

-- Enable RLS
ALTER TABLE content_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_research_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY content_outputs_authenticated_read ON content_outputs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY content_variants_authenticated_read ON content_variants
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY content_research_links_authenticated_read ON content_research_links
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY content_performance_authenticated_read ON content_performance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_outputs_brand ON content_outputs(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_outputs_intent ON content_outputs(intent);
CREATE INDEX IF NOT EXISTS idx_content_outputs_risk ON content_outputs(risk_level);
CREATE INDEX IF NOT EXISTS idx_content_outputs_status ON content_outputs(approval_status);
CREATE INDEX IF NOT EXISTS idx_content_outputs_requires_review ON content_outputs(requires_founder_review);
CREATE INDEX IF NOT EXISTS idx_content_outputs_ready ON content_outputs(ready_to_use);
CREATE INDEX IF NOT EXISTS idx_content_outputs_created ON content_outputs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_variants_output ON content_variants(output_id);
CREATE INDEX IF NOT EXISTS idx_content_variants_type ON content_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_content_variants_selected ON content_variants(selected);

CREATE INDEX IF NOT EXISTS idx_content_research_links_content ON content_research_links(content_id);
CREATE INDEX IF NOT EXISTS idx_content_research_links_research ON content_research_links(research_id);

CREATE INDEX IF NOT EXISTS idx_content_performance_content ON content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_event ON content_performance(performance_event);
CREATE INDEX IF NOT EXISTS idx_content_performance_created ON content_performance(created_at DESC);

-- Comments
COMMENT ON TABLE content_outputs IS 'Stores content generation requests and outputs with risk assessment and founder governance routing.';
COMMENT ON TABLE content_variants IS 'A/B testing variants for optimizing content performance (tone, length, personalization).';
COMMENT ON TABLE content_research_links IS 'Links content outputs to research insights for citation and evidence tracking.';
COMMENT ON TABLE content_performance IS 'Tracks content performance metrics (sends, views, clicks, conversions, etc.).';

COMMENT ON COLUMN content_outputs.intent IS 'Content type: email, post, script, article, ad, training, or website.';
COMMENT ON COLUMN content_outputs.risk_level IS 'Risk classification: low (0-19), medium (20-39), high (40-69), critical (70+).';
COMMENT ON COLUMN content_outputs.tone_aligned IS 'TRUE if content aligns with brand tone guidelines and positioning.';
COMMENT ON COLUMN content_outputs.requires_founder_review IS 'TRUE if risk level is high/critical OR tone alignment fails.';
COMMENT ON COLUMN content_outputs.ready_to_use IS 'TRUE if approved by founder or auto-approved by system.';
COMMENT ON COLUMN content_outputs.thinking_process IS 'Record of extended thinking process (for transparency and debugging).';
COMMENT ON COLUMN content_research_links.integration_type IS 'How research is integrated: supports claim, provides context, strengthens narrative, or illustrates point.';
