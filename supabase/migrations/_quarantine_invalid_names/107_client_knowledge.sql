-- Phase 36: MVP Client Truth Layer
-- Client Knowledge Engine tables

-- Client Knowledge Items table
CREATE TABLE IF NOT EXISTS client_knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'note', 'upload', 'meeting')),
  source_id TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_items_client ON client_knowledge_items(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_source ON client_knowledge_items(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_created ON client_knowledge_items(created_at DESC);

-- Enable RLS
ALTER TABLE client_knowledge_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "clients_view_own_knowledge" ON client_knowledge_items
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_insert_own_knowledge" ON client_knowledge_items
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "service_role_all_knowledge" ON client_knowledge_items
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Client Persona Profiles table
CREATE TABLE IF NOT EXISTS client_persona_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  persona_summary TEXT,
  goals TEXT,
  constraints TEXT,
  audience TEXT,
  brand_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_persona_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "clients_view_own_persona" ON client_persona_profiles
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_upsert_own_persona" ON client_persona_profiles
FOR ALL USING (client_id = auth.uid());

CREATE POLICY "service_role_all_persona" ON client_persona_profiles
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON client_knowledge_items TO authenticated;
GRANT ALL ON client_persona_profiles TO authenticated;
