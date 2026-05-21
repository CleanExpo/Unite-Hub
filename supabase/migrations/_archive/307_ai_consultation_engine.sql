-- Migration 307: AI Consultation Engine Tables
-- Adds AI Consultation sessions with explanation mode support

-- AI Consultations Table (chat sessions)
CREATE TABLE IF NOT EXISTS ai_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB,
  explanation_mode TEXT NOT NULL DEFAULT 'founder',
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_explanation_mode CHECK (
    explanation_mode IN ('eli5', 'beginner', 'technical', 'founder')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'closed')
  )
);

-- AI Consultation Messages Table
CREATE TABLE IF NOT EXISTS ai_consultation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES ai_consultations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  explanation_mode TEXT NOT NULL DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (
    role IN ('client', 'assistant', 'system')
  ),
  CONSTRAINT valid_msg_explanation_mode CHECK (
    explanation_mode IN ('eli5', 'beginner', 'technical', 'founder')
  )
);

-- AI Consultation Insights Table (extracted insights from conversations)
CREATE TABLE IF NOT EXISTS ai_consultation_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES ai_consultations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_business ON ai_consultations(business_id);
CREATE INDEX IF NOT EXISTS idx_consultations_client ON ai_consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON ai_consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation ON ai_consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created ON ai_consultation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_consultation_insights_consultation ON ai_consultation_insights(consultation_id);

-- RLS Policies
ALTER TABLE ai_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultation_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view their consultations" ON ai_consultations;
DROP POLICY IF EXISTS "Users can create consultations" ON ai_consultations;
DROP POLICY IF EXISTS "Users can update their consultations" ON ai_consultations;
DROP POLICY IF EXISTS "Users can view consultation messages" ON ai_consultation_messages;
DROP POLICY IF EXISTS "Users can insert consultation messages" ON ai_consultation_messages;
DROP POLICY IF EXISTS "Users can view consultation insights" ON ai_consultation_insights;
DROP POLICY IF EXISTS "Users can insert consultation insights" ON ai_consultation_insights;

-- Consultations: users can manage their own
CREATE POLICY "Users can view their consultations"
  ON ai_consultations FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create consultations"
  ON ai_consultations FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can update their consultations"
  ON ai_consultations FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Messages: linked to consultations
CREATE POLICY "Users can view consultation messages"
  ON ai_consultation_messages FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE
        business_id IN (SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid())
        OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert consultation messages"
  ON ai_consultation_messages FOR INSERT
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE
        business_id IN (SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid())
        OR created_by = auth.uid()
    )
  );

-- Insights: linked to consultations
CREATE POLICY "Users can view consultation insights"
  ON ai_consultation_insights FOR SELECT
  USING (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE
        business_id IN (SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid())
        OR created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert consultation insights"
  ON ai_consultation_insights FOR INSERT
  WITH CHECK (
    consultation_id IN (
      SELECT id FROM ai_consultations WHERE
        business_id IN (SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid())
        OR created_by = auth.uid()
    )
  );
