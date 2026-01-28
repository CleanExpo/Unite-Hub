-- =====================================================
-- Migration 039: Autonomous Client Intelligence System
-- =====================================================
-- Date: 2025-11-18
-- Purpose: Email intelligence, questionnaires, autonomous tasks, knowledge graph

-- 1. EMAIL INTELLIGENCE
CREATE TABLE IF NOT EXISTS email_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES client_emails(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  ideas JSONB DEFAULT '[]',
  business_goals JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  questions_asked TEXT[],
  decisions_made TEXT[],
  sentiment TEXT,
  energy_level INTEGER,
  decision_readiness INTEGER,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_model TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_intelligence_email ON email_intelligence(email_id);
CREATE INDEX IF NOT EXISTS idx_email_intelligence_contact ON email_intelligence(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_intelligence_workspace ON email_intelligence(workspace_id);

-- 2. DYNAMIC QUESTIONNAIRES
CREATE TABLE IF NOT EXISTS dynamic_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  created_from TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_contact ON dynamic_questionnaires(contact_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_workspace ON dynamic_questionnaires(workspace_id);

-- 3. QUESTIONNAIRE RESPONSES
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES dynamic_questionnaires(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer TEXT,
  answer_data JSONB,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);

-- 4. AUTONOMOUS TASKS
CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  assigned_agent TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'queued',
  depends_on UUID[],
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON autonomous_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON autonomous_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON autonomous_tasks(status);

-- 5. MARKETING STRATEGIES
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
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  generated_by TEXT,
  generated_from JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategies_contact ON marketing_strategies(contact_id);
CREATE INDEX IF NOT EXISTS idx_strategies_workspace ON marketing_strategies(workspace_id);

-- 6. KNOWLEDGE GRAPH NODES
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  source_type TEXT,
  source_id UUID,
  confidence_score NUMERIC(3,2),
  importance_score INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_workspace ON knowledge_graph_nodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_contact ON knowledge_graph_nodes(contact_id);

-- 7. KNOWLEDGE GRAPH EDGES
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  label TEXT,
  strength NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_workspace ON knowledge_graph_edges(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_graph_edges(source_node_id);

-- TRIGGERS (reuse existing function)
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

-- RLS POLICIES
ALTER TABLE email_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS email_intelligence_workspace_isolation ON email_intelligence;
CREATE POLICY email_intelligence_workspace_isolation ON email_intelligence
  FOR ALL USING (true);

DROP POLICY IF EXISTS questionnaires_workspace_isolation ON dynamic_questionnaires;
CREATE POLICY questionnaires_workspace_isolation ON dynamic_questionnaires
  FOR ALL USING (true);

DROP POLICY IF EXISTS tasks_workspace_isolation ON autonomous_tasks;
CREATE POLICY tasks_workspace_isolation ON autonomous_tasks
  FOR ALL USING (true);

DROP POLICY IF EXISTS strategies_workspace_isolation ON marketing_strategies;
CREATE POLICY strategies_workspace_isolation ON marketing_strategies
  FOR ALL USING (true);

DROP POLICY IF EXISTS knowledge_nodes_workspace_isolation ON knowledge_graph_nodes;
CREATE POLICY knowledge_nodes_workspace_isolation ON knowledge_graph_nodes
  FOR ALL USING (true);

DROP POLICY IF EXISTS knowledge_edges_workspace_isolation ON knowledge_graph_edges;
CREATE POLICY knowledge_edges_workspace_isolation ON knowledge_graph_edges
  FOR ALL USING (true);

DROP POLICY IF EXISTS responses_workspace_isolation ON questionnaire_responses;
CREATE POLICY responses_workspace_isolation ON questionnaire_responses
  FOR ALL USING (true);
