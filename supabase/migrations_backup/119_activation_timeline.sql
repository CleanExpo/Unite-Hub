-- Migration 119: 90-Day Activation Timeline System
-- Phase 53: Client activation program with milestones

-- Activation programs table
CREATE TABLE IF NOT EXISTS activation_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  program_type TEXT NOT NULL DEFAULT '90_day_standard',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  current_phase INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  overall_progress INTEGER NOT NULL DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  phase_1_progress INTEGER NOT NULL DEFAULT 0 CHECK (phase_1_progress >= 0 AND phase_1_progress <= 100),
  phase_2_progress INTEGER NOT NULL DEFAULT 0 CHECK (phase_2_progress >= 0 AND phase_2_progress <= 100),
  phase_3_progress INTEGER NOT NULL DEFAULT 0 CHECK (phase_3_progress >= 0 AND phase_3_progress <= 100),
  industry TEXT,
  custom_focus_areas JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation milestones table
CREATE TABLE IF NOT EXISTS activation_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES activation_programs(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 3),
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('audit', 'setup', 'content', 'seo', 'social', 'review', 'report', 'other')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped', 'blocked')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  linked_job_id UUID,
  linked_audit_id UUID,
  deliverables JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation events/timeline table
CREATE TABLE IF NOT EXISTS activation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES activation_programs(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES activation_milestones(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('milestone_completed', 'phase_advanced', 'program_started', 'program_completed', 'status_change', 'note_added', 'deliverable_uploaded')),
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID,
  actor_type TEXT DEFAULT 'system' CHECK (actor_type IN ('system', 'staff', 'client', 'ai')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase templates for different industries
CREATE TABLE IF NOT EXISTS activation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default 90-day template
INSERT INTO activation_templates (name, industry, is_default, phases) VALUES
(
  'Standard 90-Day Activation',
  NULL,
  TRUE,
  '[
    {
      "phase": 1,
      "name": "Foundation",
      "days": "1-14",
      "description": "Audits, data ingestion, welcome pack, initial roadmap",
      "milestones": [
        {"day": 1, "title": "Welcome call & kickoff", "category": "setup"},
        {"day": 2, "title": "Platform access & onboarding", "category": "setup"},
        {"day": 3, "title": "Data import & cleanup", "category": "setup"},
        {"day": 5, "title": "Website technical audit", "category": "audit"},
        {"day": 7, "title": "SEO baseline audit", "category": "audit"},
        {"day": 9, "title": "Competitor analysis", "category": "audit"},
        {"day": 11, "title": "Google Business Profile audit", "category": "audit"},
        {"day": 14, "title": "90-day roadmap presentation", "category": "report"}
      ]
    },
    {
      "phase": 2,
      "name": "Implementation",
      "days": "15-45",
      "description": "Website fixes, SEO quick wins, branding basics, social baseline",
      "milestones": [
        {"day": 16, "title": "Priority website fixes", "category": "setup"},
        {"day": 20, "title": "On-page SEO implementation", "category": "seo"},
        {"day": 25, "title": "Local citations submission", "category": "seo"},
        {"day": 28, "title": "Content calendar created", "category": "content"},
        {"day": 32, "title": "First blog post published", "category": "content"},
        {"day": 35, "title": "Review request system active", "category": "review"},
        {"day": 38, "title": "Social profiles optimized", "category": "social"},
        {"day": 42, "title": "First social content batch", "category": "social"},
        {"day": 45, "title": "30-day progress report", "category": "report"}
      ]
    },
    {
      "phase": 3,
      "name": "Momentum & Proof",
      "days": "46-90",
      "description": "Content program, geo expansion, review packs, quarterly report",
      "milestones": [
        {"day": 50, "title": "Monthly content published", "category": "content"},
        {"day": 55, "title": "Video content script", "category": "content"},
        {"day": 60, "title": "Geo-expansion pages", "category": "seo"},
        {"day": 65, "title": "Case study draft", "category": "content"},
        {"day": 70, "title": "Review pack completed", "category": "review"},
        {"day": 75, "title": "Email campaign launched", "category": "content"},
        {"day": 80, "title": "Social proof assets", "category": "social"},
        {"day": 85, "title": "Performance analysis", "category": "report"},
        {"day": 90, "title": "Quarterly report & renewal", "category": "report"}
      ]
    }
  ]'::jsonb
);

-- Enable RLS
ALTER TABLE activation_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their org activation programs"
  ON activation_programs FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org activation programs"
  ON activation_programs FOR ALL
  USING (organization_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view milestones for their programs"
  ON activation_milestones FOR SELECT
  USING (program_id IN (
    SELECT id FROM activation_programs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage milestones for their programs"
  ON activation_milestones FOR ALL
  USING (program_id IN (
    SELECT id FROM activation_programs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can view events for their programs"
  ON activation_events FOR SELECT
  USING (program_id IN (
    SELECT id FROM activation_programs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can add events to their programs"
  ON activation_events FOR INSERT
  WITH CHECK (program_id IN (
    SELECT id FROM activation_programs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Anyone can view activation templates"
  ON activation_templates FOR SELECT
  USING (TRUE);

-- Indexes
CREATE INDEX idx_activation_programs_org ON activation_programs(organization_id);
CREATE INDEX idx_activation_programs_client ON activation_programs(client_id);
CREATE INDEX idx_activation_programs_status ON activation_programs(status);
CREATE INDEX idx_activation_milestones_program ON activation_milestones(program_id);
CREATE INDEX idx_activation_milestones_phase ON activation_milestones(phase);
CREATE INDEX idx_activation_milestones_status ON activation_milestones(status);
CREATE INDEX idx_activation_events_program ON activation_events(program_id);
CREATE INDEX idx_activation_events_type ON activation_events(event_type);
