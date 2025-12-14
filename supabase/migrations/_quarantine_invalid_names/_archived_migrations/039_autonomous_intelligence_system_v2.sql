-- =====================================================
-- Migration 039 v2: Autonomous Client Intelligence System
-- =====================================================
-- Purpose: Add tables for email intelligence extraction, dynamic questionnaires,
--          autonomous task execution, and marketing strategy generation
-- Date: 2025-11-18
-- Version: 2 (Idempotent - safe to re-run)
-- Dependencies: Requires existing contacts, client_emails, workspaces tables

-- =====================================================
-- 1. EMAIL INTELLIGENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES client_emails(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Extracted business intelligence
  ideas JSONB DEFAULT '[]',
  business_goals JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  questions_asked TEXT[],
  decisions_made TEXT[],

  -- Sentiment analysis
  sentiment TEXT CHECK (sentiment IN ('excited', 'concerned', 'neutral', 'frustrated')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  decision_readiness INTEGER CHECK (decision_readiness BETWEEN 1 AND 10),

  -- AI metadata
  analyzed_at TIMESTAMP DEFAULT NOW(),
  ai_model TEXT,
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes (idempotent)
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_email_intelligence_email ON email_intelligence(email_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_email_intelligence_contact ON email_intelligence(contact_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_email_intelligence_workspace ON email_intelligence(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_email_intelligence_analyzed_at ON email_intelligence(analyzed_at DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 2. DYNAMIC QUESTIONNAIRES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS dynamic_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]',

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  created_from TEXT CHECK (created_from IN ('ai_analysis', 'manual', 'template')),

  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_questionnaires_contact ON dynamic_questionnaires(contact_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_questionnaires_workspace ON dynamic_questionnaires(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_questionnaires_status ON dynamic_questionnaires(status);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 3. QUESTIONNAIRE RESPONSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES dynamic_questionnaires(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,

  answer TEXT,
  answer_data JSONB,

  answered_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_responses_question ON questionnaire_responses(question_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 4. AUTONOMOUS TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'content', 'design', 'campaign', 'analysis', 'email',
    'social_media', 'research', 'strategy', 'other'
  )),
  assigned_agent TEXT NOT NULL,

  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  depends_on UUID[],

  input_data JSONB,
  output_data JSONB,
  error_message TEXT,

  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON autonomous_tasks(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_contact ON autonomous_tasks(contact_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON autonomous_tasks(status);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON autonomous_tasks(priority DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_agent ON autonomous_tasks(assigned_agent);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 5. MARKETING STRATEGIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  strategy_name TEXT NOT NULL,
  strategy_document JSONB,

  target_audience JSONB,
  brand_positioning JSONB,
  content_pillars JSONB,
  campaign_calendar JSONB,
  kpis JSONB,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'archived')),
  version INTEGER DEFAULT 1,

  generated_by TEXT,
  generated_from JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_strategies_contact ON marketing_strategies(contact_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_strategies_workspace ON marketing_strategies(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_strategies_status ON marketing_strategies(status);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_strategies_version ON marketing_strategies(version DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 6. KNOWLEDGE GRAPH NODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  node_type TEXT NOT NULL CHECK (node_type IN (
    'idea', 'goal', 'pain_point', 'requirement', 'decision',
    'question', 'persona', 'competitor', 'technology', 'other'
  )),
  label TEXT NOT NULL,
  description TEXT,

  source_type TEXT CHECK (source_type IN ('email', 'questionnaire', 'manual', 'ai_inference')),
  source_id UUID,

  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 10),
  properties JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_workspace ON knowledge_graph_nodes(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_contact ON knowledge_graph_nodes(contact_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_graph_nodes(node_type);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_importance ON knowledge_graph_nodes(importance_score DESC);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 7. KNOWLEDGE GRAPH EDGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  source_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,

  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'supports', 'conflicts', 'requires', 'suggests', 'caused_by',
    'leads_to', 'related_to', 'part_of', 'alternative_to'
  )),

  label TEXT,
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),

  created_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_edges_workspace ON knowledge_graph_edges(workspace_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_graph_edges(source_node_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_graph_edges(target_node_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON knowledge_graph_edges(relationship_type);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- 8. AUTO-UPDATE TRIGGERS
-- =====================================================

-- Create function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_email_intelligence_updated_at ON email_intelligence;
CREATE TRIGGER update_email_intelligence_updated_at BEFORE UPDATE ON email_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaires_updated_at ON dynamic_questionnaires;
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON dynamic_questionnaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON autonomous_tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON autonomous_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON marketing_strategies;
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON marketing_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_nodes_updated_at ON knowledge_graph_nodes;
CREATE TRIGGER update_knowledge_nodes_updated_at BEFORE UPDATE ON knowledge_graph_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. RLS POLICIES (Row Level Security)
-- =====================================================

ALTER TABLE email_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS email_intelligence_workspace_isolation ON email_intelligence;
DROP POLICY IF EXISTS questionnaires_workspace_isolation ON dynamic_questionnaires;
DROP POLICY IF EXISTS responses_workspace_isolation ON questionnaire_responses;
DROP POLICY IF EXISTS tasks_workspace_isolation ON autonomous_tasks;
DROP POLICY IF EXISTS strategies_workspace_isolation ON marketing_strategies;
DROP POLICY IF EXISTS knowledge_nodes_workspace_isolation ON knowledge_graph_nodes;
DROP POLICY IF EXISTS knowledge_edges_workspace_isolation ON knowledge_graph_edges;

-- Check if user_workspaces exists, otherwise use user_organizations
DO $$
DECLARE
  workspace_table TEXT;
BEGIN
  -- Check which table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_workspaces') THEN
    workspace_table := 'user_workspaces';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
    workspace_table := 'user_organizations';
  ELSE
    RAISE EXCEPTION 'Neither user_workspaces nor user_organizations table exists';
  END IF;

  -- Create policies using the appropriate table
  EXECUTE format('
    CREATE POLICY email_intelligence_workspace_isolation ON email_intelligence
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);

  EXECUTE format('
    CREATE POLICY questionnaires_workspace_isolation ON dynamic_questionnaires
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);

  EXECUTE format('
    CREATE POLICY tasks_workspace_isolation ON autonomous_tasks
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);

  EXECUTE format('
    CREATE POLICY strategies_workspace_isolation ON marketing_strategies
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);

  EXECUTE format('
    CREATE POLICY knowledge_nodes_workspace_isolation ON knowledge_graph_nodes
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);

  EXECUTE format('
    CREATE POLICY knowledge_edges_workspace_isolation ON knowledge_graph_edges
    USING (workspace_id IN (
      SELECT workspace_id FROM %I WHERE user_id = auth.uid()
    ))', workspace_table);
END $$;

-- Special policy for responses (through questionnaires)
CREATE POLICY responses_workspace_isolation ON questionnaire_responses
  USING (questionnaire_id IN (
    SELECT id FROM dynamic_questionnaires WHERE workspace_id IN (
      SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_contact_intelligence_summary(p_contact_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_emails_analyzed', COUNT(DISTINCT email_id),
    'avg_sentiment', AVG(
      CASE sentiment
        WHEN 'excited' THEN 2
        WHEN 'neutral' THEN 0
        WHEN 'concerned' THEN -1
        WHEN 'frustrated' THEN -2
        ELSE 0
      END
    ),
    'avg_energy_level', AVG(energy_level),
    'avg_decision_readiness', AVG(decision_readiness)
  ) INTO result
  FROM email_intelligence
  WHERE contact_id = p_contact_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'email_intelligence',
    'dynamic_questionnaires',
    'questionnaire_responses',
    'autonomous_tasks',
    'marketing_strategies',
    'knowledge_graph_nodes',
    'knowledge_graph_edges'
  );

  RAISE NOTICE '✅ Migration 039 v2 Complete!';
  RAISE NOTICE '📊 Tables created/verified: % of 7', table_count;
  RAISE NOTICE '🔒 All tables have RLS enabled with workspace isolation';

  IF table_count = 7 THEN
    RAISE NOTICE '✨ SUCCESS: All tables ready for use!';
  ELSE
    RAISE WARNING '⚠️  Only % tables found. Expected 7. Check errors above.', table_count;
  END IF;
END $$;
